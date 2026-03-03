export interface Scan {
  id: string;
  userId: string;
  fileHash: string;
  originalName: string | null;
  modality: string | null;
  patientName: string | null;
  studyDate: Date | null;
  seriesDesc: string | null;
  convertedImage: string | null;
  status: ScanStatus;
  uploadDate: Date;
}

export interface AnalysisResult {
  id: string;
  scanId: string;
  confidenceScore: number | null;
  findings: AnalysisFindings | null;
  processedAt: Date;
}

export interface AnalysisFindings {
  summary: string;
  details: string[];
  urgent: boolean;
}

export type ScanStatus = "uploading" | "Pending Review" | "Analyzed" | "Failed";

export interface FormattedScan {
  id: string;
  scanType: string;
  originalName: string | null;
  patientName: string | null;
  studyDate: string | null;
  seriesDesc: string | null;
  riskScore: number;
  riskLevel: "High" | "Low" | "Medium";
  findings: string;
  confidence: number;
  txHash: string;
  timestamp: string;
  imageUrl: string;
  convertedImageUrl: string | null;
  status: ScanStatus;
  modality?: string;
  region?: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  scans?: FormattedScan[];
  scan?: FormattedScan;
}
