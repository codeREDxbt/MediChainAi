import { getActualModelConfidence } from "@/lib/analysis-confidence";

export interface ScanAnalysisRecord {
  confidence_score?: number | null;
  findings?: unknown;
}

export interface ScanRecord {
  id: string;
  upload_date: string;
  status?: string | null;
  analysis_results?: ScanAnalysisRecord | ScanAnalysisRecord[] | null;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
  icon: string;
}

function getAnalysisRecord(scan: ScanRecord): ScanAnalysisRecord | null {
  if (Array.isArray(scan.analysis_results)) {
    return scan.analysis_results[0] ?? null;
  }

  return scan.analysis_results ?? null;
}

function getConfidenceScore(scan: ScanRecord): number | null {
  const analysis = getAnalysisRecord(scan);

  return getActualModelConfidence({
    findings: analysis?.findings,
    fallbackConfidence: analysis?.confidence_score,
  });
}

export function buildDashboardStats(
  scans: ScanRecord[],
  now: Date = new Date()
): DashboardStat[] {
  const totalScans = scans.length;
  const reportsSubmitted = scans.filter((scan) => getAnalysisRecord(scan) !== null).length;
  const scansDone = scans.filter((scan) => {
    const status = scan.status?.toLowerCase();
    return status === "analyzed" || status === "pending review";
  }).length;

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentScans = scans.filter((scan) => new Date(scan.upload_date) >= sevenDaysAgo).length;
  const recentReports = scans.filter((scan) => {
    if (new Date(scan.upload_date) < sevenDaysAgo) return false;
    return getAnalysisRecord(scan) !== null;
  }).length;
  const recentCompleted = scans.filter((scan) => {
    if (new Date(scan.upload_date) < sevenDaysAgo) return false;
    const status = scan.status?.toLowerCase();
    return status === "analyzed" || status === "pending review";
  }).length;

  let totalConfidence = 0;
  let confidenceCount = 0;

  for (const scan of scans) {
    const score = getConfidenceScore(scan);
    if (score !== null) {
      totalConfidence += score;
      confidenceCount++;
    }
  }

  const avgAccuracy = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

  return [
    {
      label: "TOTAL SCANS",
      value: totalScans,
      delta: `+${recentScans} this week`,
      deltaType: recentScans > 0 ? "positive" : "neutral",
      icon: "scan",
    },
    {
      label: "REPORTS SUBMITTED",
      value: reportsSubmitted,
      delta: `+${recentReports} this week`,
      deltaType: recentReports > 0 ? "positive" : "neutral",
      icon: "report",
    },
    {
      label: "SCANS DONE",
      value: scansDone,
      delta: `+${recentCompleted} this week`,
      deltaType: recentCompleted > 0 ? "positive" : "neutral",
      icon: "completed",
    },
    {
      label: "MODEL CONFIDENCE",
      value: confidenceCount > 0 ? `${avgAccuracy.toFixed(1)}%` : "N/A",
      delta: confidenceCount > 0 ? `${confidenceCount} analyzed` : "No data",
      deltaType: "positive",
      icon: "accuracy",
    },
  ];
}
