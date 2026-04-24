export type DemoRole = "patient" | "admin";

export const DEMO_PATIENT_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_ADMIN_ID = "00000000-0000-4000-8000-000000000002";

export function isDemoWalletAddress(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("Demo");
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function getStableDemoUser(role: DemoRole) {
  return {
    id: role === "admin" ? DEMO_ADMIN_ID : DEMO_PATIENT_ID,
    username: `Demo ${role}`,
    wallet_address: role === "admin" ? "DemoAdmin_Local" : "DemoPatient_Local",
    role,
  };
}

export async function resolveDemoUserId(args: {
  userId: string;
  walletAddress?: unknown;
  role?: unknown;
  supabase: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: unknown) => {
          single: () => Promise<{ data: { id?: string } | null; error: { code?: string; message?: string } | null }>;
        };
      };
      upsert: (
        values: Record<string, unknown>,
        options?: { onConflict?: string }
      ) => {
        select: (columns?: string) => {
          single: () => Promise<{ data: { id?: string } | null; error: { message?: string } | null }>;
        };
      };
    };
  };
}): Promise<string> {
  if (isUuid(args.userId)) {
    return args.userId;
  }

  if (!isDemoWalletAddress(args.walletAddress)) {
    return args.userId;
  }

  const role: DemoRole = args.role === "admin" ? "admin" : "patient";
  const stableUser = getStableDemoUser(role);

  const { data: existingUser, error: findError } = await args.supabase
    .from("users")
    .select("id")
    .eq("wallet_address", args.walletAddress)
    .single();

  if (!findError && existingUser?.id) {
    return existingUser.id;
  }

  const { data: createdUser, error: createError } = await args.supabase
    .from("users")
    .upsert(stableUser, { onConflict: "wallet_address" })
    .select("id")
    .single();

  if (!createError && createdUser?.id) {
    return createdUser.id;
  }

  return stableUser.id;
}
