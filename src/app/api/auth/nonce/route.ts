
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 10 nonce requests per minute per IP
  const ip = getClientIp(req);
  const rateLimitResult = checkRateLimit(`nonce:${ip}`, {
    windowMs: 60_000,
    maxRequests: 10,
  });
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const nonce = crypto.randomBytes(16).toString('base64');

  // Store nonce in a secure httpOnly cookie to verify later
  (await cookies()).set("siwe-nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 300, // 5 minutes expiration
  });

  return NextResponse.json({ nonce });
}
