
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";

const ALLOWED_MODALITIES = ["CT", "MRI", "X-Ray", "Ultrasound", "PET"] as const;

// Helper to get user from token
async function getUserFromRequest() {
    const token = (await cookies()).get("token")?.value;
    if (!token) return null;

    try {
        const secret = getJwtSecret();
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

export async function GET() {
    const user = await getUserFromRequest();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch scans from Supabase
    const { data: scans, error } = await supabase
        .from('scans')
        .select('*, analysis_results(*)')
        .eq('user_id', user.sub)
        .order('upload_date', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ scans });
}

export async function POST(req: Request) {
    const user = await getUserFromRequest();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { fileHash, modality } = body;

        if (!fileHash || typeof fileHash !== 'string') {
            return NextResponse.json({ error: "fileHash is required" }, { status: 400 });
        }

        // Validate fileHash is a hex string (SHA-256 or similar hash)
        if (!/^[a-fA-F0-9]{32,128}$/.test(fileHash)) {
            return NextResponse.json(
                { error: "fileHash must be a valid hex hash (32-128 characters)" },
                { status: 400 }
            );
        }

        // Validate modality against whitelist
        if (modality && !ALLOWED_MODALITIES.includes(modality)) {
            return NextResponse.json(
                { error: `Invalid modality. Allowed values: ${ALLOWED_MODALITIES.join(", ")}` },
                { status: 400 }
            );
        }

        // Insert new scan
        const { data: newScan, error } = await supabase
            .from('scans')
            .insert([{
                user_id: user.sub,
                file_hash: fileHash,
                modality: modality || "CT",
                status: "processing",
            }])
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Trigger Mock AI Analysis (Phase 5 will effectively implement this)
        // For now, we simulate an analysis result after delay? 
        // Or just return the scan. The user asked for "Replace mock data", so maybe just saving is enough.

        return NextResponse.json({ scan: newScan });
    } catch (error) {
        console.error("Create scan error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
