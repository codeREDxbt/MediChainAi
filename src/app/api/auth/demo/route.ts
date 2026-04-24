import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { demoLoginSchema } from "@/lib/validation";
import { getStableDemoUser } from "@/lib/demo-auth";
import { isRequestTimeoutError, withRequestTimeout } from "@/lib/request-timeout";

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
        const fallbackUser = getStableDemoUser(role);

        const demoAddress = role === "admin"
            ? "DemoAdmin_" + process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '_')
            : "DemoPatient_" + process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '_');

        let user = null;
        let databaseUnavailable = false;

        try {
            const { data: existingUser, error: findError } = await withRequestTimeout(
                supabaseServer
                    .from('users')
                    .select('*')
                    .eq('wallet_address', demoAddress)
                    .single(),
                { label: "Demo user lookup" }
            );

            if (findError && findError.code !== 'PGRST116') {
                databaseUnavailable = true;
                console.error("Supabase find error, using demo fallback:", findError);
            } else {
                user = existingUser;
            }
        } catch (error) {
            databaseUnavailable = true;
            console.error("Demo user lookup failed, using demo fallback:", error);
        }

        // Create user if not exists
        if (!user && !databaseUnavailable) {
            try {
                const { data: newUser, error: createError } = await withRequestTimeout(
                    supabaseServer
                        .from('users')
                        .insert([{
                            wallet_address: demoAddress,
                            username: `Demo ${role}`,
                            role: role
                        }])
                        .select()
                        .single(),
                    { label: "Demo user create" }
                );

                if (createError) {
                    console.error("Supabase create error:", createError);
                    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
                }
                user = newUser;
            } catch (error) {
                databaseUnavailable = true;
                console.error("Demo user creation failed, using demo fallback:", error);
            }
        }

        if (!user) {
            user = fallbackUser;
        }

        // Create JWT
        const secret = getJwtSecret();
        const token = await new SignJWT({ 
            sub: user.id,
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
            user: {
                id: user.id,
                name: user.username,
                address: user.wallet_address,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Demo login error:", error);

        if (isRequestTimeoutError(error)) {
            return NextResponse.json({ error: "Demo login timed out" }, { status: 504 });
        }
        
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: "Invalid role. Must be 'patient' or 'admin'" },
                { status: 400 }
            );
        }
        
        return NextResponse.json({ error: "Failed to login as demo" }, { status: 500 });
    }
}
