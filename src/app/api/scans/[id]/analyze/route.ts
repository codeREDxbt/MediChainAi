import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import bs58 from "bs58";
import dicomParser from "dicom-parser";
import { PNG } from "pngjs";
import { hasAnalysisSource } from "@/lib/analysis-results";

const VISION_MODEL = "meta-llama/llama-3.2-11b-vision-instruct";

const SUPPORTED_VISION_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
]);

type Findings = {
  summary: string;
  details: string[];
  urgent: boolean;
};

type ParserMode = "fenced-json" | "embedded-json" | "plain-text";

type AnalysisResult = {
  confidence: number;
  findings: Findings;
  parserMode: ParserMode;
};

const MODALITY_BASE_CONFIDENCE: Record<string, number> = {
  xray: 76,
  ct: 72,
  mri: 70,
  ultrasound: 68,
  pet: 67,
  mammography: 73,
  unknown: 66,
};

function getFileExtension(filePath: string): string {
  const normalized = filePath.toLowerCase();
  if (normalized.endsWith(".nii.gz")) return "nii.gz";
  return normalized.split(".").pop() || "bin";
}

function isVisionSupported(filePath: string): boolean {
  return SUPPORTED_VISION_EXTENSIONS.has(getFileExtension(filePath));
}

function parseFirstNumber(value?: string | null): number | null {
  if (!value) return null;
  const first = value.split("\\")[0]?.trim();
  if (!first) return null;
  const parsed = Number(first);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPngPreviewFromDicom(buffer: Buffer): Buffer | null {
  try {
    const byteArray = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const dataSet = dicomParser.parseDicom(byteArray);

    const rows = dataSet.uint16('x00280010') ?? dataSet.intString('x00280010');
    const cols = dataSet.uint16('x00280011') ?? dataSet.intString('x00280011');
    const bitsAllocated = dataSet.uint16('x00280100') ?? 16;
    const pixelRepresentation = dataSet.uint16('x00280103') ?? dataSet.intString('x00280103') ?? 0;

    if (!rows || !cols) return null;

    const pixelDataElement = dataSet.elements['x7fe00010'];
    if (!pixelDataElement) return null;

    const pixelCount = rows * cols;
    if (!Number.isFinite(pixelCount) || pixelCount <= 0 || pixelCount > 4096 * 4096) return null;

    const offset = pixelDataElement.dataOffset;
    let pixels: Int16Array | Uint8Array | Uint16Array;

    if (bitsAllocated > 8) {
      pixels = pixelRepresentation === 1
        ? new Int16Array(buffer.buffer, buffer.byteOffset + offset, pixelCount)
        : new Uint16Array(buffer.buffer, buffer.byteOffset + offset, pixelCount);
    } else {
      pixels = new Uint8Array(buffer.buffer, buffer.byteOffset + offset, pixelCount);
    }

    const rescaleIntercept = parseFirstNumber(dataSet.string('x00281052')) ?? 0;
    const rescaleSlope = parseFirstNumber(dataSet.string('x00281053')) ?? 1;
    const wcTag = parseFirstNumber(dataSet.string('x00281050'));
    const wwTag = parseFirstNumber(dataSet.string('x00281051'));

    let minVal = Infinity;
    let maxVal = -Infinity;
    const transformed = new Float32Array(pixelCount);

    for (let i = 0; i < pixelCount; i++) {
      const value = pixels[i] * rescaleSlope + rescaleIntercept;
      transformed[i] = value;
      if (value < minVal) minVal = value;
      if (value > maxVal) maxVal = value;
    }

    const windowCenter = wcTag ?? (minVal + maxVal) / 2;
    const inferredWidth = maxVal - minVal;
    const defaultWidth = Number.isFinite(inferredWidth) && inferredWidth > 0 ? inferredWidth : 1;
    const windowWidth = Math.max(1, wwTag ?? defaultWidth);
    const lower = windowCenter - windowWidth / 2;
    const upper = windowCenter + windowWidth / 2;

    const png = new PNG({ width: cols, height: rows });
    for (let i = 0; i < pixelCount; i++) {
      let mapped = transformed[i];
      if (mapped <= lower) mapped = 0;
      else if (mapped >= upper) mapped = 255;
      else mapped = ((mapped - lower) / (upper - lower)) * 255;

      const gray = Math.max(0, Math.min(255, Math.round(mapped)));
      const idx = i * 4;
      png.data[idx] = gray;
      png.data[idx + 1] = gray;
      png.data[idx + 2] = gray;
      png.data[idx + 3] = 255;
    }

    return PNG.sync.write(png);
  } catch (error) {
    console.error("DICOM on-demand preview conversion failed:", error);
    return null;
  }
}

async function resolveAnalysisFilePath(scan: { id: string; file_hash: string; converted_image?: string | null }): Promise<string | null> {
  if (isVisionSupported(scan.file_hash)) {
    return scan.file_hash;
  }

  if (scan.converted_image && isVisionSupported(scan.converted_image)) {
    return scan.converted_image;
  }

  if (getFileExtension(scan.file_hash) !== "dcm") {
    return null;
  }

  const { data: fileData, error: fileError } = await supabaseServer.storage
    .from("scans")
    .download(scan.file_hash);

  if (fileError || !fileData) {
    console.error("Failed to download DICOM for on-demand conversion:", fileError);
    return null;
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const previewBuffer = toPngPreviewFromDicom(buffer);
  if (!previewBuffer) return null;

  const previewFilePath = `${scan.file_hash.replace(/\.dcm$/i, "")}-preview.png`;

  const { error: uploadError } = await supabaseServer.storage
    .from("scans")
    .upload(previewFilePath, previewBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    console.error("Failed to upload on-demand preview:", uploadError);
    return null;
  }

  await supabaseServer
    .from("scans")
    .update({ converted_image: previewFilePath })
    .eq("id", scan.id);

  return previewFilePath;
}

function extractModelText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part && typeof (part as { text?: unknown }).text === "string") {
          return (part as { text: string }).text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }
  return "";
}

function toDetailsFromText(text: string): string[] {
  return text
    .split(/\n|\.|;/)
    .map((line) => line.trim())
    .filter((line) => line.length > 10)
    .slice(0, 6);
}

function inferUrgency(text: string): boolean {
  return /(urgent|emergency|critical|acute hemorrhage|pneumothorax|stroke|severe)/i.test(text);
}

function normalizeModality(modality: string): string {
  const normalized = modality.toLowerCase();
  if (normalized.includes("xray") || normalized.includes("x-ray")) return "xray";
  if (normalized.includes("ct")) return "ct";
  if (normalized.includes("mri")) return "mri";
  if (normalized.includes("ultra")) return "ultrasound";
  if (normalized.includes("pet")) return "pet";
  if (normalized.includes("mammo")) return "mammography";
  return "unknown";
}

function calibrateConfidence(args: {
  modality: string;
  parserMode: ParserMode;
  detailsCount: number;
  summaryLength: number;
  urgent: boolean;
}): number {
  const modalityKey = normalizeModality(args.modality);
  const base = MODALITY_BASE_CONFIDENCE[modalityKey] ?? MODALITY_BASE_CONFIDENCE.unknown;
  const parserBoost = args.parserMode === "fenced-json" ? 10 : args.parserMode === "embedded-json" ? 7 : 2;
  const detailsBoost = Math.min(8, args.detailsCount * 2);
  const summaryBoost = args.summaryLength > 120 ? 4 : args.summaryLength > 50 ? 2 : 0;
  const urgencyPenalty = args.urgent ? 6 : 0;
  return Math.max(52, Math.min(95, base + parserBoost + detailsBoost + summaryBoost - urgencyPenalty));
}

function aggregateAnalyses(results: AnalysisResult[]): AnalysisResult {
  if (results.length === 1) return results[0];

  const modeWeight: Record<ParserMode, number> = {
    "fenced-json": 1,
    "embedded-json": 0.9,
    "plain-text": 0.75,
  };

  let weightedTotal = 0;
  let totalWeight = 0;
  const mergedDetails: string[] = [];
  let urgent = false;

  for (const result of results) {
    const weight = modeWeight[result.parserMode];
    weightedTotal += result.confidence * weight;
    totalWeight += weight;
    urgent = urgent || result.findings.urgent;
    for (const detail of result.findings.details) {
      if (!mergedDetails.includes(detail)) {
        mergedDetails.push(detail);
      }
    }
  }

  const preferred = [...results].sort((a, b) => {
    if (a.parserMode !== b.parserMode) {
      return modeWeight[b.parserMode] - modeWeight[a.parserMode];
    }
    return b.findings.summary.length - a.findings.summary.length;
  })[0];

  const consensusConfidence = Math.max(52, Math.min(95, Math.round(weightedTotal / Math.max(totalWeight, 1))));

  return {
    confidence: consensusConfidence,
    parserMode: preferred.parserMode,
    findings: {
      summary: preferred.findings.summary,
      details: mergedDetails.slice(0, 8),
      urgent,
    },
  };
}

function coerceAiResponseToStructured(responseText: string, modality: string): AnalysisResult {
  const trimmed = responseText.trim();

  // Strategy 1: fenced JSON block
  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const parsed = JSON.parse(fencedMatch[1]);
    const urgent = !!parsed.urgent;
    const details = Array.isArray(parsed.details)
      ? parsed.details.map((d: unknown) => String(d)).filter(Boolean)
      : [];
    const summary = String(parsed.summary || "Analysis complete.");
    const confidence = calibrateConfidence({
      modality,
      parserMode: "fenced-json",
      detailsCount: details.length,
      summaryLength: summary.length,
      urgent,
    });
    return {
      confidence,
      parserMode: "fenced-json",
      findings: {
        summary,
        details: details.length ? details : ["Model returned limited structured detail."],
        urgent,
      },
    };
  }

  // Strategy 2: raw JSON object somewhere in text
  const jsonStart = trimmed.indexOf('{');
  const jsonEnd = trimmed.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
    const jsonString = trimmed.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);
    const urgent = !!parsed.urgent;
    const details = Array.isArray(parsed.details)
      ? parsed.details.map((d: unknown) => String(d)).filter(Boolean)
      : [];
    const summary = String(parsed.summary || "Analysis complete.");
    const confidence = calibrateConfidence({
      modality,
      parserMode: "embedded-json",
      detailsCount: details.length,
      summaryLength: summary.length,
      urgent,
    });
    return {
      confidence,
      parserMode: "embedded-json",
      findings: {
        summary,
        details: details.length ? details : ["Model returned limited structured detail."],
        urgent,
      },
    };
  }

  // Strategy 3: plain-text fallback from model output (not hardcoded clinical content)
  const details = toDetailsFromText(trimmed);
  const urgent = inferUrgency(trimmed);
  const summary = trimmed.split(/\n|\./).map((line) => line.trim()).find((line) => line.length > 20) || "Analysis complete.";
  const confidence = calibrateConfidence({
    modality,
    parserMode: "plain-text",
    detailsCount: details.length,
    summaryLength: summary.length,
    urgent,
  });

  return {
    confidence,
    parserMode: "plain-text",
    findings: {
      summary,
      details: details.length ? details : ["Model response was unstructured."],
      urgent,
    },
  };
}

async function analyzeWithVisionAI(imageUrl: string, modality: string): Promise<AnalysisResult> {
  const prompt = `You are a highly experienced medical imaging expert and board-certified radiologist. Analyze this ${modality || 'medical'} scan comprehensively and provide a structured radiological report.

Your analysis must include:
1. "summary": A concise diagnostic impression (2-3 sentences max).
2. "details": A detailed, anatomical breakdown of your findings as a strict JSON array of strings. Include organ systems evaluated, contrast presence, artifacts, and primary pathological observations. Make these highly technical and clinical.
3. "urgent": A boolean value indicating if emergency intervention or immediate clinical correlation is required.

Respond strictly and ONLY in valid JSON format:
{"summary": "Radiological impression summary", "details": ["observation 1", "observation 2", "observation 3"], "urgent": true/false}`;

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    console.log("Calling OpenRouter API for vision analysis");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "MediChainAI"
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            { type: "text", text: prompt }
          ]
        }],
        max_tokens: 1024,
        temperature: 0.3,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = extractModelText(data.choices?.[0]?.message?.content);
    console.log("OpenRouter raw response:", responseText);

    if (!responseText.trim()) {
      throw new Error("AI provider returned empty response");
    }

    try {
      return coerceAiResponseToStructured(responseText, modality);
    } catch (parseError) {
      console.error("AI response coercion error:", parseError);
      throw new Error("Failed to parse AI response into report structure");
    }

  } catch (error) {
    console.error("Vision AI API error:", error);
    throw error;
  }
}

function buildAnalysisCandidates(originalFilePath: string, convertedFilePath: string | null): string[] {
  const candidates: string[] = [];

  if (isVisionSupported(originalFilePath)) {
    candidates.push(originalFilePath);
  }

  if (convertedFilePath && isVisionSupported(convertedFilePath) && convertedFilePath !== originalFilePath) {
    candidates.push(convertedFilePath);
  }

  return candidates.slice(0, 2);
}

async function getAccessibleImageUrl(filePath: string): Promise<string> {
  if (!isVisionSupported(filePath)) {
    throw new Error(`Unsupported file type for vision model: .${getFileExtension(filePath)}`);
  }

  // Try to create a signed URL first (works for private buckets)
  const { data: signedData, error: signedError } = await supabaseServer.storage
    .from("scans")
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (signedData?.signedUrl && !signedError) {
    console.log("Using signed URL for AI analysis");
    return signedData.signedUrl;
  }

  console.log("Signed URL failed, falling back to base64:", signedError);

  // Fallback: download and convert to base64 data URI
  const { data: fileData, error: fileError } = await supabaseServer.storage
    .from("scans")
    .download(filePath);

  if (fileError || !fileData) {
    throw new Error(`Cannot access image file: ${fileError?.message}`);
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const base64 = buffer.toString("base64");

  // Detect mime type from extension
  const ext = getFileExtension(filePath);
  const mimeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
  };
  const mime = mimeMap[ext] || 'application/octet-stream';

  return `data:${mime};base64,${base64}`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let tokenMintSuccessful = false;
  let txHashText = "none";

  try {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub as string;
    const walletAddress = payload.walletAddress as string;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const ipRateLimit = checkRateLimit(`vision:${ip}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 20,
    });

    if (!ipRateLimit.success) {
      return NextResponse.json({ error: "Too many analysis requests. Please try again later." }, { status: 429 });
    }

    const userRateLimit = checkRateLimit(`vision-user:${userId}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
    });

    if (!userRateLimit.success) {
      return NextResponse.json({ error: "Hourly analysis quota exceeded." }, { status: 429 });
    }

    const { id: scanId } = await params;

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "AI analysis is not configured", details: "OPENROUTER_API_KEY is missing" },
        { status: 503 }
      );
    }

    // Fetch scan from Supabase along with any existing analysis
    const { data: scan, error: scanError } = await supabaseServer
      .from('scans')
      .select('*, analysis_results(*)')
      .eq('id', scanId)
      .eq('user_id', userId)
      .single();

    if (scanError || !scan) {
      console.error("Scan fetch error:", scanError);
      return NextResponse.json({ error: "Scan not found or unauthorized" }, { status: 404 });
    }

    const hadNarrativeAnalysis = hasAnalysisSource(scan.analysis_results, "openrouter");

    // Pick an AI-compatible file path. Prefer converted image for non-image uploads.
    const originalFilePath = scan.file_hash as string;
    const analysisFilePath = await resolveAnalysisFilePath({
      id: scan.id,
      file_hash: originalFilePath,
      converted_image: scan.converted_image as string | null,
    });

    if (!analysisFilePath) {
      return NextResponse.json(
        {
          error: "AI analysis failed",
          details: `Unsupported scan format (.${getFileExtension(originalFilePath)}). Upload a 2D image or provide a converted preview image for analysis.`,
        },
        { status: 422 }
      );
    }

    // Get the image URL with accessibility (signed/base64)
    console.log("Attempting to get accessible image URL for scan:", scanId);
    const imageUrl = await getAccessibleImageUrl(analysisFilePath);
    console.log("Image source ready. Length:", imageUrl.length > 200 ? imageUrl.substring(0, 100) + "..." : imageUrl);

    let aiAnalysis: AnalysisResult;

    try {
      const candidatePaths = buildAnalysisCandidates(originalFilePath, scan.converted_image as string | null);
      const candidateImageUrls = candidatePaths.length > 0
        ? await Promise.all(candidatePaths.map((path) => getAccessibleImageUrl(path)))
        : [imageUrl];

      const analyses: AnalysisResult[] = [];
      for (const candidateImageUrl of candidateImageUrls) {
        console.log(">>> Sending image candidate to Llama 3.2 Vision for analysis...");
        analyses.push(await analyzeWithVisionAI(candidateImageUrl, scan.modality || "medical scan"));
      }

      aiAnalysis = aggregateAnalyses(analyses);
      console.log(">>> SUCCESS: AI analysis retrieved:", JSON.stringify(aiAnalysis).substring(0, 200) + "...");
    } catch (aiError) {
      console.error(">>> ERROR: AI analysis failed:", aiError);
      return NextResponse.json(
        {
          error: "AI analysis failed",
          details: aiError instanceof Error ? aiError.message : "Unable to complete analysis for this scan"
        },
        { status: 502 }
      );
    }

    // Save Analysis Results to Supabase
    const { data: analysis, error: analysisError } = await supabaseServer
      .from('analysis_results')
      .upsert({
        scan_id: scan.id,
        confidence_score: aiAnalysis.confidence,
        findings: aiAnalysis.findings,
        model_source: "openrouter",
      }, {
        onConflict: "scan_id,model_source",
      })
      .select()
      .single();

    if (analysisError) {
      console.error("Analysis insert error:", JSON.stringify(analysisError, null, 2));
      return NextResponse.json({ error: "Failed to save analysis", details: analysisError }, { status: 500 });
    }

    // Update Scan Status
    const { error: updateError } = await supabaseServer
      .from('scans')
      .update({ status: "Analyzed" })
      .eq('id', scan.id);

    if (updateError) {
      console.error("Scan update error:", updateError);
    }

    // Only mint reward on the first narrative analysis for a scan.
    const adminKeyBase58 = process.env.SOLANA_ADMIN_PRIVATE_KEY;
    const testMintStr = process.env.NEXT_PUBLIC_MCI_TOKEN_MINT;

    if (!hadNarrativeAnalysis && adminKeyBase58 && testMintStr && walletAddress) {
      try {
        const adminKeypair = Keypair.fromSecretKey(bs58.decode(adminKeyBase58));
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const mint = new PublicKey(testMintStr);
        const recipient = new PublicKey(walletAddress);
        const tokenAmount = 25 * Math.pow(10, 9);

        const userAta = await getOrCreateAssociatedTokenAccount(
          connection, adminKeypair, mint, recipient
        );

        const signature = await mintTo(
          connection, adminKeypair, mint, userAta.address, adminKeypair.publicKey, tokenAmount
        );

        txHashText = signature;
        tokenMintSuccessful = true;
      } catch (mintError) {
        console.error("Auto Reward Error:", mintError);
        txHashText = "Reward calculation failed - AI analysis succeeded";
      }
    } else if (hadNarrativeAnalysis) {
      txHashText = "Existing narrative analysis refreshed - no additional reward minted";
    } else {
      txHashText = "Minting not configured - AI analysis succeeded";
    }

    return NextResponse.json({
      success: true,
      analysis,
      rewardTxHash: txHashText,
      tokenMinted: tokenMintSuccessful,
      message: hadNarrativeAnalysis
        ? "AI analysis refreshed using Vision AI"
        : "AI analysis complete using Vision AI"
    });

  } catch (error) {
    console.error("Analyze Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
  }
}
