

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";
import { buildLocalWalletUser, toAuthUser } from "@/lib/auth-local";

export async function POST(req: Request) {
    try {
        // Rate limit: 5 login attempts per minute per IP
        const ip = getClientIp(req);
        const rateLimitResult = checkRateLimit(`login:${ip}`, {
            windowMs: 60_000,
            maxRequests: 5,
        });
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: "Too many login attempts. Please try again later." },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { message, signature, publicKey } = loginSchema.parse(body);

        // 1. Verify Message with Nonce Check
        const nonceCookie = (await cookies()).get("siwe-nonce");

        if (!nonceCookie) {
            return NextResponse.json({ error: "No nonce found in cookies" }, { status: 422 });
        }

        // Extract nonce from message (we formatted it as "Sign in to MediChainAI\nNonce: <nonce>")
        const messageNonceMatch = message.match(/Nonce: (.*)/);
        if (!messageNonceMatch || messageNonceMatch[1] !== nonceCookie.value) {
            return NextResponse.json({ error: "Invalid nonce" }, { status: 422 });
        }

        // Verify Ed25519 signature using tweetnacl
        try {
            const signatureUint8 = bs58.decode(signature);
            const messageUint8 = new TextEncoder().encode(message);
            const pubKeyUint8 = bs58.decode(publicKey);

            const isValid = nacl.sign.detached.verify(
                messageUint8,
                signatureUint8,
                pubKeyUint8
            );

            if (!isValid) {
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        } catch (e) {
            return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
        }

        const walletAddress = publicKey;

        // 2. Find or Create User via Supabase
        let user;
        if (!isSupabaseConfigured) {
            user = buildLocalWalletUser(walletAddress);
        } else {
            const { data: existingUser, error: findError } = await supabaseServer
                .from('users')
                .select('*')
                .eq('wallet_address', walletAddress)
                .single();

            if (findError && findError.code !== 'PGRST116') { // PGRST116 = not found
                console.error("Supabase find error:", findError);
                return NextResponse.json({ error: `Database error: ${findError.message} (Code: ${findError.code})` }, { status: 500 });
            }

            if (existingUser) {
                user = existingUser;
            } else {
                const { data: newUser, error: createError } = await supabaseServer
                    .from('users')
                    .insert([{ 
                        wallet_address: walletAddress,
                        role: "patient"
                    }])
                    .select()
                    .single();

                if (createError) {
                    console.error("Supabase create error:", createError);
                    return NextResponse.json({ error: `Failed to create user: ${createError.message}` }, { status: 500 });
                }
                user = newUser;
            }
        }

        // 3. Create Session (JWT) using jose
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

        // 4. Return formatted user
        const authUser = toAuthUser(user);

        const response = NextResponse.json({ user: authUser, token });

        // Set cookie
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("Login route error:", error);
        
        // Handle Zod validation errors
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: "Invalid request data", details: error.message },
                { status: 400 }
            );
        }
        
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
