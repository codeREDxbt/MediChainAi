import { describe, expect, it } from "vitest";
import { buildDashboardStats } from "@/lib/dashboard-stats";

describe("buildDashboardStats", () => {
  it("computes total scans, recent scans, and average accuracy", () => {
    const now = new Date("2026-03-20T00:00:00.000Z");

    const scans = [
      { id: "1", upload_date: "2026-03-19T12:00:00.000Z" },
      { id: "2", upload_date: "2026-03-16T08:00:00.000Z" },
      { id: "3", upload_date: "2026-03-10T09:00:00.000Z" },
    ];

    const analyses = [
      { analysis_results: [{ confidence_score: 95 }] },
      { analysis_results: { confidence_score: 85 } },
      { analysis_results: { confidence_score: null } },
    ];

    const stats = buildDashboardStats(scans, analyses, now);

    expect(stats[0]).toEqual({
      label: "LOCAL SCANS",
      value: 3,
      delta: "+2 this week",
      deltaType: "positive",
      icon: "scan",
    });

    expect(stats[1]).toEqual({
      label: "ACCURACY",
      value: "90.0%",
      delta: "~",
      deltaType: "positive",
      icon: "accuracy",
    });
  });

  it("returns no-data accuracy when no confidence scores are present", () => {
    const scans = [{ id: "1", upload_date: "2026-03-01T00:00:00.000Z" }];
    const analyses = [
      { analysis_results: null },
      { analysis_results: { confidence_score: undefined } },
      { analysis_results: [{ confidence_score: null }] },
    ];

    const stats = buildDashboardStats(scans, analyses, new Date("2026-03-20T00:00:00.000Z"));

    expect(stats[1]).toEqual({
      label: "ACCURACY",
      value: "N/A",
      delta: "No data",
      deltaType: "positive",
      icon: "accuracy",
    });
  });

  it("sets neutral delta when there are no recent scans", () => {
    const scans = [{ id: "1", upload_date: "2026-01-01T00:00:00.000Z" }];
    const analyses = [{ analysis_results: { confidence_score: 99 } }];

    const stats = buildDashboardStats(scans, analyses, new Date("2026-03-20T00:00:00.000Z"));

    expect(stats[0].delta).toBe("+0 this week");
    expect(stats[0].deltaType).toBe("neutral");
  });
});
