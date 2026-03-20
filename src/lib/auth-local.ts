export type AuthUserRole = "patient" | "admin";

export interface AuthDbUserLike {
  id: string;
  username?: string | null;
  wallet_address: string;
  role: AuthUserRole;
}

export function buildLocalDemoUser(role: AuthUserRole): AuthDbUserLike {
  const normalizedRole = role === "admin" ? "admin" : "patient";

  return {
    id: `local-demo-${normalizedRole}`,
    username: normalizedRole === "admin" ? "Demo Admin" : "Demo Patient",
    wallet_address: `demo-${normalizedRole}-local`,
    role: normalizedRole,
  };
}

export function buildLocalWalletUser(walletAddress: string): AuthDbUserLike {
  return {
    id: `wallet-${walletAddress}`,
    username: "Wallet User",
    wallet_address: walletAddress,
    role: "patient",
  };
}

export function toAuthUser(user: AuthDbUserLike) {
  return {
    id: user.id,
    name: user.username || "Anonymous",
    address: user.wallet_address,
    role: user.role,
  };
}
