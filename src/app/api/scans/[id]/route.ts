import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import {
    buildPresentationAnalysis,
    normalizeAnalysisResults,
} from "@/lib/analysis-results";

export const dynamic = 'force-dynamic';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id: scanId } = await params;

        const { data: scan, error: scanError } = await supabaseServer
            .from('scans')
            .select('*, analysis_results(*)')
            .eq('id', scanId)
            .eq('user_id', userId)
            .single();

        if (scanError || !scan) {
            return NextResponse.json({ error: "Scan not found" }, { status: 404 });
        }

        const analyses = normalizeAnalysisResults(scan.analysis_results);
        const analysis = buildPresentationAnalysis(analyses);
        const confidenceScore = analysis?.confidence_score ?? 0;
        const isImage = (() => {
            const ext = scan.file_hash?.split('.').pop()?.toLowerCase();
            return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
        })();

        const formattedScan = {
            id: scan.id,
            scanType: scan.modality && scan.modality !== "Unknown" ? scan.modality : "Medical Scan",
            type: scan.modality && scan.modality !== "Unknown" ? scan.modality : "Medical Scan",
            originalName: scan.original_name,
            patientName: scan.patient_name,
            studyDate: scan.study_date,
            seriesDesc: scan.series_description,
            riskScore: analysis ? Math.round(confidenceScore) : 0,
            riskLevel: analysis && confidenceScore > 85 ? "High" as const : "Low" as const,
            findings: analysis?.findings ? JSON.stringify(analysis.findings) : "Pending Analysis",
            confidence: analysis ? Math.round(confidenceScore) : 0,
            aiScore: analysis ? Math.round(confidenceScore) : 0,
            txHash: scan.file_hash,
            timestamp: scan.upload_date,
            date: scan.upload_date,
            imageUrl: isImage ? `/api/scans/${scan.id}/image` : `/api/scans/${scan.id}/image`,
            convertedImageUrl: scan.converted_image ? `/api/scans/${scan.id}/image?converted=true` : null,
            status: analysis ? "Analyzed" : (scan.status === "Analyzed" ? "Pending Review" : (scan.status || "Pending Review")),
            analysisSource: analysis?.model_source || null,
            analysisSources: analyses.map((item) => item.model_source || "openrouter"),
            modality: scan.modality,
            region: scan.modality || scan.series_description || "Medical Scan",
            blockchain: "pending",
            size: "N/A",
        };

        return NextResponse.json({ scan: formattedScan });
    } catch (error) {
        console.error("Get Scan Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id: scanId } = await params;

        // 1. Fetch scan to ensure it exists, belongs to the user, and get the file path
        const { data: scan, error: fetchError } = await supabaseServer
            .from('scans')
            .select('file_hash')
            .eq('id', scanId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !scan) {
            return NextResponse.json({ error: "Scan not found or unauthorized" }, { status: 404 });
        }

        // 2. Delete the actual file from Supabase Storage
        if (scan.file_hash) {
            const { error: storageError } = await supabaseServer.storage
                .from('scans')
                .remove([scan.file_hash]);

            if (storageError) {
                console.error("Failed to delete file from storage:", storageError);
                // We'll proceed with DB deletion even if storage deletion fails (e.g., file already gone)
            }
        }

        // 3. Explicitly delete from analysis_results to prevent foreign key constraint violations
        await supabaseServer
            .from('analysis_results')
            .delete()
            .eq('scan_id', scanId);

        // 4. Delete the parent scan record
        const { error: deleteError } = await supabaseServer
            .from('scans')
            .delete()
            .eq('id', scanId)
            .eq('user_id', userId);

        if (deleteError) {
            console.error("Failed to delete scan record:", deleteError);
            return NextResponse.json({ error: "Failed to delete scan" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "Scan deleted successfully" });
    } catch (error) {
        console.error("Delete Scan Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
