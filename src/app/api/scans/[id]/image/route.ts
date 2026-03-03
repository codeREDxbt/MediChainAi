import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const url = new URL(request.url);
        const wantConverted = url.searchParams.get('converted') === 'true';
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

        const { data: scan, error: scanError } = await supabaseServer
            .from('scans')
            .select('file_hash, user_id, converted_image')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (scanError || !scan) {
            return NextResponse.json({ error: "Scan not found" }, { status: 404 });
        }

        const filePath = (wantConverted && scan.converted_image) ? scan.converted_image : scan.file_hash;

        const { data: fileData, error: fileError } = await supabaseServer.storage
            .from("scans")
            .download(filePath);

        if (fileError || !fileData) {
            console.error("File download error:", fileError);
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const isNiiGz = filePath.toLowerCase().endsWith('.nii.gz');
        const fileExt = isNiiGz ? 'nii.gz' : (filePath.split('.').pop()?.toLowerCase() || 'bin');
        const mimeTypes: Record<string, string> = {
            'dcm': 'application/dicom',
            'nii': 'application/nifti',
            'nii.gz': 'application/nifti',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
        };

        const contentType = mimeTypes[fileExt] || 'application/octet-stream';

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Cache-Control', 'public, max-age=3600');

        return new NextResponse(fileData, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error("Image fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
