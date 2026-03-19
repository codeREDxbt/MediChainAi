import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";
import dicomParser from "dicom-parser";
import { PNG } from "pngjs";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp"]);
const ALLOWED_UPLOAD_EXTENSIONS = new Set(["dcm", "nii", "nii.gz", ...IMAGE_EXTENSIONS]);
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024);

const getFileExtension = (fileName: string): string => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.nii.gz')) return 'nii.gz';
    return lowerName.split('.').pop()?.toLowerCase() || 'bin';
};

const parseFirstNumber = (value?: string | null): number | null => {
    if (!value) return null;
    const first = value.split("\\")[0]?.trim();
    if (!first) return null;
    const parsed = Number(first);
    return Number.isFinite(parsed) ? parsed : null;
};

const toPngPreviewFromDicom = (buffer: Buffer): Buffer | null => {
    try {
        const byteArray = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const dataSet = dicomParser.parseDicom(byteArray);

        const rows = dataSet.uint16('x00280010') ?? dataSet.intString('x00280010');
        const cols = dataSet.uint16('x00280011') ?? dataSet.intString('x00280011');
        const bitsAllocated = dataSet.uint16('x00280100') ?? 16;
        const pixelRepresentation = dataSet.uint16('x00280103') ?? dataSet.intString('x00280103') ?? 0;

        if (!rows || !cols) return null;

        const pixelDataElement = dataSet.elements['x7fe00010'];
        if (!pixelDataElement) return null;

        const pixelCount = rows * cols;
        if (!Number.isFinite(pixelCount) || pixelCount <= 0 || pixelCount > 4096 * 4096) {
            return null;
        }

        const offset = pixelDataElement.dataOffset;
        let pixels: Int16Array | Uint8Array | Uint16Array;

        if (bitsAllocated > 8) {
            pixels = pixelRepresentation === 1
                ? new Int16Array(buffer.buffer, buffer.byteOffset + offset, pixelCount)
                : new Uint16Array(buffer.buffer, buffer.byteOffset + offset, pixelCount);
        } else {
            pixels = new Uint8Array(buffer.buffer, buffer.byteOffset + offset, pixelCount);
        }

        const rescaleIntercept = parseFirstNumber(dataSet.string('x00281052')) ?? 0;
        const rescaleSlope = parseFirstNumber(dataSet.string('x00281053')) ?? 1;
        const wcTag = parseFirstNumber(dataSet.string('x00281050'));
        const wwTag = parseFirstNumber(dataSet.string('x00281051'));

        let minVal = Infinity;
        let maxVal = -Infinity;
        const transformed = new Float32Array(pixelCount);

        for (let i = 0; i < pixelCount; i++) {
            const value = pixels[i] * rescaleSlope + rescaleIntercept;
            transformed[i] = value;
            if (value < minVal) minVal = value;
            if (value > maxVal) maxVal = value;
        }

        const windowCenter = wcTag ?? (minVal + maxVal) / 2;
        const inferredWidth = maxVal - minVal;
        const defaultWidth = Number.isFinite(inferredWidth) && inferredWidth > 0 ? inferredWidth : 1;
        const windowWidth = Math.max(1, wwTag ?? defaultWidth);
        const lower = windowCenter - windowWidth / 2;
        const upper = windowCenter + windowWidth / 2;

        const png = new PNG({ width: cols, height: rows });
        for (let i = 0; i < pixelCount; i++) {
            let mapped = transformed[i];
            if (mapped <= lower) mapped = 0;
            else if (mapped >= upper) mapped = 255;
            else mapped = ((mapped - lower) / (upper - lower)) * 255;

            const gray = Math.max(0, Math.min(255, Math.round(mapped)));
            const idx = i * 4;
            png.data[idx] = gray;
            png.data[idx + 1] = gray;
            png.data[idx + 2] = gray;
            png.data[idx + 3] = 255;
        }

        return PNG.sync.write(png);
    } catch (error) {
        console.error("DICOM preview conversion failed:", error);
        return null;
    }
};

const getContentType = (fileName: string, fallback: string): string => {
    const ext = getFileExtension(fileName);
    const mimeTypes: Record<string, string> = {
        'dcm': 'application/dicom',
        'nii': 'application/nifti',
        'nii.gz': 'application/nifti',
    };
    return mimeTypes[ext || ''] || fallback;
};

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        const rateLimitResult = checkRateLimit(`upload:${ip}`, {
            windowMs: 60 * 60 * 1000,
            maxRequests: 30,
        });

        if (!rateLimitResult.success) {
            return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
        }

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

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const modality = formData.get("modality") as string || "Unknown";
        const originalName = formData.get("originalName") as string || file?.name || "Unknown";
        const patientName = formData.get("patientName") as string || null;
        const studyDateStr = formData.get("studyDate") as string || null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                { error: `File too large. Max allowed size is ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.` },
                { status: 413 }
            );
        }

        const studyDate = studyDateStr ? new Date(studyDateStr) : null;

        // Convert file to buffer and generate hash
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const hash = crypto.createHash("sha256").update(buffer).digest("hex");
        const fileExt = getFileExtension(file.name);

        if (!ALLOWED_UPLOAD_EXTENSIONS.has(fileExt)) {
            return NextResponse.json(
                { error: `Unsupported file type '.${fileExt}'.` },
                { status: 415 }
            );
        }

        // Use a simple, deterministic filename
        const fileName = `${userId}/${hash.slice(0, 16)}.${fileExt}`;
        const contentType = getContentType(file.name, file.type || 'application/octet-stream');
        const isDicom = fileExt === 'dcm';
        const isDirectImage = IMAGE_EXTENSIONS.has(fileExt);
        let convertedImagePath: string | null = null;

        // Upload to Supabase Storage
        const { error: storageError } = await supabaseServer.storage
            .from("scans")
            .upload(fileName, buffer, {
                contentType: contentType,
                upsert: true
            });

        if (storageError) {
            console.error("Storage Error:", storageError.message);
            return NextResponse.json({
                error: "Failed to upload file to storage",
                details: storageError.message
            }, { status: 500 });
        }

        if (isDirectImage) {
            convertedImagePath = fileName;
        } else if (isDicom) {
            const previewBuffer = toPngPreviewFromDicom(buffer);
            if (previewBuffer) {
                const previewFileName = `${userId}/${hash.slice(0, 16)}-preview.png`;
                const { error: previewUploadError } = await supabaseServer.storage
                    .from("scans")
                    .upload(previewFileName, previewBuffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (!previewUploadError) {
                    convertedImagePath = previewFileName;
                } else {
                    console.error("Preview upload error:", previewUploadError.message);
                }
            }
        }

        // Save metadata to Supabase database
        const { data: scan, error: scanError } = await supabaseServer
            .from('scans')
            .insert({
                user_id: userId,
                file_hash: fileName,
                original_name: originalName,
                modality: modality,
                patient_name: patientName,
                study_date: studyDate?.toISOString() || null,
                converted_image: convertedImagePath,
                status: "Pending Review"
            })
            .select()
            .single();

        if (scanError) {
            console.error("Scan insert error:", scanError.message);
            return NextResponse.json({
                error: "Failed to create scan record",
                details: scanError.message
            }, { status: 500 });
        }

        // Get public URL for response
        const { data: urlData } = supabaseServer.storage
            .from("scans")
            .getPublicUrl(fileName);

        return NextResponse.json({
            success: true,
            scan,
            imageUrl: urlData.publicUrl
        });

    } catch (error) {
        console.error("Upload Error:", error instanceof Error ? error.message : String(error));
        return NextResponse.json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
