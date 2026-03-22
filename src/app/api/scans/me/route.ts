import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
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

        // Fetch user's scans from Supabase
        const { data: scans, error: scansError } = await supabaseServer
            .from('scans')
            .select('*, analysis_results(*)')
            .eq('user_id', userId)
            .order('upload_date', { ascending: false });

        if (scansError) {
            console.error("Supabase scans error:", scansError);
            return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
        }

        const formattedScans = scans.map((scan) => {
            const analysis = Array.isArray(scan.analysis_results)
                ? scan.analysis_results[0]
                : scan.analysis_results;
            const hasAnalysis = !!analysis;

            const isImage = (() => {
                const ext = scan.file_hash?.split('.').pop()?.toLowerCase();
                return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
            })();
            return {
                id: scan.id,
                scanType: scan.modality && scan.modality !== "Unknown" ? scan.modality : "Medical Scan",
                type: scan.modality && scan.modality !== "Unknown" ? scan.modality : "Medical Scan",
                originalName: scan.original_name || null,
                patientName: scan.patient_name || null,
                riskScore: hasAnalysis ? Math.round(analysis.confidence_score) : 0,
                aiScore: hasAnalysis ? Math.round(analysis.confidence_score) : 0,
                confidence: hasAnalysis ? Math.round(analysis.confidence_score) : 0,
                findings: hasAnalysis ? JSON.stringify(analysis.findings) : "Pending Analysis",
                timestamp: scan.upload_date,
                date: scan.upload_date,
                imageUrl: isImage ? `/api/scans/${scan.id}/image` : `/api/scans/${scan.id}/image`,
                convertedImageUrl: scan.converted_image ? `/api/scans/${scan.id}/image?converted=true` : null,
                status: hasAnalysis ? "Analyzed" : (scan.status === "Analyzed" ? "Pending Review" : (scan.status || "Pending Review")),
                blockchain: "pending",
                size: "N/A",
                txHash: scan.file_hash || null,
                modality: scan.modality || null,
                region: scan.modality || scan.series_description || "Medical Scan"
            };
        });

        return NextResponse.json({ scans: formattedScans });
    } catch (error) {
        console.error("Dashboard Scans Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
