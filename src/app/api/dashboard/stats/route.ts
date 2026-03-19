import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { buildDashboardStats } from "@/lib/dashboard-stats";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const token = (await cookies()).get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = getJwtSecret();

        const { payload } = await jwtVerify(token, secret);
        const userId = payload.sub as string;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: scans, error: scansError } = await supabaseServer
            .from('scans')
            .select('id, upload_date')
            .eq('user_id', userId);

        if (scansError) {
            console.error("Supabase scans error:", scansError);
            return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
        }

        const { data: analyses, error: analysesError } = await supabaseServer
            .from('scans')
            .select('analysis_results(confidence_score)')
            .eq('user_id', userId);

        if (analysesError) {
            console.error("Supabase analyses error:", analysesError);
        }

        const stats = buildDashboardStats(scans ?? [], analyses ?? []);

        return NextResponse.json({ stats });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
