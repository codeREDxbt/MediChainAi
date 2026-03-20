
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const secret = getJwtSecret();

    // Verify JWT
    const { payload } = await jwtVerify(token, secret);
    const payloadUser = {
      id: String(payload.sub || ""),
      name: typeof payload.name === "string" && payload.name.trim() ? payload.name : "Anonymous",
      address: typeof payload.walletAddress === "string" ? payload.walletAddress : "",
      role: payload.role === "admin" ? "admin" : "patient",
    };

    if (!payloadUser.id || !payloadUser.address) {
      return NextResponse.json({ user: null });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ user: payloadUser });
    }

    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !user) {
      return NextResponse.json({ user: payloadUser });
    }

    const authUser = {
      id: user.id,
      name: user.username || payloadUser.name,
      address: user.wallet_address,
      role: user.role
    };

    return NextResponse.json({ user: authUser });
  } catch (error) {
    // If token invalid/expired, return null user
    return NextResponse.json({ user: null });
  }
}
