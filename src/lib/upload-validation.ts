type UploadValidationIssue = {
  message: string;
  path?: Array<string | number>;
};

const normalizeFormValue = (value: FormDataEntryValue | null): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

export const getOptionalUploadField = (value: FormDataEntryValue | null): string | undefined =>
  normalizeFormValue(value);

export const getRequiredUploadField = (
  value: FormDataEntryValue | null,
  fallback: string,
): string => normalizeFormValue(value) ?? fallback;

export const formatUploadValidationIssues = (issues: UploadValidationIssue[]): string => {
  if (issues.length === 0) {
    return "Invalid input data";
  }

  return issues
    .map((issue) => {
      const prefix = issue.path && issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${prefix}${issue.message}`;
    })
    .join(", ");
};
