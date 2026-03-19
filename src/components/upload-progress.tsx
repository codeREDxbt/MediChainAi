"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@heroui/react";
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: UploadStatus;
  error?: string;
  onCancel?: () => void;
}

export function UploadProgress({
  fileName,
  progress,
  status,
  error,
  onCancel,
}: UploadProgressProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "relative overflow-hidden rounded-xl border p-4",
          status === "error" && "border-red-500/50 bg-red-500/5",
          status === "success" && "border-green-500/50 bg-green-500/5",
          status === "uploading" && "border-border bg-card"
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              status === "uploading" && "bg-primary/10",
              status === "success" && "bg-green-500/10",
              status === "error" && "bg-red-500/10"
            )}
          >
            {status === "uploading" && (
              <Upload className="h-5 w-5 text-primary animate-pulse" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {status === "error" && (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium truncate text-foreground">
                {fileName}
              </p>
              <span className="text-xs text-muted-foreground">
                {status === "uploading" && `${Math.round(progress)}%`}
                {status === "success" && "Complete"}
                {status === "error" && "Failed"}
              </span>
            </div>

            {status === "uploading" && (
              <Progress
                value={progress}
                className="h-1.5"
                color="primary"
                aria-label="Upload progress"
              />
            )}

            {status === "error" && error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>

          {status === "uploading" && onCancel && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-muted rounded-lg transition-colors"
              aria-label="Cancel upload"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {status === "uploading" && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

import { useState, useRef } from "react";

export function FileUploader({
  onUpload,
  accept = "image/*,.dcm",
  maxSize = 10 * 1024 * 1024,
  multiple = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };

  const handleUpload = async (file: File) => {
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
      setStatus("error");
      return;
    }

    setUploadFile(file);
    setStatus("uploading");
    setError("");
    setProgress(0);

    const interval = simulateProgress();

    try {
      await onUpload(file);
      setStatus("success");
      setProgress(100);
      clearInterval(interval);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
      clearInterval(interval);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const reset = () => {
    setUploadFile(null);
    setStatus("idle");
    setProgress(0);
    setError("");
  };

  return (
    <div className="space-y-4">
      {status === "idle" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max file size: {maxSize / 1024 / 1024}MB
          </p>
        </div>
      )}

      {uploadFile && status !== "idle" && (
        <UploadProgress
          fileName={uploadFile.name}
          progress={progress}
          status={status}
          error={error}
          onCancel={reset}
        />
      )}
    </div>
  );
}
