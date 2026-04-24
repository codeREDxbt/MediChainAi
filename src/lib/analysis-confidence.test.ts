import { describe, expect, it } from "vitest";

import { getActualModelConfidence } from "./analysis-confidence";

describe("getActualModelConfidence", () => {
  it("returns the real MONAI probability when a trained bundle succeeded", () => {
    expect(getActualModelConfidence({
      findings: {
        providers: {
          monai: {
            confidence: 91.27,
            analysis_mode: "bundle",
            confidence_source: "model_probability",
          },
        },
      },
      fallbackConfidence: 80,
    })).toBe(91.3);
  });

  it("hides stored fallback confidence when providers show MONAI was unavailable", () => {
    expect(getActualModelConfidence({
      findings: {
        providers: {
          monai: {
            confidence: null,
            analysis_mode: "unavailable",
            confidence_source: "not_available",
          },
        },
      },
      fallbackConfidence: 80,
    })).toBeNull();
  });

  it("keeps legacy confidence when no provider metadata exists", () => {
    expect(getActualModelConfidence({
      findings: {
        summary: "Legacy analysis result.",
      },
      fallbackConfidence: 76.04,
    })).toBe(76);
  });
});
