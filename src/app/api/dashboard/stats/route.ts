import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { buildDashboardStats } from "@/lib/dashboard-stats";
import { withRequestTimeout } from "@/lib/request-timeout";

export const dynamic = 'force-dynamic';

function isDemoWalletAddress(value: unknown): value is string {
    return typeof value === "string" && value.startsWith("Demo");
}

export async function GET() {
    try {
        const token = (await cookies()).get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = getJwtSecret();

        const { payload } = await jwtVerify(token, secret);
        const userId = payload.sub as string;
        const walletAddress = payload.walletAddress;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let scans = null;
        let scansError = null;

        try {
            const result = await withRequestTimeout(
                supabaseServer
                    .from('scans')
                    .select('id, upload_date, status, analysis_results(confidence_score, findings)')
                    .eq('user_id', userId),
                { label: "Dashboard scans lookup" }
            );

            scans = result.data;
            scansError = result.error;
        } catch (error) {
            scansError = error;
        }

        if (scansError) {
            console.error("Supabase scans error:", scansError);
            if (isDemoWalletAddress(walletAddress)) {
                return NextResponse.json({ stats: buildDashboardStats([], []) });
            }
            return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
        }

        const stats = buildDashboardStats(scans ?? []);

        return NextResponse.json({ stats });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
