import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  callMonaiService,
  combineProviderConfidence,
  isMonaiSupported,
  mergeAnalysisFindings,
} from "@/lib/monai";

async function getUserFromRequest() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;

  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipRateLimit = checkRateLimit(`monai:${ip}`, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 20,
  });

  if (!ipRateLimit.success) {
    return NextResponse.json({ error: "Too many analysis requests. Please try again later." }, { status: 429 });
  }

  const user = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRateLimit = checkRateLimit(`monai-user:${user.sub}`, {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  });

  if (!userRateLimit.success) {
    return NextResponse.json({ error: "Hourly analysis quota exceeded." }, { status: 429 });
  }

  const monaiUrl = process.env.MONAI_SERVICE_URL;
  const monaiSharedSecret = process.env.MONAI_SHARED_SECRET;
  if (!monaiUrl) {
    return NextResponse.json(
      { error: "MONAI service is not configured", details: "MONAI_SERVICE_URL is missing" },
      { status: 503 }
    );
  }

  let scanId: string;
  try {
    ({ scanId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body; expected { scanId }" }, { status: 400 });
  }

  if (!scanId) {
    return NextResponse.json({ error: "scanId is required" }, { status: 400 });
  }

  const { data: scan, error: scanError } = await supabaseServer
    .from("scans")
    .select("*, analysis_results(*)")
    .eq("id", scanId)
    .eq("user_id", user.sub)
    .single();

  if (scanError || !scan) {
    return NextResponse.json({ error: "Scan not found or unauthorized" }, { status: 404 });
  }

  const filePath = (scan.file_hash as string) || "";
  if (!isMonaiSupported(filePath)) {
    return NextResponse.json(
      { error: "Unsupported scan format for MONAI", details: `File path: ${filePath}` },
      { status: 415 }
    );
  }

  const { data: fileData, error: fileError } = await supabaseServer.storage
    .from("scans")
    .download(filePath);

  if (fileError || !fileData) {
    return NextResponse.json(
      { error: "Failed to retrieve scan file", details: fileError?.message },
      { status: 502 }
    );
  }

  await supabaseServer
    .from("scans")
    .update({ status: "Processing" })
    .eq("id", scanId);

  try {
    const originalName = (scan.original_name as string) || filePath.split("/").pop() || "scan.dcm";
    const modality = (scan.modality as string) || "CT";

    const monaiResult = await callMonaiService({
      serviceUrl: monaiUrl,
      sharedSecret: monaiSharedSecret,
      fileBytes: await fileData.arrayBuffer(),
      filename: originalName,
      modality,
    });

    const existingAnalysis = Array.isArray(scan.analysis_results)
      ? scan.analysis_results[0]
      : scan.analysis_results;

    const mergedFindings = mergeAnalysisFindings({
      existing: existingAnalysis?.findings,
      monai: monaiResult,
    });
    const mergedConfidence = combineProviderConfidence({
      monai: monaiResult.confidence_source === "model_probability" ? monaiResult.confidence : null,
      fallback: null,
    });

    const mutation = existingAnalysis
      ? supabaseServer
          .from("analysis_results")
          .update({
            confidence_score: mergedConfidence,
            findings: mergedFindings,
          })
          .eq("id", existingAnalysis.id)
      : supabaseServer
          .from("analysis_results")
          .insert({
            scan_id: scanId,
            confidence_score: mergedConfidence,
            findings: mergedFindings,
          });

    const { data: analysisRows, error: mutationError } = await mutation.select().single();

    if (mutationError) {
      console.error("analysis_results mutation error:", mutationError);
      return NextResponse.json(
        { error: "Failed to save MONAI analysis", details: mutationError.message },
        { status: 500 }
      );
    }

    await supabaseServer
      .from("scans")
      .update({ status: "Analyzed" })
      .eq("id", scanId);

    return NextResponse.json({
      success: true,
      analysis: analysisRows,
      monai: {
        label: monaiResult.label,
        confidence: monaiResult.confidence,
        analysis_mode: monaiResult.analysis_mode,
        confidence_source: monaiResult.confidence_source,
        model_used: monaiResult.model_used,
        inference_seconds: monaiResult.inference_seconds,
        has_overlay: !!monaiResult.segmentation_overlay_base64,
      },
      message: monaiResult.analysis_mode === "bundle"
        ? `MONAI analysis complete using ${monaiResult.model_used}`
        : "MONAI could not produce a trained result for this upload",
    });
  } catch (err) {
    await supabaseServer
      .from("scans")
      .update({ status: "Pending Review" })
      .eq("id", scanId);

    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to reach MONAI service", details: msg },
      { status: 502 }
    );
  }
}
