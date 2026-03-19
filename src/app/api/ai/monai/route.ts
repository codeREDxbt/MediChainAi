/**
 * /api/ai/monai/route.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Proxies a scan file stored in Supabase through the MONAI Python microservice
 * for specialised medical-image segmentation / classification.
 *
 * POST /api/ai/monai
 * Body (JSON): { scanId: string }
 *
 * The route:
 *   1. Authenticates the caller via JWT cookie
 *   2. Fetches the scan record + raw file from Supabase Storage
 *   3. POSTs the file to the MONAI service as multipart/form-data
 *   4. Saves the structured result into analysis_results (Supabase)
 *   5. Updates the scan status to "Analyzed"
 * ──────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// ── Types ─────────────────────────────────────────────────────────────────

interface MonaiResponse {
    label: string;
    confidence: number;
    findings: {
        summary: string;
        details: string[];
        urgent: boolean;
    };
    segmentation_overlay_base64: string | null;
    model_used: string;
    inference_seconds: number;
    modality: string;
    filename: string;
}

// ── Auth helper ───────────────────────────────────────────────────────────

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

// ── Handler ───────────────────────────────────────────────────────────────

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
        return NextResponse.json({ error: "Invalid request body – expected { scanId }" }, { status: 400 });
    }

    if (!scanId) {
        return NextResponse.json({ error: "scanId is required" }, { status: 400 });
    }

    // ── 1. Fetch scan metadata ──────────────────────────────────────────────
    const { data: scan, error: scanError } = await supabaseServer
        .from("scans")
        .select("*, analysis_results(*)")
        .eq("id", scanId)
        .eq("user_id", user.sub)
        .single();

    if (scanError || !scan) {
        return NextResponse.json({ error: "Scan not found or unauthorized" }, { status: 404 });
    }

    // ── 2. Check if already analyzed by MONAI ──────────────────────────────
    const existing = Array.isArray(scan.analysis_results)
        ? scan.analysis_results[0]
        : scan.analysis_results;

    if (existing?.model_source === "monai") {
        return NextResponse.json(
            { error: "Scan already has a MONAI analysis result" },
            { status: 400 }
        );
    }

    // ── 3. Download file from Supabase Storage ─────────────────────────────
    const filePath = (scan.file_hash as string) || "";
    const { data: fileData, error: fileError } = await supabaseServer.storage
        .from("scans")
        .download(filePath);

    if (fileError || !fileData) {
        return NextResponse.json(
            { error: "Failed to retrieve scan file", details: fileError?.message },
            { status: 502 }
        );
    }

    // ── 4. Forward to MONAI service ────────────────────────────────────────
    const originalName = (scan.original_name as string) || filePath.split("/").pop() || "scan.dcm";
    const modality = (scan.modality as string) || "CT";

    const formData = new FormData();
    formData.append("file", new Blob([await fileData.arrayBuffer()]), originalName);
    formData.append("modality", modality);

    let monaiResult: MonaiResponse;
    try {
        const monaiRes = await fetch(`${monaiUrl}/analyze`, {
            method: "POST",
            body: formData,
            headers: monaiSharedSecret
                ? {
                    "x-monai-shared-secret": monaiSharedSecret,
                }
                : undefined,
            // Allow up to 5 minutes for heavy 3-D inference on CPU
            signal: AbortSignal.timeout(300_000),
        });

        if (!monaiRes.ok) {
            const errText = await monaiRes.text();
            return NextResponse.json(
                { error: "MONAI service error", details: errText },
                { status: monaiRes.status }
            );
        }

        monaiResult = await monaiRes.json() as MonaiResponse;
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            { error: "Failed to reach MONAI service", details: msg },
            { status: 502 }
        );
    }

    // ── 5. Persist results to Supabase ─────────────────────────────────────
    const { data: analysis, error: insertError } = await supabaseServer
        .from("analysis_results")
        .insert({
            scan_id: scanId,
            confidence_score: monaiResult.confidence,
            findings: {
                summary: monaiResult.findings.summary,
                details: monaiResult.findings.details,
                urgent: monaiResult.findings.urgent,
                primary_label: monaiResult.label,
                model_used: monaiResult.model_used,
                inference_seconds: monaiResult.inference_seconds,
                segmentation_overlay: monaiResult.segmentation_overlay_base64,
            },
            model_source: "monai",
        })
        .select()
        .single();

    if (insertError) {
        console.error("analysis_results insert error:", insertError);
        return NextResponse.json(
            { error: "Failed to save MONAI analysis", details: insertError },
            { status: 500 }
        );
    }

    // Update scan status
    await supabaseServer
        .from("scans")
        .update({ status: "Analyzed" })
        .eq("id", scanId);

    return NextResponse.json({
        success: true,
        analysis,
        monai: {
            label: monaiResult.label,
            confidence: monaiResult.confidence,
            model_used: monaiResult.model_used,
            inference_seconds: monaiResult.inference_seconds,
            has_overlay: !!monaiResult.segmentation_overlay_base64,
        },
        message: `MONAI analysis complete using ${monaiResult.model_used}`,
    });
}
