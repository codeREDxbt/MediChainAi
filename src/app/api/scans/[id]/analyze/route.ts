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
import {
  callMonaiService,
  combineProviderConfidence,
  getFileExtension,
  isMonaiSupported,
  mergeAnalysisFindings,
  type AnalysisFindings,
  type MonaiResponse,
} from "@/lib/monai";

const VISION_MODEL = "meta-llama/llama-3.2-11b-vision-instruct";

const SUPPORTED_VISION_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
]);

type Findings = AnalysisFindings;

type ParserMode = "fenced-json" | "embedded-json" | "plain-text";

type AnalysisResult = {
  confidence: number | null;
  findings: Findings;
  parserMode: ParserMode;
};

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
    const bytesNeeded = bitsAllocated > 8 ? pixelCount * 2 : pixelCount;
    if (offset < 0 || offset + bytesNeeded > buffer.byteLength) return null;

    const pixelSlice = buffer.slice(offset, offset + bytesNeeded);
    let pixels: Int16Array | Uint8Array | Uint16Array;

    if (bitsAllocated > 8) {
      pixels = pixelRepresentation === 1
        ? new Int16Array(pixelSlice.buffer, pixelSlice.byteOffset, pixelCount)
        : new Uint16Array(pixelSlice.buffer, pixelSlice.byteOffset, pixelCount);
    } else {
      pixels = new Uint8Array(pixelSlice.buffer, pixelSlice.byteOffset, pixelCount);
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

function normalizeReportLine(value: string): string {
  return value
    .replace(/```json|```/gi, "")
    .replace(/\*\*/g, "")
    .replace(/^[-*•]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/^(summary|details|findings|observations|urgency)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const line of lines) {
    const cleaned = normalizeReportLine(line);
    if (!cleaned) continue;

    const key = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) continue;

    seen.add(key);
    output.push(cleaned);
  }

  return output;
}

function toDetailsFromText(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletLines = lines.filter((line) => /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line));
  if (bulletLines.length > 0) {
    return normalizeLines(bulletLines).slice(0, 8);
  }

  return normalizeLines(
    text
      .split(/\n|\.|;/)
      .map((line) => line.trim())
      .filter((line) => line.length > 10)
  ).slice(0, 8);
}

function inferUrgency(text: string): boolean {
  return /(urgent|emergency|critical|acute hemorrhage|pneumothorax|stroke|severe)/i.test(text);
}

function normalizeConfidenceValue(value: unknown): number | null {
  if (typeof value === "string") {
    const match = value.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    value = Number(match[0]);
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const normalized = value > 0 && value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(normalized * 10) / 10));
}

function extractConfidenceFromText(text: string): number | null {
  const match = text.match(/confidence\s*[:=-]?\s*(-?\d+(?:\.\d+)?)(?:\s*%|\b)/i);
  return normalizeConfidenceValue(match?.[1] ?? null);
}

function parseStructuredPlainTextReport(text: string): AnalysisResult | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  let currentSection: "summary" | "details" | "urgency" | "confidence" | null = null;
  const summaryParts: string[] = [];
  const detailParts: string[] = [];
  const urgencyParts: string[] = [];
  let confidence: number | null = null;

  for (const rawLine of lines) {
    const normalized = rawLine.replace(/\*\*/g, "").trim();

    if (/^(summary|overview)\s*:?\s*$/i.test(normalized)) {
      currentSection = "summary";
      continue;
    }
    if (/^(details|findings|observations)\s*:?\s*$/i.test(normalized)) {
      currentSection = "details";
      continue;
    }
    if (/^(urgency|urgent)\s*:?\s*$/i.test(normalized)) {
      currentSection = "urgency";
      continue;
    }
    if (/^confidence\s*:?\s*$/i.test(normalized)) {
      currentSection = "confidence";
      continue;
    }

    if (/^(summary|overview)\s*:/i.test(normalized)) {
      summaryParts.push(normalizeReportLine(normalized));
      currentSection = "summary";
      continue;
    }
    if (/^(details|findings|observations)\s*:/i.test(normalized)) {
      const cleaned = normalizeReportLine(normalized);
      if (cleaned) detailParts.push(cleaned);
      currentSection = "details";
      continue;
    }
    if (/^(urgency|urgent)\s*:/i.test(normalized)) {
      urgencyParts.push(normalizeReportLine(normalized));
      currentSection = "urgency";
      continue;
    }
    if (/^confidence\s*:/i.test(normalized)) {
      confidence = normalizeConfidenceValue(normalized);
      currentSection = "confidence";
      continue;
    }

    const isBullet = /^[-*•]\s+/.test(rawLine) || /^\d+\.\s+/.test(rawLine);
    const cleaned = normalizeReportLine(rawLine);
    if (!cleaned) continue;

    if (currentSection === "confidence") {
      confidence = normalizeConfidenceValue(cleaned);
    } else if (currentSection === "urgency") {
      urgencyParts.push(cleaned);
    } else if (currentSection === "details" || isBullet) {
      detailParts.push(cleaned);
    } else if (currentSection === "summary" || summaryParts.length === 0) {
      summaryParts.push(cleaned);
    } else {
      detailParts.push(cleaned);
    }
  }

  const summary = normalizeLines(summaryParts).join(" ").trim() || "";
  const details = normalizeLines(detailParts)
    .filter((detail) => detail.toLowerCase() !== summary.toLowerCase())
    .slice(0, 8);

  if (!summary && details.length === 0) return null;

  return {
    confidence,
    parserMode: "plain-text",
    findings: {
      summary: summary || details[0] || "Analysis complete.",
      details: details.length > 0 ? details : ["Model returned only a short narrative summary."],
      urgent: urgencyParts.length > 0 ? inferUrgency(urgencyParts.join(" ")) : inferUrgency(text),
    },
  };
}

function aggregateAnalyses(results: AnalysisResult[]): AnalysisResult {
  if (results.length === 1) return results[0];

  const modeWeight: Record<ParserMode, number> = {
    "fenced-json": 1,
    "embedded-json": 0.9,
    "plain-text": 0.75,
  };

  const mergedDetails: string[] = [];
  let urgent = false;
  const confidenceValues = results
    .map((result) => result.confidence)
    .filter((value): value is number => typeof value === "number");

  for (const result of results) {
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

  const averagedConfidence = confidenceValues.length > 0
    ? Math.round((confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length) * 10) / 10
    : null;

  return {
    confidence: averagedConfidence,
    parserMode: preferred.parserMode,
    findings: {
      summary: preferred.findings.summary,
      details: mergedDetails.slice(0, 8),
      urgent,
    },
  };
}

function coerceAiResponseToStructured(responseText: string, _modality: string): AnalysisResult {
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
    return {
      confidence: normalizeConfidenceValue(parsed.confidence),
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
    return {
      confidence: normalizeConfidenceValue(parsed.confidence),
      parserMode: "embedded-json",
      findings: {
        summary,
        details: details.length ? details : ["Model returned limited structured detail."],
        urgent,
      },
    };
  }

  const structuredPlainText = parseStructuredPlainTextReport(trimmed);
  if (structuredPlainText) {
    return structuredPlainText;
  }

  // Strategy 3: plain-text fallback from model output (not hardcoded clinical content)
  const details = toDetailsFromText(trimmed);
  const urgent = inferUrgency(trimmed);
  const summary = normalizeReportLine(
    trimmed.split(/\n|\./).map((line) => line.trim()).find((line) => line.length > 20) || "Analysis complete."
  );

  return {
    confidence: extractConfidenceFromText(trimmed),
    parserMode: "plain-text",
    findings: {
      summary,
      details: details.length ? details : ["Model response was unstructured."],
      urgent,
    },
  };
}

async function analyzeWithVisionAI(imageUrl: string, modality: string): Promise<AnalysisResult> {
  const prompt = `You are reviewing a ${modality || 'medical'} scan for an everyday user.

Rules:
1. Use only what is visibly supported by the image.
2. Do not invent anatomy, diseases, contrast use, or body regions that are not clearly visible.
3. If the uploaded image does not look like the stated scan type, say that clearly.
4. Write in plain English, not dense radiology jargon.
5. Provide useful bullet-style points, not vague filler.
6. Do not use markdown headings, bold text, or preambles.
7. Do not say you are waiting for an image. The image is already included in this request.

Return strict JSON with this exact shape:
{"summary":"1-2 sentence plain-English overview of what this image most likely shows and any uncertainty.","details":["6 to 10 short bullet-ready points for a normal user, including visible body part, scan appearance, any obvious abnormal-looking area, image quality/limits, and what uncertainty remains."],"urgent":true/false}`;

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
        messages: [
          {
            role: "system",
            content: "Return valid JSON only. Do not use markdown, code fences, headings, or any preamble."
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
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
      const structured = coerceAiResponseToStructured(responseText, modality);
      return {
        ...structured,
        confidence: null,
      };
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

function describeUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const preferred = record.message ?? record.error ?? record.detail ?? record.details;
    if (typeof preferred === "string" && preferred.trim()) return preferred;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

function isProviderReachableUrl(url: string): boolean {
  return !/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(url);
}

function isLocalSupabaseStorage(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(supabaseUrl);
}

function resolveAnalysisModality(args: {
  storedModality?: string | null;
  originalName?: string | null;
  filePath: string;
}): string {
  const stored = (args.storedModality || "").trim();
  const normalizedStored = stored.toLowerCase();
  const ext = getFileExtension(args.filePath);
  const isImage = ["jpg", "jpeg", "png", "webp", "bmp"].includes(ext);
  const name = (args.originalName || args.filePath).toLowerCase();

  if (normalizedStored === "xray" || normalizedStored === "x-ray") return "X-Ray";
  if (normalizedStored === "ultrasound") return "Ultrasound";
  if (normalizedStored === "mammography") return "Mammography";
  if (normalizedStored === "pet") return "PET";
  if (normalizedStored === "mri") return "MRI";
  if (normalizedStored === "ct") return "CT";

  if (isImage) {
    if (name.includes("xray") || name.includes("x-ray") || name.includes("cxr")) return "X-Ray";
    return "CT";
  }

  if (name.includes("mri") || name.includes("_mr") || name.includes("-mr")) return "MRI";
  if (name.includes("pet")) return "PET";
  if (name.includes("mammo")) return "Mammography";
  if (name.includes("ultra")) return "Ultrasound";
  if (name.includes("xray") || name.includes("x-ray") || name.includes("cxr")) return "X-Ray";
  return ext === "dcm" ? "CT" : "X-Ray";
}

async function getAccessibleImageUrl(filePath: string): Promise<string> {
  if (!isVisionSupported(filePath)) {
    throw new Error(`Unsupported file type for vision model: .${getFileExtension(filePath)}`);
  }

  if (!isLocalSupabaseStorage()) {
  // Try to create a signed URL first (works for private buckets)
    const { data: signedData, error: signedError } = await supabaseServer.storage
      .from("scans")
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedData?.signedUrl && !signedError && isProviderReachableUrl(signedData.signedUrl)) {
      console.log("Using signed URL for AI analysis");
      return signedData.signedUrl;
    }

    console.log("Signed URL unavailable or not remotely reachable, falling back to base64:", signedError || signedData?.signedUrl);
  } else {
    console.log("Local Supabase detected, using base64 image payload for Vision AI.");
  }

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
    const monaiUrl = process.env.MONAI_SERVICE_URL;
    const monaiSharedSecret = process.env.MONAI_SHARED_SECRET;
    const openRouterEnabled = !!process.env.OPENROUTER_API_KEY;

    if (!openRouterEnabled && !monaiUrl) {
      return NextResponse.json(
        {
          error: "AI analysis is not configured",
          details: "Set MONAI_SERVICE_URL and/or OPENROUTER_API_KEY before running analysis.",
        },
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

    const existingAnalysis = Array.isArray(scan.analysis_results)
      ? scan.analysis_results[0]
      : scan.analysis_results;
    const hasAnalysis = !!existingAnalysis;
    const effectiveModality = resolveAnalysisModality({
      storedModality: scan.modality as string | null,
      originalName: scan.original_name as string | null,
      filePath: scan.file_hash as string,
    });

    const originalFilePath = scan.file_hash as string;
    await supabaseServer
      .from("scans")
      .update({ status: "Processing" })
      .eq("id", scan.id);

    let aiAnalysis: AnalysisResult | null = null;
    let monaiResult: MonaiResponse | null = null;
    const providerErrors: { monai?: string; vision?: string } = {};

    if (monaiUrl) {
      if (isMonaiSupported(originalFilePath)) {
        try {
          const { data: monaiFile, error: monaiFileError } = await supabaseServer.storage
            .from("scans")
            .download(originalFilePath);

          if (monaiFileError || !monaiFile) {
            providerErrors.monai = monaiFileError?.message || "Unable to download the original scan for MONAI.";
          } else {
            const originalName = (scan.original_name as string) || originalFilePath.split("/").pop() || "scan.dcm";
            monaiResult = await callMonaiService({
              serviceUrl: monaiUrl,
              sharedSecret: monaiSharedSecret,
              fileBytes: await monaiFile.arrayBuffer(),
              filename: originalName,
              modality: effectiveModality,
            });
            console.log(">>> SUCCESS: MONAI analysis retrieved:", JSON.stringify(monaiResult).substring(0, 200) + "...");
          }
        } catch (monaiError) {
          console.error(">>> ERROR: MONAI analysis failed:", monaiError);
          providerErrors.monai = describeUnknownError(monaiError);
        }
      } else {
        providerErrors.monai = `Unsupported scan format for MONAI (.${getFileExtension(originalFilePath)}).`;
      }
    }

    if (openRouterEnabled) {
      const analysisFilePath = await resolveAnalysisFilePath({
        id: scan.id,
        file_hash: originalFilePath,
        converted_image: scan.converted_image as string | null,
      });

      if (analysisFilePath) {
        try {
          const candidatePaths = buildAnalysisCandidates(originalFilePath, scan.converted_image as string | null);
          const candidateImagePaths = candidatePaths.length > 0 ? candidatePaths : [analysisFilePath];
          const candidateImageUrls = await Promise.all(candidateImagePaths.map((path) => getAccessibleImageUrl(path)));

          const analyses: AnalysisResult[] = [];
          for (const candidateImageUrl of candidateImageUrls) {
            console.log(">>> Sending image candidate to Llama 3.2 Vision for analysis...");
            analyses.push(await analyzeWithVisionAI(candidateImageUrl, effectiveModality || "medical scan"));
          }

          aiAnalysis = aggregateAnalyses(analyses);
          console.log(">>> SUCCESS: Vision AI analysis retrieved:", JSON.stringify(aiAnalysis).substring(0, 200) + "...");
        } catch (aiError) {
          console.error(">>> ERROR: Vision AI analysis failed:", aiError);
          providerErrors.vision = describeUnknownError(aiError);
        }
      } else {
        providerErrors.vision = `Unsupported scan format for Vision AI (.${getFileExtension(originalFilePath)}). Upload a 2D image or provide a converted preview image for analysis.`;
      }
    }

    if (!aiAnalysis && !monaiResult) {
      const details = [providerErrors.monai, providerErrors.vision].filter(Boolean).join(" ");
      return NextResponse.json(
        {
          error: "AI analysis failed",
          details: details || "No configured provider was able to analyze this scan.",
        },
        { status: 502 }
      );
    }

    const combinedFindings = mergeAnalysisFindings({
      monai: monaiResult,
      vision: aiAnalysis
        ? {
            confidence: aiAnalysis.confidence,
            parserMode: aiAnalysis.parserMode,
            model: VISION_MODEL,
            findings: aiAnalysis.findings,
          }
        : null,
      providerErrors,
    });
    const monaiConfidence = monaiResult?.confidence_source === "model_probability" ? monaiResult.confidence : null;
    const combinedConfidence = combineProviderConfidence({
      monai: monaiConfidence,
      vision: monaiConfidence === null ? aiAnalysis?.confidence : null,
    });

    // Save Analysis Results without relying on a DB-side unique constraint.
    const analysisMutation = existingAnalysis?.id
      ? supabaseServer
          .from('analysis_results')
          .update({
            confidence_score: combinedConfidence,
            findings: combinedFindings,
          })
          .eq('id', existingAnalysis.id)
          .select()
          .single()
      : supabaseServer
          .from('analysis_results')
          .insert({
            scan_id: scan.id,
            confidence_score: combinedConfidence,
            findings: combinedFindings,
          })
          .select()
          .single();

    const { data: analysis, error: analysisError } = await analysisMutation;

    if (analysisError) {
      console.error("Analysis insert error:", JSON.stringify(analysisError, null, 2));
      await supabaseServer
        .from('scans')
        .update({ status: hasAnalysis ? "Analyzed" : "Pending Review" })
        .eq('id', scan.id);
      return NextResponse.json({ error: "Failed to save analysis", details: describeUnknownError(analysisError) }, { status: 500 });
    }

    // Update Scan Status
    const { error: updateError } = await supabaseServer
      .from('scans')
      .update({ status: "Analyzed" })
      .eq('id', scan.id);

    if (updateError) {
      console.error("Scan update error:", updateError);
    }

    // Attempt Solana Devnet Reward
    const adminKeyBase58 = process.env.SOLANA_ADMIN_PRIVATE_KEY;
    const testMintStr = process.env.NEXT_PUBLIC_MCI_TOKEN_MINT;

    if (adminKeyBase58 && testMintStr && walletAddress) {
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
    } else {
      txHashText = "Minting not configured - AI analysis succeeded";
    }

    return NextResponse.json({
      success: true,
      analysis,
      providers: {
        monai: monaiResult
          ? {
              label: monaiResult.label,
              confidence: monaiResult.confidence,
              analysis_mode: monaiResult.analysis_mode,
              confidence_source: monaiResult.confidence_source,
              model_used: monaiResult.model_used,
              model_description: monaiResult.model_description,
              scope_note: monaiResult.scope_note,
              inference_seconds: monaiResult.inference_seconds,
              has_overlay: !!monaiResult.segmentation_overlay_base64,
            }
          : null,
        vision: aiAnalysis
          ? {
              confidence: aiAnalysis.confidence,
              model: VISION_MODEL,
              parser_mode: aiAnalysis.parserMode,
            }
          : null,
      },
      providerErrors,
      rewardTxHash: txHashText,
      tokenMinted: tokenMintSuccessful,
      message: monaiResult?.analysis_mode === "bundle" && aiAnalysis
        ? hasAnalysis
          ? "Analysis refreshed using MONAI + Vision AI report"
          : "Analysis complete using MONAI + Vision AI report"
        : monaiResult?.analysis_mode === "bundle"
          ? hasAnalysis
            ? "Analysis refreshed using MONAI"
            : "AI analysis complete using MONAI"
          : aiAnalysis
            ? hasAnalysis
              ? "Analysis refreshed using Vision AI report"
              : "Analysis complete using Vision AI report"
            : "MONAI could not produce a trained result for this upload",
    });

  } catch (error) {
    console.error("Analyze Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: describeUnknownError(error) }, { status: 500 });
  }
}
