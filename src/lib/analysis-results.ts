export type AnalysisSource = "openrouter" | "monai" | string;

export interface AnalysisFindingsRecord {
  summary?: string;
  details?: string[];
  urgent?: boolean;
  [key: string]: unknown;
}

export interface StoredAnalysisResult {
  id?: string;
  scan_id?: string;
  confidence_score?: number | null;
  findings?: AnalysisFindingsRecord | null;
  processed_at?: string | null;
  model_source?: string | null;
  [key: string]: unknown;
}

export type AnalysisRelation =
  | StoredAnalysisResult
  | StoredAnalysisResult[]
  | null
  | undefined;

function toDetails(details: unknown): string[] {
  if (!Array.isArray(details)) return [];
  return details
    .map((detail) => String(detail).trim())
    .filter(Boolean);
}

export function normalizeAnalysisSource(
  source?: string | null
): AnalysisSource {
  const normalized = source?.trim().toLowerCase();
  return normalized || "openrouter";
}

export function normalizeAnalysisResults(
  value: AnalysisRelation
): StoredAnalysisResult[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

export function getAnalysisBySource(
  value: AnalysisRelation,
  source: AnalysisSource
): StoredAnalysisResult | null {
  const normalizedSource = normalizeAnalysisSource(source);

  return (
    normalizeAnalysisResults(value)
      .filter(
        (analysis) =>
          normalizeAnalysisSource(analysis.model_source) === normalizedSource
      )
      .sort((left, right) => {
        const leftTime = Date.parse(left.processed_at ?? "");
        const rightTime = Date.parse(right.processed_at ?? "");
        return rightTime - leftTime;
      })[0] ?? null
  );
}

export function hasAnalysisSource(
  value: AnalysisRelation,
  source: AnalysisSource
): boolean {
  return !!getAnalysisBySource(value, source);
}

export function getPrimaryAnalysis(
  value: AnalysisRelation
): StoredAnalysisResult | null {
  const analyses = normalizeAnalysisResults(value);
  if (analyses.length === 0) return null;

  return (
    getAnalysisBySource(analyses, "openrouter") ??
    getAnalysisBySource(analyses, "monai") ??
    analyses
      .slice()
      .sort((left, right) => {
        const leftTime = Date.parse(left.processed_at ?? "");
        const rightTime = Date.parse(right.processed_at ?? "");
        return rightTime - leftTime;
      })[0]
  );
}

export function mergeAnalysisFindings(
  value: AnalysisRelation
): AnalysisFindingsRecord | null {
  const analyses = normalizeAnalysisResults(value);
  const primary = getPrimaryAnalysis(analyses);

  if (!primary) return null;

  const primarySource = normalizeAnalysisSource(primary.model_source);
  const sourceReports: Record<string, AnalysisFindingsRecord> = {};
  const confidenceBySource: Record<string, number | null> = {};
  const mergedDetails: string[] = [];
  const detailSet = new Set<string>();
  let urgent = false;

  const pushDetail = (detail: string, source: string, prefix = false) => {
    const candidate = prefix ? `${source.toUpperCase()}: ${detail}` : detail;
    if (detailSet.has(candidate)) return;
    detailSet.add(candidate);
    mergedDetails.push(candidate);
  };

  for (const analysis of analyses) {
    const source = normalizeAnalysisSource(analysis.model_source);
    const findings =
      analysis.findings && typeof analysis.findings === "object"
        ? analysis.findings
        : {};

    sourceReports[source] = findings;
    confidenceBySource[source] =
      typeof analysis.confidence_score === "number"
        ? analysis.confidence_score
        : null;
    urgent = urgent || Boolean(findings.urgent);
  }

  const primaryFindings =
    primary.findings && typeof primary.findings === "object"
      ? primary.findings
      : {};

  for (const detail of toDetails(primaryFindings.details)) {
    pushDetail(detail, primarySource, false);
  }

  for (const analysis of analyses) {
    const source = normalizeAnalysisSource(analysis.model_source);
    if (source === primarySource) continue;

    const findings =
      analysis.findings && typeof analysis.findings === "object"
        ? analysis.findings
        : {};

    if (
      typeof findings.summary === "string" &&
      findings.summary.trim() &&
      findings.summary.trim() !== String(primaryFindings.summary ?? "").trim()
    ) {
      pushDetail(findings.summary.trim(), source, true);
    }

    for (const detail of toDetails(findings.details)) {
      pushDetail(detail, source, true);
    }
  }

  return {
    ...primaryFindings,
    summary:
      typeof primaryFindings.summary === "string" &&
      primaryFindings.summary.trim()
        ? primaryFindings.summary
        : String(
            analyses
              .map((analysis) => analysis.findings?.summary)
              .find((summary) => typeof summary === "string" && summary.trim()) ??
              "Analysis complete."
          ),
    details: mergedDetails,
    urgent,
    primary_source: primarySource,
    available_sources: analyses.map((analysis) =>
      normalizeAnalysisSource(analysis.model_source)
    ),
    source_reports: sourceReports,
    confidence_by_source: confidenceBySource,
    segmentation_overlay:
      sourceReports.monai?.segmentation_overlay ?? null,
    model_used: sourceReports.monai?.model_used ?? null,
    inference_seconds: sourceReports.monai?.inference_seconds ?? null,
    primary_label: sourceReports.monai?.primary_label ?? null,
  };
}

export function buildPresentationAnalysis(
  value: AnalysisRelation
): StoredAnalysisResult | null {
  const analyses = normalizeAnalysisResults(value);
  const primary = getPrimaryAnalysis(analyses);

  if (!primary) return null;

  const numericScores = analyses
    .map((analysis) => analysis.confidence_score)
    .filter((score): score is number => typeof score === "number");

  return {
    ...primary,
    confidence_score:
      typeof primary.confidence_score === "number"
        ? primary.confidence_score
        : numericScores[0] ?? null,
    findings: mergeAnalysisFindings(analyses),
    model_source:
      analyses.length > 1
        ? "merged"
        : normalizeAnalysisSource(primary.model_source),
  };
}
