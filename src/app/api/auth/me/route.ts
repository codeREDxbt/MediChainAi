
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
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
    // payload has sub (id), walletAddress, role

    // Optionally fetch fresh data from DB to ensure user still exists/role hasn't changed
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !user) {
      return NextResponse.json({ user: null });
    }

    // Map to AuthUser interface
    const authUser = {
      id: user.id,
      name: user.username || "Anonymous",
      address: user.wallet_address,
      role: user.role
    };

    return NextResponse.json({ user: authUser });
  } catch (error) {
    // If token invalid/expired, return null user
    return NextResponse.json({ user: null });
  }
}
