import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isProduction = process.env.NODE_ENV === 'production';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseServiceRoleConfigured = Boolean(supabaseServiceRoleKey);

function createUnavailableClient(path = "supabase"): ReturnType<typeof createClient> {
    const throwMissingConfig = () => {
        throw new Error(
            `Supabase is not configured. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY while accessing ${path}.`
        );
    };

    return new Proxy(throwMissingConfig, {
        get(_target, prop) {
            if (prop === "then") return undefined;
            return createUnavailableClient(`${path}.${String(prop)}`);
        },
        apply() {
            throwMissingConfig();
        },
    }) as unknown as ReturnType<typeof createClient>;
}

if (!isSupabaseConfigured) {
    console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Running with limited local auth fallbacks.');
}

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    })
    : createUnavailableClient("supabase");

if (isProduction && !supabaseServiceRoleKey) {
    console.warn('[supabase] Missing SUPABASE_SERVICE_ROLE_KEY in production. Server-side database writes will fail.');
}

if (!isProduction && !supabaseServiceRoleKey) {
    console.warn('[supabase] SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to anon client for local development.');
}

export const supabaseServer = isSupabaseConfigured
    ? (
        supabaseServiceRoleKey
            ? createClient(supabaseUrl!, supabaseServiceRoleKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
            })
            : supabase
    )
    : createUnavailableClient("supabaseServer");
