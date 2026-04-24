import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { withRequestTimeout } from "@/lib/request-timeout";

export const dynamic = 'force-dynamic';

function isDemoWalletAddress(value: unknown): value is string {
    return typeof value === "string" && value.startsWith("Demo");
}

function resolveDisplayModality(filePath: string, storedModality?: string | null) {
    const ext = filePath.toLowerCase().endsWith(".nii.gz")
        ? "nii.gz"
        : filePath.split(".").pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
    const normalized = (storedModality || "").trim().toLowerCase();

    if (normalized === "xray" || normalized === "x-ray") return "X-Ray";
    if (normalized === "ct") return "CT";
    if (isImage && !normalized) return "X-Ray";
    return storedModality && storedModality !== "Unknown" ? storedModality : "Medical Scan";
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

        // Fetch user's scans from Supabase
        let scans = null;
        let scansError = null;

        try {
            const result = await withRequestTimeout(
                supabaseServer
                    .from('scans')
                    .select('*, analysis_results(*)')
                    .eq('user_id', userId)
                    .order('upload_date', { ascending: false }),
                { label: "User scans lookup" }
            );

            scans = result.data;
            scansError = result.error;
        } catch (error) {
            scansError = error;
        }

        if (scansError) {
            console.error("Supabase scans error:", scansError);
            if (isDemoWalletAddress(walletAddress)) {
                return NextResponse.json({ scans: [] });
            }
            return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 });
        }

        const formattedScans = scans.map((scan) => {
            const analysis = Array.isArray(scan.analysis_results)
                ? scan.analysis_results[0]
                : scan.analysis_results;
            const hasAnalysis = !!analysis;
            const confidenceScore = hasAnalysis && typeof analysis.confidence_score === "number"
                ? Math.round(analysis.confidence_score * 10) / 10
                : 0;

            const isImage = (() => {
                const ext = scan.file_hash?.split('.').pop()?.toLowerCase();
                return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
            })();
            const displayModality = resolveDisplayModality(scan.file_hash, scan.modality);
            return {
                id: scan.id,
                scanType: displayModality,
                type: displayModality,
                originalName: scan.original_name || null,
                patientName: scan.patient_name || null,
                riskScore: confidenceScore,
                aiScore: confidenceScore,
                confidence: confidenceScore,
                findings: hasAnalysis ? JSON.stringify(analysis.findings) : "Pending Analysis",
                timestamp: scan.upload_date,
                date: scan.upload_date,
                imageUrl: isImage ? `/api/scans/${scan.id}/image` : `/api/scans/${scan.id}/image`,
                convertedImageUrl: scan.converted_image ? `/api/scans/${scan.id}/image?converted=true` : null,
                status: hasAnalysis ? "Analyzed" : (scan.status === "Analyzed" ? "Pending Review" : (scan.status || "Pending Review")),
                blockchain: "pending",
                size: "N/A",
                txHash: scan.file_hash || null,
                modality: displayModality || null,
                region: displayModality || scan.series_description || "Medical Scan"
            };
        });

        return NextResponse.json({ scans: formattedScans });
    } catch (error) {
        console.error("Dashboard Scans Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
