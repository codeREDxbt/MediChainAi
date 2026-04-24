
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { getStableDemoUser, isDemoWalletAddress } from "@/lib/demo-auth";
import { withRequestTimeout } from "@/lib/request-timeout";

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
    let user = null;
    let error = null;

    try {
      const result = await withRequestTimeout(
        supabaseServer
          .from('users')
          .select('*')
          .eq('id', payload.sub)
          .single(),
        { label: "Current user lookup" }
      );

      user = result.data;
      error = result.error;
    } catch (lookupError) {
      error = lookupError;
    }

    if (error || !user) {
      if (isDemoWalletAddress(payload.walletAddress) && typeof payload.role === "string") {
        const demoUser = getStableDemoUser(payload.role === "admin" ? "admin" : "patient");
        return NextResponse.json({
          user: {
            id: demoUser.id,
            name: demoUser.username,
            address: payload.walletAddress,
            role: demoUser.role,
          }
        });
      }

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
