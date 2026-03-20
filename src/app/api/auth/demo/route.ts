import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { demoLoginSchema } from "@/lib/validation";
import { buildLocalDemoUser, toAuthUser } from "@/lib/auth-local";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const demoAuthEnabled =
            process.env.NODE_ENV !== "production" ||
            process.env.ENABLE_DEMO_AUTH === "true";

        if (!demoAuthEnabled) {
            return NextResponse.json({ error: "Demo auth is disabled" }, { status: 403 });
        }

        const body = await req.json();
        const { role } = demoLoginSchema.parse(body);
        let user = buildLocalDemoUser(role);

        if (isSupabaseConfigured) {
            const supabaseProjectSlug = process.env.NEXT_PUBLIC_SUPABASE_URL
                ?.replace(/^https?:\/\//, "")
                .split(".")[0]
                ?.replace(/[^a-zA-Z0-9]/g, "_") || "local";
            const demoAddress = role === "admin"
                ? `DemoAdmin_${supabaseProjectSlug}`
                : `DemoPatient_${supabaseProjectSlug}`;

            const { data: existingUser, error: findError } = await supabaseServer
                .from('users')
                .select('*')
                .eq('wallet_address', demoAddress)
                .single();

            if (findError && findError.code !== 'PGRST116') {
                console.error("Supabase find error:", findError);
                return NextResponse.json({ error: "Database error" }, { status: 500 });
            }

            if (existingUser) {
                user = existingUser;
            } else {
                const { data: newUser, error: createError } = await supabaseServer
                    .from('users')
                    .insert([{
                        wallet_address: demoAddress,
                        username: role === "admin" ? "Demo Admin" : "Demo Patient",
                        role,
                    }])
                    .select()
                    .single();

                if (createError) {
                    console.error("Supabase create error:", createError);
                    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
                }
                user = newUser;
            }
        }

        // Create JWT
        const secret = getJwtSecret();
        const token = await new SignJWT({ 
            sub: user.id,
            name: user.username || "Anonymous",
            walletAddress: user.wallet_address,
            role: user.role
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(secret);

        // Set cookie
        (await cookies()).set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24,
            path: "/"
        });

        return NextResponse.json({
            user: toAuthUser(user),
        });
    } catch (error) {
        console.error("Demo login error:", error);
        
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: "Invalid role. Must be 'patient' or 'admin'" },
                { status: 400 }
            );
        }
        
        return NextResponse.json({ error: "Failed to login as demo" }, { status: 500 });
    }
}
