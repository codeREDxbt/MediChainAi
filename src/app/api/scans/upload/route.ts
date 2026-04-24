import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { getJwtSecret } from "@/lib/jwt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import crypto from "crypto";
import dicomParser from "dicom-parser";
import { PNG } from "pngjs";
import { resolveDemoUserId } from "@/lib/demo-auth";
import { isRequestTimeoutError, withRequestTimeout } from "@/lib/request-timeout";
import { scanUploadSchema } from "@/lib/validation";
import {
    formatUploadValidationIssues,
    getOptionalUploadField,
    getRequiredUploadField,
} from "@/lib/upload-validation";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp"]);
const ALLOWED_UPLOAD_EXTENSIONS = new Set(["dcm", "nii", "nii.gz", ...IMAGE_EXTENSIONS]);
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const UPLOAD_SERVICE_TIMEOUT_MS = Number(process.env.UPLOAD_SERVICE_TIMEOUT_MS || 15000);

const getFileExtension = (fileName: string): string => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.nii.gz')) return 'nii.gz';
    return lowerName.split('.').pop()?.toLowerCase() || 'bin';
};

const inferModalityFromFile = (fileName: string): string => {
    const lowerName = fileName.toLowerCase();
    const ext = getFileExtension(fileName);

    if (lowerName.includes("xray") || lowerName.includes("x-ray") || lowerName.includes("cxr")) return "X-Ray";
    if (lowerName.includes("mri") || lowerName.includes("_mr") || lowerName.includes("-mr")) return "MRI";
    if (lowerName.includes("pet")) return "PET";
    if (lowerName.includes("mammo")) return "Mammography";
    if (lowerName.includes("ultra")) return "Ultrasound";
    if (ext === "nii" || ext === "nii.gz") return "MRI";
    if (ext === "dcm") return "CT";
    if (IMAGE_EXTENSIONS.has(ext)) return "CT";
    return "Unknown";
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
        const bytesNeeded = bitsAllocated > 8 ? pixelCount * 2 : pixelCount;
        if (offset < 0 || offset + bytesNeeded > buffer.byteLength) {
            console.warn("Pixel data extends beyond buffer bounds");
            return null;
        }

        const pixelSlice = buffer.slice(offset, offset + bytesNeeded);

        let pixels: Int16Array | Uint8Array | Uint16Array;

        if (bitsAllocated > 8) {
            pixels = pixelRepresentation === 1
                ? new Int16Array(pixelSlice.buffer, pixelSlice.byteOffset, pixelCount)
                : new Uint16Array(pixelSlice.buffer, pixelSlice.byteOffset, pixelCount);
        } else {
            pixels = new Uint8Array(pixelSlice.buffer, pixelSlice.byteOffset, pixelCount);
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

const normalizeModality = (value?: string | null, fileName?: string | null): string | null => {
    const normalized = (value || "").trim().toUpperCase();
    const inferred = inferModalityFromFile(fileName || "");

    if (!normalized || normalized === "UNKNOWN" || normalized === "DICOM") {
        return inferred;
    }

    if (normalized === "X-RAY" || normalized === "X RAY") {
        return "X-Ray";
    }

    if (normalized === "ULTRASOUND") return "Ultrasound";
    if (normalized === "MAMMOGRAPHY") return "Mammography";
    if (normalized === "XRAY") return "X-Ray";
    if (normalized === "CT" || normalized === "MRI" || normalized === "PET") {
        return normalized;
    }

    return inferred;
};

const toLegacyDatabaseModality = (value?: string | null): string | null => {
    switch (value) {
        case "X-Ray":
            return "XRAY";
        default:
            return value ?? null;
    }
};

const isModalityConstraintError = (message?: string | null) =>
    typeof message === "string" && /scans_modality_check|modality/i.test(message);

const isLocalSupabase = (): boolean => /localhost|127\.0\.0\.1/i.test(SUPABASE_URL);

const toUploadServiceError = (message: string) => {
    const offlineHint = isLocalSupabase()
        ? "Local Supabase storage appears offline. Start Docker Desktop and ensure the Supabase containers are running."
        : "Storage backend is currently unavailable.";

    return NextResponse.json({
        error: "Storage service unavailable",
        details: `${offlineHint} ${message}`.trim()
    }, { status: 503 });
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
        const userId = await resolveDemoUserId({
            userId: payload.sub as string,
            walletAddress: payload.walletAddress,
            role: payload.role,
            supabase: supabaseServer,
        });

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const modalityInput = getOptionalUploadField(formData.get("modality")) ?? "Unknown";
        const originalName = getRequiredUploadField(formData.get("originalName"), file?.name || "Unknown").slice(0, 255);
        const patientName = getOptionalUploadField(formData.get("patientName"))?.slice(0, 255) ?? null;
        const studyDateStr = getOptionalUploadField(formData.get("studyDate")) ?? null;
        const modality = normalizeModality(modalityInput, originalName || file?.name);

        // Validate inputs
        const validationResult = scanUploadSchema.safeParse({
            modality: getOptionalUploadField(formData.get("modality")),
            originalName,
            patientName: getOptionalUploadField(formData.get("patientName")),
            studyDate: getOptionalUploadField(formData.get("studyDate")),
        });

        if (!validationResult.success) {
            return NextResponse.json({ error: "Invalid input data", details: formatUploadValidationIssues(validationResult.error.issues) }, { status: 400 });
        }

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Log initial file size
        console.log(`[UPLOAD] File received: ${originalName} | Size: ${file.size} bytes (${(file.size / 1024).toFixed(2)} KB) | Type: ${file.type}`);

        if (file.size > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                { error: `File too large. Max allowed size is ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.` },
                { status: 413 }
            );
        }

        const studyDate = studyDateStr ? (() => {
            const d = new Date(studyDateStr);
            return Number.isNaN(d.getTime()) ? null : d;
        })() : null;

        // Convert file to buffer and generate hash
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // CRITICAL: Verify buffer size matches file size - detect truncation early
        if (buffer.byteLength !== file.size) {
            console.error(`[UPLOAD TRUNCATION] ${originalName} | Expected: ${file.size} bytes, Got: ${buffer.byteLength} bytes | Loss: ${file.size - buffer.byteLength} bytes | Percentage lost: ${((file.size - buffer.byteLength) / file.size * 100).toFixed(1)}%`);
            return NextResponse.json(
                {
                    error: "File upload failed: Data loss detected during transfer",
                    details: `Upload incomplete: expected ${(file.size / 1024).toFixed(2)} KB, received ${(buffer.byteLength / 1024).toFixed(2)} KB. Possible causes: slow network, timeout, or server issue. Try again or check your internet connection.`
                },
                { status: 400 }
            );
        }
        
        console.log(`[UPLOAD] Buffer created successfully | File: ${originalName} | Size: ${buffer.byteLength} bytes`);
        
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
        const { error: storageError } = await withRequestTimeout(
            supabaseServer.storage
                .from("scans")
                .upload(fileName, buffer, {
                    contentType: contentType,
                    upsert: true
                }),
            { label: "Primary scan upload", timeoutMs: UPLOAD_SERVICE_TIMEOUT_MS }
        );

        if (storageError) {
            console.error("Storage Error:", storageError.message);
            if (/fetch failed|connection|network|ECONNREFUSED|unreachable/i.test(storageError.message)) {
                return toUploadServiceError(storageError.message);
            }
            return NextResponse.json({
                error: "Failed to upload file to storage",
                details: storageError.message
            }, { status: 500 });
        }

        console.log(`[UPLOAD SUCCESS] File stored in Supabase | Path: ${fileName} | Size: ${buffer.byteLength} bytes | Hash: ${hash.slice(0, 16)}`);

        if (isDirectImage) {
            convertedImagePath = fileName;
        } else if (isDicom) {
            const previewBuffer = toPngPreviewFromDicom(buffer);
            if (previewBuffer) {
                const previewFileName = `${userId}/${hash.slice(0, 16)}-preview.png`;
                const { error: previewUploadError } = await withRequestTimeout(
                    supabaseServer.storage
                        .from("scans")
                        .upload(previewFileName, previewBuffer, {
                            contentType: 'image/png',
                            upsert: true
                        }),
                    { label: "Preview image upload", timeoutMs: UPLOAD_SERVICE_TIMEOUT_MS }
                );

                if (!previewUploadError) {
                    convertedImagePath = previewFileName;
                } else {
                    console.error("Preview upload error:", previewUploadError.message);
                }
            }
        }

        const insertScanRecord = (modalityValue: string | null) =>
            withRequestTimeout(
                supabaseServer
                    .from('scans')
                    .insert({
                        user_id: userId,
                        file_hash: fileName,
                        original_name: originalName,
                        modality: modalityValue,
                        patient_name: patientName,
                        study_date: studyDate?.toISOString() || null,
                        converted_image: convertedImagePath,
                        status: "Pending Review"
                    })
                    .select()
                    .single(),
                { label: "Scan record insert", timeoutMs: UPLOAD_SERVICE_TIMEOUT_MS }
            );

        // Save metadata to Supabase database, retrying with legacy modality codes if needed.
        let { data: scan, error: scanError } = await insertScanRecord(modality);

        if (scanError && isModalityConstraintError(scanError.message)) {
            const legacyModality = toLegacyDatabaseModality(modality);
            if (legacyModality && legacyModality !== modality) {
                console.warn(`Retrying scan insert with legacy modality '${legacyModality}' after constraint error.`);
                const retryResult = await insertScanRecord(legacyModality);
                scan = retryResult.data;
                scanError = retryResult.error;
            }
        }

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
            imageUrl: urlData.publicUrl,
            ...(convertedImagePath ? {} : { warning: "Preview generation failed. File stored but no preview available." })
        });

    } catch (error) {
        console.error("Upload Error:", error instanceof Error ? error.message : String(error));
        if (isRequestTimeoutError(error)) {
            return toUploadServiceError(error.message);
        }
        const message = error instanceof Error ? error.message : String(error);
        if (/fetch failed|connection|network|ECONNREFUSED|unreachable/i.test(message)) {
            return toUploadServiceError(message);
        }
        return NextResponse.json({
            error: "Internal Server Error",
            details: message
        }, { status: 500 });
    }
}
