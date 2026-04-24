export class RequestTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestTimeoutError";
  }
}

function parseTimeoutMs(value: string | undefined, fallbackMs: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
}

export function getSupabaseTimeoutMs() {
  return parseTimeoutMs(process.env.SUPABASE_QUERY_TIMEOUT_MS, 4000);
}

export async function withRequestTimeout<T>(
  operation: Promise<T>,
  options?: {
    label?: string;
    timeoutMs?: number;
  }
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? getSupabaseTimeoutMs();
  const label = options?.label ?? "Request";

  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new RequestTimeoutError(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export function isRequestTimeoutError(error: unknown): error is RequestTimeoutError {
  return error instanceof RequestTimeoutError;
}
