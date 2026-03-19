import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { demoLoginSchema } from "@/lib/validation";

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

        const demoAddress = role === "admin"
            ? "DemoAdmin_" + process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '_')
            : "DemoPatient_" + process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 10).replace(/[^a-zA-Z0-9]/g, '_');

        // Find existing user
        const { data: existingUser, error: findError } = await supabaseServer
            .from('users')
            .select('*')
            .eq('wallet_address', demoAddress)
            .single();

        let user = existingUser;

        if (findError && findError.code !== 'PGRST116') {
            console.error("Supabase find error:", findError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        // Create user if not exists
        if (!user) {
            const { data: newUser, error: createError } = await supabaseServer
                .from('users')
                .insert([{
                    wallet_address: demoAddress,
                    username: `Demo ${role}`,
                    role: role
                }])
                .select()
                .single();

            if (createError) {
                console.error("Supabase create error:", createError);
                return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
            }
            user = newUser;
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
        
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: "Invalid role. Must be 'patient' or 'admin'" },
                { status: 400 }
            );
        }
        
        return NextResponse.json({ error: "Failed to login as demo" }, { status: 500 });
    }
}
