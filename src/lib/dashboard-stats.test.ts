import { describe, expect, it } from "vitest";
import { buildDashboardStats } from "@/lib/dashboard-stats";

describe("buildDashboardStats", () => {
  it("computes total scans, report counts, completed scans, and average confidence", () => {
    const now = new Date("2026-03-20T00:00:00.000Z");

    const scans = [
      { id: "1", upload_date: "2026-03-19T12:00:00.000Z", status: "Analyzed", analysis_results: { confidence_score: 95 } },
      { id: "2", upload_date: "2026-03-16T08:00:00.000Z", status: "Pending Review", analysis_results: { confidence_score: 85 } },
      { id: "3", upload_date: "2026-03-10T09:00:00.000Z", status: "Processing" },
    ];

    const stats = buildDashboardStats(scans, now);

    expect(stats[0]).toEqual({
      label: "TOTAL SCANS",
      value: 3,
      delta: "+2 this week",
      deltaType: "positive",
      icon: "scan",
    });

    expect(stats[1]).toEqual({
      label: "REPORTS SUBMITTED",
      value: 2,
      delta: "+2 this week",
      deltaType: "positive",
      icon: "report",
    });

    expect(stats[2]).toEqual({
      label: "SCANS DONE",
      value: 2,
      delta: "+2 this week",
      deltaType: "positive",
      icon: "completed",
    });

    expect(stats[3]).toEqual({
      label: "MODEL CONFIDENCE",
      value: "90.0%",
      delta: "2 analyzed",
      deltaType: "positive",
      icon: "accuracy",
    });
  });

  it("returns no-data accuracy when no confidence scores are present", () => {
    const scans = [
      { id: "1", upload_date: "2026-03-01T00:00:00.000Z", status: "Processing" },
      { id: "2", upload_date: "2026-03-01T00:00:00.000Z", status: "Analyzed", analysis_results: { confidence_score: null } },
    ];

    const stats = buildDashboardStats(scans, new Date("2026-03-20T00:00:00.000Z"));

    expect(stats[3]).toEqual({
      label: "MODEL CONFIDENCE",
      value: "N/A",
      delta: "No data",
      deltaType: "positive",
      icon: "accuracy",
    });
  });

  it("sets neutral delta when there are no recent scans", () => {
    const scans = [{ id: "1", upload_date: "2026-01-01T00:00:00.000Z", status: "Analyzed", analysis_results: { confidence_score: 99 } }];

    const stats = buildDashboardStats(scans, new Date("2026-03-20T00:00:00.000Z"));

    expect(stats[0].delta).toBe("+0 this week");
    expect(stats[0].deltaType).toBe("neutral");
  });

  it("ignores stored fallback scores when provider metadata shows MONAI was unavailable", () => {
    const scans = [{
      id: "1",
      upload_date: "2026-03-18T00:00:00.000Z",
      status: "Analyzed",
      analysis_results: {
        confidence_score: 80,
        findings: {
          providers: {
            monai: {
              confidence: null,
              analysis_mode: "unavailable",
              confidence_source: "not_available",
            },
            vision: {
              confidence: 80,
            },
          },
        },
      },
    }];

    const stats = buildDashboardStats(scans, new Date("2026-03-20T00:00:00.000Z"));

    expect(stats[3].value).toBe("N/A");
  });
});
