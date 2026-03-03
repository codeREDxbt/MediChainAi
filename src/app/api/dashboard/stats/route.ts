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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = getJwtSecret();

        const { payload } = await jwtVerify(token, secret);
        const userId = payload.sub as string;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: scans, error: scansError } = await supabase
            .from('scans')
            .select('id, upload_date')
            .eq('user_id', userId);

        if (scansError) {
            console.error("Supabase scans error:", scansError);
            return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
        }

        const totalScans = scans?.length || 0;
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentScans = scans?.filter(s => new Date(s.upload_date) >= sevenDaysAgo).length || 0;

        const { data: analyses, error: analysesError } = await supabase
            .from('scans')
            .select('analysis_results(confidence_score)')
            .eq('user_id', userId);

        if (analysesError) {
            console.error("Supabase analyses error:", analysesError);
        }

        let totalConfidence = 0;
        let confidenceCount = 0;
        
        if (analyses) {
            for (const scan of analyses) {
                const analysis = Array.isArray(scan.analysis_results)
                    ? scan.analysis_results[0]
                    : scan.analysis_results;

                const score = analysis?.confidence_score;
                if (score !== null && score !== undefined) {
                    totalConfidence += score;
                    confidenceCount++;
                }
            }
        }

        const avgAccuracy = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

        const stats = [
            {
                label: "LOCAL SCANS",
                value: totalScans,
                delta: `+${recentScans} this week`,
                deltaType: recentScans > 0 ? "positive" : "neutral",
                icon: "scan",
            },
            {
                label: "ACCURACY",
                value: confidenceCount > 0 ? `${avgAccuracy.toFixed(1)}%` : "N/A",
                delta: confidenceCount > 0 ? "~" : "No data",
                deltaType: "positive",
                icon: "accuracy",
            },
        ];

        return NextResponse.json({ stats });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
