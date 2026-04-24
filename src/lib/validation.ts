import { z } from "zod";

export const loginSchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
  publicKey: z.string().min(1),
});

export const demoLoginSchema = z.object({
  role: z.enum(["patient", "admin"]),
});

export const scanUploadSchema = z.object({
  modality: z.string().max(100).optional(),
  originalName: z.string().max(255).optional(),
  patientName: z.string().max(255).optional(),
  studyDate: z.string().datetime().optional(),
});

export const scanAnalyzeSchema = z.object({
  scanId: z.string().uuid(),
});

export const updateUserSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(["patient", "admin"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type DemoLoginInput = z.infer<typeof demoLoginSchema>;
export type ScanUploadInput = z.infer<typeof scanUploadSchema>;
export type ScanAnalyzeInput = z.infer<typeof scanAnalyzeSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
