export interface AnalysisFindings {
  summary: string;
  details: string[];
  urgent: boolean;
  scope_note?: string;
  report_summary?: string;
  report_details?: string[];
  technical_details?: string[];
  confidence_note?: string;
}

export interface VisionAnalysisPayload {
  confidence: number | null;
  parserMode?: string;
  model?: string;
  findings: AnalysisFindings;
}

export interface MonaiResponse {
  label: string;
  confidence: number | null;
  analysis_mode: "bundle" | "fallback" | "unavailable";
  confidence_source: "model_probability" | "estimated_fallback" | "not_available";
  findings: AnalysisFindings;
  segmentation_overlay_base64: string | null;
  model_used: string;
  model_description: string;
  scope_note: string;
  inference_seconds: number;
  modality: string;
  filename: string;
}

type StoredProviders = {
  monai?: {
    label: string;
    confidence: number | null;
    analysis_mode: "bundle" | "fallback" | "unavailable";
    confidence_source: "model_probability" | "estimated_fallback" | "not_available";
    model_used: string;
    model_description: string;
    scope_note: string;
    inference_seconds: number;
    modality: string;
    filename: string;
    has_overlay: boolean;
  };
  vision?: {
    confidence: number | null;
    model?: string;
    parser_mode?: string;
  };
};

type StoredProviderErrors = {
  monai?: string;
  vision?: string;
};

export interface StoredAnalysisFindings extends AnalysisFindings {
  primary_label?: string;
  model_used?: string;
  model_description?: string;
  scope_note?: string;
  inference_seconds?: number;
  segmentation_overlay?: string | null;
  providers?: StoredProviders;
  provider_errors?: StoredProviderErrors;
}

const SUPPORTED_MONAI_EXTENSIONS = new Set([
  "bmp",
  "dcm",
  "jpeg",
  "jpg",
  "nii",
  "nii.gz",
  "png",
  "webp",
]);

export function getFileExtension(filePath: string): string {
  const normalized = filePath.toLowerCase();
  if (normalized.endsWith(".nii.gz")) return "nii.gz";
  return normalized.split(".").pop() || "bin";
}

export function isMonaiSupported(filePath: string): boolean {
  return SUPPORTED_MONAI_EXTENSIONS.has(getFileExtension(filePath));
}

function mergeUniqueStrings(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => !!value))];
}

function formatScore(value?: number | null): string | null {
  return typeof value === "number" ? `${value.toFixed(1)}%` : null;
}

function cleanDisplayText(value: string): string {
  return value
    .replace(/```json|```/gi, "")
    .replace(/\*\*/g, "")
    .replace(/^[-*•]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/^(summary|details|findings|observations|urgency)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value: string): string {
  return cleanDisplayText(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function uniqueCleanedStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    if (!value) continue;
    const cleaned = cleanDisplayText(value);
    const key = normalizeKey(cleaned);
    if (!cleaned || !key || seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
  }

  return output;
}

function isGenericFallbackDetail(detail: string): boolean {
  return /fallback technical estimate|region_of_interest|highlighted area on the processed slice|highlighted part of the processed image|processed image size|processed output size|monai error:/i.test(detail);
}

function isTechnicalDetail(detail: string): boolean {
  return /^(analysis mode:|scan type used for review:|requested monai package:|compatible input required:|model package:|processed output size:|processed image size:|technical reason:|monai did not return a real model probability|no real monai confidence is available|vision ai generated descriptive report text only|the configured monai bundle could not run|the trained monai model was not fully available|this ct bundle is trained|this mri bundle focuses|this x-ray bundle is limited|if this summary does not match|this is ai-generated scan guidance)/i.test(cleanDisplayText(detail));
}

function isConfidenceEstimateDetail(detail: string): boolean {
  return /\bconfidence\b/i.test(cleanDisplayText(detail))
    && /estimate|summary|vision ai|not a calibrated|not a reliable|not a real model probability|not a diagnostic probability/i.test(cleanDisplayText(detail));
}

function isSameLine(a: string, b: string): boolean {
  return normalizeKey(a) === normalizeKey(b);
}

function buildReportDetails(args: {
  existingDetails: string[];
  monai?: MonaiResponse | null;
  vision?: VisionAnalysisPayload | null;
  summary: string;
}): string[] {
  const summary = cleanDisplayText(args.summary);
  const visionDetails = uniqueCleanedStrings(args.vision?.findings.details ?? []);
  const existingDetails = uniqueCleanedStrings(args.existingDetails);
  const monaiDetails = uniqueCleanedStrings(
    args.monai?.analysis_mode === "fallback"
      ? (args.monai.findings.details ?? []).filter((detail) => !isGenericFallbackDetail(detail))
      : (args.monai?.findings.details ?? [])
  );

  const preferred = visionDetails.length > 0
    ? visionDetails
    : existingDetails.filter((detail) => !isTechnicalDetail(detail));

  const reportDetails = uniqueCleanedStrings([
    ...preferred.filter((detail) => !isTechnicalDetail(detail) && !isConfidenceEstimateDetail(detail)),
    ...monaiDetails.filter((detail) => !isTechnicalDetail(detail) && !isConfidenceEstimateDetail(detail)),
  ])
    .filter((detail) => !isSameLine(detail, summary))
    .slice(0, 10);

  return reportDetails;
}

function buildTechnicalDetails(args: {
  monai?: MonaiResponse | null;
  providerErrors?: StoredProviderErrors;
}): string[] {
  const details = uniqueCleanedStrings([
    ...(args.monai?.findings.details ?? []),
    args.monai?.scope_note,
    args.providerErrors?.monai,
    args.providerErrors?.vision,
  ]);

  return details.filter((detail) => isTechnicalDetail(detail)).slice(0, 8);
}

function buildConfidenceNote(args: {
  monai?: MonaiResponse | null;
  vision?: VisionAnalysisPayload | null;
}): string {
  const monaiScore = formatScore(args.monai?.confidence);
  if (monaiScore && args.monai?.analysis_mode === "bundle") {
    return `Actual MONAI probability: ${monaiScore}.`;
  }
  if (args.monai?.analysis_mode === "unavailable") {
    return "No actual MONAI probability is available for this upload because the configured MONAI bundle could not run on it.";
  }
  if (args.monai?.analysis_mode === "fallback") {
    return "No actual MONAI probability is available because MONAI had to use a technical fallback.";
  }
  if (args.vision) {
    return "Vision AI generated report text, but no actual calibrated model probability is available for this analysis.";
  }
  return "No actual model confidence is available for this analysis.";
}

function buildPatientFriendlyDetails(args: {
  existingDetails: string[];
  monai?: MonaiResponse | null;
  vision?: VisionAnalysisPayload | null;
  summary: string;
}): string[] {
  const details: string[] = [];

  if (args.vision?.findings.details?.length) {
    details.push(...args.vision.findings.details);
  }

  if (args.monai?.findings.details?.length) {
    const monaiDetails = args.monai.analysis_mode === "fallback"
      ? args.monai.findings.details.filter((detail) => !isGenericFallbackDetail(detail))
      : args.monai.findings.details;
    details.push(...monaiDetails);
  }

  if (args.monai?.modality) {
    details.push(`Scan type reviewed: ${args.monai.modality}.`);
  }

  if (
    args.monai?.analysis_mode === "bundle"
    && args.monai?.label
    && args.monai.label !== "No significant finding"
    && args.monai.label !== "region_of_interest"
    && args.monai.label !== "No compatible MONAI result"
  ) {
    details.push(`Primary model label: ${args.monai.label.replace(/_/g, " ")}.`);
  }

  const monaiScore = formatScore(args.monai?.confidence);
  if (monaiScore && args.monai?.analysis_mode === "bundle") {
    details.push(
      `MONAI model confidence: ${monaiScore}.`
    );
  } else if (args.monai && args.monai.analysis_mode !== "bundle") {
    details.push("MONAI did not return a real model probability for this upload.");
  }

  if (args.vision) {
    details.push("Vision AI generated descriptive report text only; its estimate is not used as an actual model probability.");
  }

  if (args.monai?.analysis_mode === "fallback") {
    details.push("The trained MONAI model was not fully available for this scan, so some automated image details are only an estimate.");
  }

  if (args.monai?.analysis_mode === "unavailable") {
    details.push("The configured MONAI bundle could not run on this upload, so no trained MONAI report or confidence score was produced.");
  }

  if (args.monai?.scope_note) {
    details.push(args.monai.scope_note);
  }

  if (args.summary) {
    details.push("If this summary does not match the body part or scan type you uploaded, treat the result as unreliable and rerun analysis.");
  }

  details.push("This is AI-generated scan guidance, not a final medical diagnosis.");

  return mergeUniqueStrings([
    ...args.existingDetails,
    ...details,
  ])
    .filter((detail) => !isConfidenceEstimateDetail(detail))
    .slice(0, 10);
}

function parseExistingFindings(existing?: unknown): Partial<StoredAnalysisFindings> {
  if (!existing) return {};
  if (typeof existing === "string") {
    try {
      const parsed = JSON.parse(existing);
      return parsed && typeof parsed === "object" ? parsed as Partial<StoredAnalysisFindings> : {};
    } catch {
      return {};
    }
  }

  return typeof existing === "object" ? existing as Partial<StoredAnalysisFindings> : {};
}

export function mergeAnalysisFindings(args: {
  existing?: unknown;
  monai?: MonaiResponse | null;
  vision?: VisionAnalysisPayload | null;
  providerErrors?: StoredProviderErrors;
}): StoredAnalysisFindings {
  const existing = parseExistingFindings(args.existing);
  const existingDetails = Array.isArray(existing.details)
    ? existing.details.map((detail) => String(detail))
    : [];

  const summary = args.vision?.findings.summary
    || args.monai?.findings.summary
    || existing.summary
    || "Analysis complete.";
  const reportSummary = cleanDisplayText(
    args.vision?.findings.summary
      || existing.report_summary
      || existing.summary
      || args.monai?.findings.summary
      || "Analysis complete."
  );
  const reportDetails = buildReportDetails({
    existingDetails,
    monai: args.monai,
    vision: args.vision,
    summary: reportSummary,
  });
  const technicalDetails = buildTechnicalDetails({
    monai: args.monai,
    providerErrors: args.providerErrors,
  });
  const confidenceNote = buildConfidenceNote({
    monai: args.monai,
    vision: args.vision,
  });

  const details = buildPatientFriendlyDetails({
    existingDetails,
    monai: args.monai,
    vision: args.vision,
    summary,
  });

  const providers: StoredProviders = {
    ...(existing.providers || {}),
    ...(args.monai
      ? {
          monai: {
            label: args.monai.label,
            confidence: args.monai.confidence,
            analysis_mode: args.monai.analysis_mode,
            confidence_source: args.monai.confidence_source,
            model_used: args.monai.model_used,
            model_description: args.monai.model_description,
            scope_note: args.monai.scope_note,
            inference_seconds: args.monai.inference_seconds,
            modality: args.monai.modality,
            filename: args.monai.filename,
            has_overlay: !!args.monai.segmentation_overlay_base64,
          },
        }
      : {}),
    ...(args.vision
      ? {
          vision: {
            confidence: args.vision.confidence,
            model: args.vision.model,
            parser_mode: args.vision.parserMode,
          },
        }
      : {}),
  };

  const providerErrors: StoredProviderErrors = {
    ...(existing.provider_errors || {}),
    ...(args.providerErrors || {}),
  };

  if (!providerErrors.monai) delete providerErrors.monai;
  if (!providerErrors.vision) delete providerErrors.vision;

  const merged: StoredAnalysisFindings = {
    summary,
    details,
    urgent: !!(existing.urgent || args.monai?.findings.urgent || args.vision?.findings.urgent),
    primary_label: args.monai?.label || existing.primary_label,
    model_used: args.monai?.model_used || existing.model_used,
    model_description: args.monai?.model_description || existing.model_description,
    scope_note: args.monai?.scope_note || existing.scope_note,
    inference_seconds: args.monai?.inference_seconds || existing.inference_seconds,
    segmentation_overlay: args.monai?.segmentation_overlay_base64 ?? existing.segmentation_overlay ?? null,
    report_summary: reportSummary,
    report_details: reportDetails.length > 0 ? reportDetails : existing.report_details,
    technical_details: technicalDetails.length > 0 ? technicalDetails : existing.technical_details,
    confidence_note: confidenceNote || existing.confidence_note,
  };

  if (Object.keys(providers).length > 0) {
    merged.providers = providers;
  }

  if (Object.keys(providerErrors).length > 0) {
    merged.provider_errors = providerErrors;
  }

  return merged;
}

export function combineProviderConfidence(args: {
  monai?: number | null;
  vision?: number | null;
  fallback?: number | null;
}): number | null {
  const monai = typeof args.monai === "number" ? args.monai : null;

  if (monai !== null) return monai;
  return args.fallback ?? null;
}

export async function callMonaiService(args: {
  serviceUrl: string;
  sharedSecret?: string;
  fileBytes: ArrayBuffer;
  filename: string;
  modality: string;
}): Promise<MonaiResponse> {
  const formData = new FormData();
  formData.append("file", new Blob([args.fileBytes]), args.filename);
  formData.append("modality", args.modality);

  const response = await fetch(`${args.serviceUrl}/analyze`, {
    method: "POST",
    body: formData,
    headers: args.sharedSecret
      ? {
          "x-monai-shared-secret": args.sharedSecret,
        }
      : undefined,
    signal: AbortSignal.timeout(300_000),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`MONAI service error (${response.status}): ${message}`);
  }

  return await response.json() as MonaiResponse;
}
