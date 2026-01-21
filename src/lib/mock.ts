// Types for MediChainAI mock data

export interface User {
  id: string;
  name: string;
  title: string;
  avatar: string;
  walletAddress: string;
}

export interface WalletData {
  balance: number;
  currency: string;
  usdValue: number;
  pendingRewards: number;
}

export interface StatData {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  icon?: string;
}

export interface ActivityItem {
  id: string;
  type: "batch_verified" | "model_updated" | "rewards_distributed" | "fl_round";
  title: string;
  subtitle?: string;
  timestamp: string;
  amount?: number;
  amountType?: "positive" | "negative";
  status?: "pending" | "verified" | "completed";
  hash?: string;
}

export interface TransferStatus {
  status: "ready" | "processing" | "complete" | "error";
  steps: {
    name: string;
    progress: number;
  }[];
}

export interface ScanAnalysis {
  id: string;
  scanType: string;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High";
  findings: string;
  confidence: number;
  txHash: string;
  timestamp: string;
  imageUrl: string;
}

export interface FederatedStatus {
  localRound: number;
  globalRound: number;
  status: string;
  currentEpoch: number;
  totalEpochs: number;
  timeRemaining: string;
  modelAccuracy: number;
  accuracyDelta: string;
  mediTokens: number;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "hash";
}

export interface EarningsDataPoint {
  date: string;
  value: number;
}

// Mock Data

export const mockUser: User = {
  id: "usr_1",
  name: "Dr. Silva",
  title: "Radiologist",
  avatar: "/avatar.png",
  walletAddress: "0x71c...9A23",
};

export const mockWallet: WalletData = {
  balance: 1240.50,
  currency: "MC-AI",
  usdValue: 450.21,
  pendingRewards: 450,
};

export const mockDashboardStats: StatData[] = [
  {
    label: "LOCAL SCANS",
    value: 24,
    delta: "+2 this week",
    deltaType: "positive",
    icon: "scan",
  },
  {
    label: "ACCURACY",
    value: "99.1%",
    delta: "+0.4% improve",
    deltaType: "positive",
    icon: "accuracy",
  },
];

export const mockRecentActivity: ActivityItem[] = [
  {
    id: "act_1",
    type: "batch_verified",
    title: "Batch #22 Verified",
    subtitle: "Tx: 0x8f1...3a29",
    timestamp: "2m ago",
    status: "verified",
  },
  {
    id: "act_2",
    type: "model_updated",
    title: "Global Model Updated",
    subtitle: "Weight Sync v4.1",
    timestamp: "1h ago",
    status: "completed",
  },
  {
    id: "act_3",
    type: "rewards_distributed",
    title: "Rewards Distributed",
    subtitle: "+12.5 MC-AI",
    timestamp: "5h ago",
    amount: 12.5,
    amountType: "positive",
    status: "completed",
  },
];

export const mockWalletActivity: ActivityItem[] = [
  {
    id: "wact_1",
    type: "fl_round",
    title: "Federated Learning Round",
    subtitle: "#402",
    timestamp: "Today, 10:42 AM",
    amount: 50.00,
    amountType: "positive",
    status: "pending",
    hash: "0x8a...3f91",
  },
];

export const mockTransferStatus: TransferStatus = {
  status: "ready",
  steps: [
    { name: "AES-256 Encryption", progress: 0 },
    { name: "IPFS Anchor", progress: 0 },
  ],
};

export const mockScanAnalysis: ScanAnalysis = {
  id: "4920",
  scanType: "CT Chest",
  riskScore: 87,
  riskLevel: "High",
  findings: "Irregular density detected in upper right lobe. Suggests potential nodular formation.",
  confidence: 94.2,
  txHash: "0x7a83...4f92c",
  timestamp: "2024-01-21T10:30:00Z",
  imageUrl: "/ct-scan.png",
};

export const mockFederatedStatus: FederatedStatus = {
  localRound: 45,
  globalRound: 120,
  status: "Computing gradients...",
  currentEpoch: 12,
  totalEpochs: 50,
  timeRemaining: "~14 min",
  modelAccuracy: 94.2,
  accuracyDelta: "+1.2%",
  mediTokens: 12.5,
};

export const mockLogEntries: LogEntry[] = [
  { timestamp: "10:42:01", message: "Initializing local tensor cores...", type: "info" },
  { timestamp: "10:42:05", message: "Local gradients computed successfully.", type: "success" },
  { timestamp: "10:42:08", message: "Encrypting payloads (Homomorphic)...", type: "info" },
  { timestamp: "10:42:12", message: "Tx Hash: 0x7f29...3a9c sent to Polygon Node.", type: "hash" },
  { timestamp: "10:42:13", message: "Waiting for validation...", type: "info" },
];

export const mockEarningsHistory: EarningsDataPoint[] = [
  { date: "Mon", value: 20 },
  { date: "Tue", value: 35 },
  { date: "Wed", value: 28 },
  { date: "Thu", value: 45 },
  { date: "Fri", value: 42 },
  { date: "Sat", value: 55 },
  { date: "Sun", value: 68 },
];
