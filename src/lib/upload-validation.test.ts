import { describe, expect, it } from "vitest";

import { formatUploadValidationIssues, getOptionalUploadField, getRequiredUploadField } from "./upload-validation";

describe("upload validation helpers", () => {
  it("normalizes missing and blank form values", () => {
    expect(getOptionalUploadField(null)).toBeUndefined();
    expect(getOptionalUploadField("   ")).toBeUndefined();
    expect(getOptionalUploadField("  CT  ")).toBe("CT");
  });

  it("uses a fallback for required fields", () => {
    expect(getRequiredUploadField(null, "scan.dcm")).toBe("scan.dcm");
    expect(getRequiredUploadField("  original.dcm  ", "scan.dcm")).toBe("original.dcm");
  });

  it("formats validation issues as readable text", () => {
    expect(
      formatUploadValidationIssues([
        { message: "Expected string, received null", path: ["patientName"] },
        { message: "Invalid datetime", path: ["studyDate"] },
      ]),
    ).toBe("patientName: Expected string, received null, studyDate: Invalid datetime");
  });
});