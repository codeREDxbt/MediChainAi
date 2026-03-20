import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

interface ProfileUpdate {
  username?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
}

async function getAuthPayload() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return null;
  }

  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret);
  const userId = payload.sub as string;

  if (!userId) {
    return null;
  }

  return {
    userId,
    payload,
  };
}

function buildLocalProfile(payload: Awaited<ReturnType<typeof getAuthPayload>>["payload"] | undefined) {
  const role = payload?.role === "admin" ? "admin" : "patient";
  const walletAddress =
    typeof payload?.walletAddress === "string" && payload.walletAddress
      ? payload.walletAddress
      : "demo-patient-local";

  return {
    id: String(payload?.sub || `local-demo-${role}`),
    username: typeof payload?.name === "string" && payload.name.trim() ? payload.name : role === "admin" ? "Demo Admin" : "Demo Patient",
    email: null,
    phone: null,
    dateOfBirth: null,
    emergencyContact: null,
    avatarUrl: null,
    role,
    walletAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildProfileStatsFromScans(scans: Array<{ status?: string | null }> = []) {
  const totalScans = scans.length;
  const analyzedScans = scans.filter((scan) => scan.status === "Analyzed").length;
  const pendingScans = totalScans - analyzedScans;

  return {
    totalScans,
    analyzedScans,
    pendingScans,
  };
}

export async function GET() {
  try {
    const auth = await getAuthPayload();

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        user: buildLocalProfile(auth.payload),
        stats: buildProfileStatsFromScans(),
      });
    }

    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', auth.userId)
      .single();

    if (userError || !user) {
      console.error("Profile fetch error:", userError);
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    const { data: scans, error: scansError } = await supabaseServer
      .from('scans')
      .select('status')
      .eq('user_id', auth.userId);

    if (scansError) {
      console.error("Profile scans error:", scansError);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        emergencyContact: user.emergency_contact,
        avatarUrl: user.avatar_url,
        role: user.role,
        walletAddress: user.wallet_address,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      stats: buildProfileStatsFromScans(scans || []),
    });
  } catch (error) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await getAuthPayload();

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ProfileUpdate = await req.json();

    const updateData: Record<string, any> = {};
    
    if (body.username !== undefined) updateData.username = body.username;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.dateOfBirth !== undefined) {
      updateData.date_of_birth = body.dateOfBirth ? new Date(body.dateOfBirth).toISOString() : null;
    }
    if (body.emergencyContact !== undefined) updateData.emergency_contact = body.emergencyContact;

    updateData.updated_at = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const localProfile = buildLocalProfile(auth.payload);

      return NextResponse.json({
        success: true,
        user: {
          ...localProfile,
          username: body.username ?? localProfile.username,
          email: body.email ?? localProfile.email,
          phone: body.phone ?? localProfile.phone,
          emergencyContact: body.emergencyContact ?? localProfile.emergencyContact,
          dateOfBirth: body.dateOfBirth ?? localProfile.dateOfBirth,
          updatedAt: new Date().toISOString(),
        }
      });
    }

    const { data: user, error } = await supabaseServer
      .from('users')
      .update(updateData)
      .eq('id', auth.userId)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        emergencyContact: user.emergency_contact,
        avatarUrl: user.avatar_url,
        role: user.role,
        walletAddress: user.wallet_address,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }
    });
  } catch (error) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
