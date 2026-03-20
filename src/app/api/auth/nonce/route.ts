import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST() {
  const nonce = crypto.randomUUID();
  const response = NextResponse.json({ nonce });

  response.cookies.set("siwe-nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
