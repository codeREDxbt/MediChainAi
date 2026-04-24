"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Contrast } from "lucide-react";
import dicomParser from "dicom-parser";

interface DicomViewerProps {
    url: string;
    className?: string;
}

export function DicomViewer({ url, className }: DicomViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [windowCenter, setWindowCenter] = useState(128);
    const [windowWidth, setWindowWidth] = useState(256);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const pixelDataRef = useRef<{
        pixels: Int16Array | Uint8Array | Uint16Array,
        width: number,
        height: number,
        minVal: number,
        maxVal: number,
        rescaleIntercept: number,
        rescaleSlope: number
    } | null>(null);

    // Render pixels to canvas with current window/level settings
    const renderToCanvas = () => {
        const canvas = canvasRef.current;
        const data = pixelDataRef.current;
        if (!canvas || !data) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { pixels, width, height, rescaleIntercept, rescaleSlope } = data;

        // Ensure canvas matches image dimensions
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        const imageData = ctx.createImageData(width, height);
        const lower = windowCenter - windowWidth / 2;
        const upper = windowCenter + windowWidth / 2;

        for (let i = 0; i < pixels.length; i++) {
            // Apply rescale slope/intercept to get Hounsfield Units or actual pixel values
            let val = pixels[i] * rescaleSlope + rescaleIntercept;

            // Apply window/level
            if (val <= lower) val = 0;
            else if (val >= upper) val = 255;
            else val = ((val - lower) / (upper - lower)) * 255;

            const idx = i * 4;
            imageData.data[idx] = val;     // R
            imageData.data[idx + 1] = val; // G
            imageData.data[idx + 2] = val; // B
            imageData.data[idx + 3] = 255; // A
        }

        ctx.putImageData(imageData, 0, 0);
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        const loadDicom = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch the DICOM file as ArrayBuffer
                console.log("Fetching DICOM from:", url);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch DICOM file: ${response.status} ${response.statusText}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const byteArray = new Uint8Array(arrayBuffer);

                // Parse DICOM using dicom-parser
                const dataSet = dicomParser.parseDicom(byteArray);

                // Extract essential metadata (with fallback methods for non-standard encodings)
                const rows = dataSet.uint16('x00280010') ?? dataSet.intString('x00280010');
                const cols = dataSet.uint16('x00280011') ?? dataSet.intString('x00280011');
                const bitsAllocated = dataSet.uint16('x00280100') ?? dataSet.intString('x00280100') ?? 16;
                const pixelRepresentation = dataSet.uint16('x00280103') ?? dataSet.intString('x00280103') ?? 0; // 0 = unsigned, 1 = signed
                const rescaleIntercept = dataSet.floatString('x00281052') || 0;
                const rescaleSlope = dataSet.floatString('x00281053') || 1;
                const windowCenterDefault = dataSet.floatString('x00281050') || 128;
                const windowWidthDefault = dataSet.floatString('x00281051') || 256;

                if (!rows || !cols) {
                    throw new Error("DICOM file does not include renderable pixel matrix dimensions");
                }

                // Get pixel data element
                const pixelDataElement = dataSet.elements['x7fe00010'];
                if (!pixelDataElement) {
                    throw new Error("No pixel data found in DICOM file");
                }

                // Handle pixel data
                let pixels: Int16Array | Uint8Array | Uint16Array;
                const offset = pixelDataElement.dataOffset;
                const pixelCount = rows * cols;
                const bytesPerPixel = bitsAllocated > 8 ? 2 : 1;
                const requiredBytes = pixelCount * bytesPerPixel;
                const availableBytes = arrayBuffer.byteLength - offset;

                if (!Number.isFinite(pixelCount) || pixelCount <= 0 || pixelCount > 4096 * 4096) {
                    throw new Error("This DICOM image is too large or malformed to render in-browser.");
                }

                if (offset < 0 || availableBytes < requiredBytes) {
                    throw new Error("This DICOM uses compressed or unsupported pixel data, so it cannot be decoded in-browser. Use the converted preview image if available.");
                }

                const pixelSlice = arrayBuffer.slice(offset, offset + requiredBytes);

                if (bitsAllocated > 8) {
                    if (pixelRepresentation === 1) {
                        pixels = new Int16Array(pixelSlice);
                    } else {
                        pixels = new Uint16Array(pixelSlice);
                    }
                } else {
                    pixels = new Uint8Array(pixelSlice);
                }

                // Calculate min/max for windowing if not explicitly provided
                let minVal = Infinity, maxVal = -Infinity;
                for (let i = 0; i < pixels.length; i++) {
                    const v = pixels[i] * rescaleSlope + rescaleIntercept;
                    if (v < minVal) minVal = v;
                    if (v > maxVal) maxVal = v;
                }

                pixelDataRef.current = {
                    pixels, width: cols, height: rows, minVal, maxVal,
                    rescaleIntercept, rescaleSlope
                };

                // Use DICOM defaults or calculated range
                setWindowCenter(windowCenterDefault);
                setWindowWidth(windowWidthDefault);

                setIsLoading(false);

            } catch (err: unknown) {
                console.error("DICOM Load/Parse Error:", err);
                const message = err instanceof Error ? err.message : "Failed to process DICOM file format.";
                setError(message);
                setIsLoading(false);
            }
        };

        loadDicom();
    }, [url]);

    // Re-render when window/level or zoom changes
    useEffect(() => {
        if (!isLoading && !error) {
            renderToCanvas();
        }
    }, [windowCenter, windowWidth, zoom, isLoading, error]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        // Adjust window/level based on drag
        setWindowWidth(prev => Math.max(1, prev + dx * 2));
        setWindowCenter(prev => prev - dy * 2);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleReset = () => {
        if (pixelDataRef.current) {
            const { minVal, maxVal } = pixelDataRef.current;
            setWindowCenter(Math.round((maxVal + minVal) / 2));
            setWindowWidth(Math.round(maxVal - minVal));
            setZoom(1);
        }
    };

    return (
        <div className={`relative w-full h-full flex flex-col bg-slate-950 overflow-hidden ${className || ''}`}>
            {/* Canvas Area */}
            <div
                className="relative w-full h-full flex-1 flex items-center justify-center cursor-crosshair select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    style={{
                        transform: `scale(${zoom})`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                    }}
                    className="flex items-center justify-center"
                >
                    <canvas
                        ref={canvasRef}
                        className="shadow-2xl ring-1 ring-white/10"
                        style={{
                            imageRendering: "pixelated",
                            cursor: isDragging ? 'grabbing' : 'grab'
                        }}
                    />
                </div>

                {/* Info Overlay */}
                {!isLoading && !error && (
                    <div className="absolute top-4 left-4 font-mono text-[10px] text-emerald-400/70 pointer-events-none space-y-1 bg-black/20 p-2 rounded backdrop-blur-sm">
                        <div>W: {Math.round(windowWidth)} C: {Math.round(windowCenter)}</div>
                        <div>ZOOM: {zoom.toFixed(2)}x</div>
                        <div>RES: {pixelDataRef.current?.width}x{pixelDataRef.current?.height}</div>
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-1.5 flex items-center gap-1 shadow-2xl z-20">
                <button
                    onClick={() => setZoom(z => Math.min(z + 0.5, 10))}
                    className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-white hover:bg-white/10 active:scale-95"
                    title="Zoom In"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
                    className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-white hover:bg-white/10 active:scale-95"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                    onClick={handleReset}
                    className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-white hover:bg-white/10 active:scale-95"
                    title="Reset View"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <div className="flex items-center gap-2 px-3 py-1">
                    <Contrast className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Drag to Level</span>
                </div>
            </div>

            {/* Status Overlays */}
            {isLoading && (
                <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-t-2 border-emerald-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-emerald-500/50" />
                        </div>
                    </div>
                    <p className="text-emerald-400 font-medium tracking-widest text-xs uppercase mt-6 animate-pulse">Initializing Voxel Engine</p>
                    <p className="text-slate-500 text-[10px] mt-2 font-mono uppercase">Parsing DICOM Stream...</p>
                </div>
            )}

            {error && !isLoading && (
                <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center ring-1 ring-inset ring-red-500/20">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">Voxel Reconstruction Failed</h3>
                    <p className="text-slate-400 text-xs max-w-sm font-mono leading-relaxed">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold transition-all uppercase tracking-widest"
                    >
                        Retry Load
                    </button>
                </div>
            )}
        </div>
    );
}
