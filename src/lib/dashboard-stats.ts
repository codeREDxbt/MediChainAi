import { buildPresentationAnalysis } from "@/lib/analysis-results";

export interface ScanRecord {
  id: string;
  upload_date: string;
}

export interface AnalysisRecord {
  analysis_results:
    | {
        confidence_score?: number | null;
        model_source?: string | null;
        processed_at?: string | null;
      }
    | Array<{
        confidence_score?: number | null;
        model_source?: string | null;
        processed_at?: string | null;
      }>
    | null;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
  icon: string;
}

function getConfidenceScore(record: AnalysisRecord): number | null {
  const analysis = buildPresentationAnalysis(record.analysis_results);

  const score = analysis?.confidence_score;

  if (score === null || score === undefined || Number.isNaN(Number(score))) {
    return null;
  }

  return Number(score);
}

export function buildDashboardStats(
  scans: ScanRecord[],
  analyses: AnalysisRecord[],
  now: Date = new Date()
): DashboardStat[] {
  const totalScans = scans.length;

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentScans = scans.filter((scan) => new Date(scan.upload_date) >= sevenDaysAgo).length;

  let totalConfidence = 0;
  let confidenceCount = 0;

  for (const analysisRecord of analyses) {
    const score = getConfidenceScore(analysisRecord);
    if (score !== null) {
      totalConfidence += score;
      confidenceCount++;
    }
  }

  const avgAccuracy = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

  return [
    {
      label: "LOCAL SCANS",
      value: totalScans,
      delta: `+${recentScans} this week`,
      deltaType: recentScans > 0 ? "positive" : "neutral",
      icon: "scan",
    },
    {
      label: "ACCURACY",
      value: confidenceCount > 0 ? `${avgAccuracy.toFixed(1)}%` : "N/A",
      delta: confidenceCount > 0 ? "~" : "No data",
      deltaType: "positive",
      icon: "accuracy",
    },
  ];
}
