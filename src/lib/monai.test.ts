import { describe, expect, it } from "vitest";

import { combineProviderConfidence, mergeAnalysisFindings, type MonaiResponse } from "./monai";

describe("combineProviderConfidence", () => {
  it("returns null when no real provider confidence exists", () => {
    expect(combineProviderConfidence({ monai: null, vision: null, fallback: null })).toBeNull();
  });

  it("keeps the real MONAI probability when available", () => {
    expect(combineProviderConfidence({ monai: 87.4, vision: null, fallback: null })).toBe(87.4);
  });

  it("does not promote Vision estimates into stored confidence", () => {
    expect(combineProviderConfidence({ monai: null, vision: 80, fallback: null })).toBeNull();
  });
});

describe("mergeAnalysisFindings", () => {
  it("preserves an honest unavailable summary without inventing a confidence score", () => {
    const monai: MonaiResponse = {
      label: "No compatible MONAI result",
      confidence: null,
      analysis_mode: "unavailable",
      confidence_source: "not_available",
      findings: {
        summary: "CT scan (Image) review did not produce a trained MONAI result.",
        details: [
          "No real MONAI confidence is available because the trained bundle did not run on this upload.",
        ],
        urgent: false,
      },
      segmentation_overlay_base64: null,
      model_used: "spleen_ct_segmentation",
      model_description: "Spleen CT segmentation using a SegResNet model",
      scope_note: "This CT bundle is trained for spleen segmentation.",
      inference_seconds: 0.03,
      modality: "CT",
      filename: "image.png",
    };

    const merged = mergeAnalysisFindings({ monai });

    expect(merged.summary).toContain("did not produce a trained MONAI result");
    expect(merged.details).toContain("MONAI did not return a real model probability for this upload.");
    expect(merged.details).not.toContain("MONAI fallback estimate:");
  });

  it("keeps Vision report text without surfacing a fake confidence score when MONAI is unavailable", () => {
    const monai: MonaiResponse = {
      label: "No compatible MONAI result",
      confidence: null,
      analysis_mode: "unavailable",
      confidence_source: "not_available",
      findings: {
        summary: "MRI scan review did not produce a trained MONAI result.",
        details: [
          "No real MONAI confidence is available because the trained bundle did not run on this upload.",
        ],
        urgent: false,
      },
      segmentation_overlay_base64: null,
      model_used: "brain_mri_segmentation",
      model_description: "Brain MRI segmentation",
      scope_note: "This MRI bundle needs a compatible multi-channel volume.",
      inference_seconds: 0.05,
      modality: "MRI",
      filename: "scan.png",
    };

    const merged = mergeAnalysisFindings({
      monai,
      vision: {
        confidence: 78.2,
        model: "meta-llama/llama-3.2-11b-vision-instruct",
        findings: {
          summary: "Vision AI report summary.",
          details: ["Visible structures look consistent with a brain scan preview."],
          urgent: false,
        },
      },
    });

    expect(merged.confidence_note).toContain("No actual MONAI probability is available");
    expect(merged.details).toContain("Vision AI generated descriptive report text only; its estimate is not used as an actual model probability.");
    expect(merged.details.some((detail) => detail.includes("78.2%"))).toBe(false);
  });
});
