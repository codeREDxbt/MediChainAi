type StoredMonaiProvider = {
  confidence?: number | null;
  analysis_mode?: "bundle" | "fallback" | "unavailable";
  confidence_source?: "model_probability" | "estimated_fallback" | "not_available";
};

type StoredAnalysisProviders = {
  monai?: StoredMonaiProvider;
};

type StoredAnalysisRecord = {
  providers?: StoredAnalysisProviders;
};

function roundConfidence(value: number): number {
  return Math.round(value * 10) / 10;
}

export function parseStoredAnalysisRecord(findings?: unknown): StoredAnalysisRecord | null {
  if (!findings) return null;

  if (typeof findings === "string") {
    try {
      const parsed = JSON.parse(findings);
      return parsed && typeof parsed === "object" ? parsed as StoredAnalysisRecord : null;
    } catch {
      return null;
    }
  }

  return typeof findings === "object" ? findings as StoredAnalysisRecord : null;
}

export function getActualModelConfidence(args: {
  findings?: unknown;
  fallbackConfidence?: number | null;
}): number | null {
  const parsed = parseStoredAnalysisRecord(args.findings);
  const monai = parsed?.providers?.monai;

  if (
    monai?.analysis_mode === "bundle"
    && monai?.confidence_source === "model_probability"
    && typeof monai.confidence === "number"
  ) {
    return roundConfidence(monai.confidence);
  }

  if (parsed?.providers) {
    return null;
  }

  if (typeof args.fallbackConfidence !== "number" || Number.isNaN(args.fallbackConfidence)) {
    return null;
  }

  return roundConfidence(args.fallbackConfidence);
}

export function hasActualModelConfidence(args: {
  findings?: unknown;
  fallbackConfidence?: number | null;
}): boolean {
  return getActualModelConfidence(args) !== null;
}
