/**
 * /api/ai/health/route.ts
 * ──────────────────────────────────────────────────────────────────────────
 * Checks the health & availability of all AI providers:
 *   - MONAI microservice
 *   - OpenRouter (Vision LLM)
 *
 * GET /api/ai/health
 * ──────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server";

export async function GET() {
    const monaiUrl = process.env.MONAI_SERVICE_URL;
    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();

    const results: Record<string, unknown> = {};

    // ── Check MONAI service ───────────────────────────────────────────────
    if (monaiUrl) {
        try {
            const res = await fetch(`${monaiUrl}/health`, {
                signal: AbortSignal.timeout(5000),
            });
            if (res.ok) {
                const data = await res.json();
                results.monai = {
                    ...data,
                    provider_status: data.status,
                    status: "online",
                };
            } else {
                results.monai = { status: "error", httpStatus: res.status };
            }
        } catch (err) {
            results.monai = {
                status: "offline",
                reason: err instanceof Error ? err.message : String(err),
            };
        }
    } else {
        results.monai = { status: "not_configured", reason: "MONAI_SERVICE_URL not set" };
    }

    // ── Check OpenRouter (Vision LLM) ─────────────────────────────────────
    results.openrouter = openRouterKey
        ? { status: "configured", model: "meta-llama/llama-3.2-11b-vision-instruct" }
        : { status: "not_configured", reason: "OPENROUTER_API_KEY not set" };

    const monaiOnline = (results.monai as { status?: string }).status === "online";
    const openRouterConfigured = (results.openrouter as { status?: string }).status === "configured";
    const allHealthy = Object.values(results).every(
        (v) => (v as { status: string }).status === "online" || (v as { status: string }).status === "configured"
    );

    return NextResponse.json(
        {
            healthy: allHealthy,
            providers: results,
            capabilities: {
                "Image segmentation (CT/MRI/DICOM/NIfTI)": monaiOnline,
                "Scan description / radiology text (2D images)": openRouterConfigured,
                "Textual symptom queries": false, // Not yet integrated – would need a separate LLM
            },
        },
        { status: allHealthy ? 200 : 207 }
    );
}
