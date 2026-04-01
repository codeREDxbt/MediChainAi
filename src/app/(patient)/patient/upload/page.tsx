"use client";

import { useState, useRef } from "react";
import { TopBar } from "@/components/top-bar";
import { TransferStatusCard } from "@/components/transfer-status-card";
import { Shield, Upload, HardDrive, Cpu, Globe, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { mockTransferStatus } from "@/lib/mock";
import { useRouter } from "next/navigation";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const uploadLoadingStates = [
  { text: "Preparing secure transfer..." },
  { text: "Encrypting medical data with AES-256..." },
  { text: "Generating content hash..." },
  { text: "Uploading to cloud storage..." },
  { text: "Anchoring hash to blockchain..." },
  { text: "Verifying on-chain integrity..." },
  { text: "Transfer complete ✓" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function PatientUploadPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [patientName, setPatientName] = useState<string>("");
  const [modality, setModality] = useState<string>("Unknown");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const modalities = ["Unknown", "MRI", "CT", "X-Ray", "Ultrasound", "PET", "DICOM"];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setCurrentStep(1);
    }
  };

  const initiateUpload = async () => {
    if (!file) {
      alert("Please upload a DICOM/NIfTI or image file first");
      return;
    }

    try {
      setIsUploading(true);
      setCurrentStep(2);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("originalName", file.name);
      formData.append("modality", modality);
      if (patientName) {
        formData.append("patientName", patientName);
      }

      const response = await fetch('/api/scans/upload', {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      setCurrentStep(3);

      setTimeout(() => {
        setIsUploading(false);
        router.push("/patient/my-scans");
      }, 2500);

    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      alert("Upload Failed: " + err.message);
      setCurrentStep(1);
    }
  };

  const steps = [
    { icon: HardDrive, label: "Local", complete: currentStep > 0 },
    { icon: Cpu, label: "Encrypt", complete: currentStep > 1 },
    { icon: Globe, label: "IPFS", complete: currentStep > 2 },
  ];

  return (
    <div className="min-h-screen bg-[#050506] font-sans text-[#EDEDEF] selection:bg-[#5E6AD2]/30">
      <MultiStepLoader
        loadingStates={uploadLoadingStates}
        loading={isUploading}
        duration={1800}
        loop={false}
      />

      <div className="lg:hidden">
        <TopBar
          title="Secure Upload"
          showBack
          showLogo={false}
          rightContent={
            <div className="flex items-center gap-1">
              <Lock className="w-4 h-4 text-[#5E6AD2]" />
              <div className="w-2 h-2 rounded-full bg-[#5E6AD2]" />
            </div>
          }
        />
      </div>

      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto px-4 py-8 lg:py-12 space-y-8"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-[#EDEDEF] tracking-tight mb-1">Secure Upload</h1>
          <p className="text-sm text-[#8A8F98]">
            Encrypt and anchor imaging data to the federated MediChain network.
          </p>
        </motion.div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <motion.div variants={itemVariants}>
            <div className="relative bg-[#12121a] border border-white/[0.1] rounded-2xl p-6">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.dcm,.nii"
                onChange={handleFileSelect}
              />
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center min-h-[220px] cursor-pointer transition-all group",
                  file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/[0.1] hover:border-[#5E6AD2]/50 hover:bg-[#5E6AD2]/5'
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
                    file ? 'bg-emerald-500/20' : 'bg-[#5E6AD2]/20'
                  )}>
                    {file ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <Upload className="w-8 h-8 text-[#5E6AD2]" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-[#EDEDEF] mb-1">
                    {file ? file.name : "Upload DICOM/NIfTI"}
                  </h3>
                  <p className="text-sm text-[#8A8F98] text-center">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Tap to browse or drag files here"}
                  </p>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <span className="text-xs text-[#8A8F98] font-mono bg-[#050506] px-3 py-1 rounded-lg border border-white/[0.06]">
                  MAX BATCH: 500MB
                </span>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6 mt-6 lg:mt-0">
            {file && (
              <motion.div variants={itemVariants}>
                <div className="bg-[#12121a] border border-white/[0.1] rounded-2xl p-5 space-y-4">
                  <h3 className="text-base font-semibold text-[#EDEDEF]">Scan Details</h3>

                  <div>
                    <label className="text-xs text-[#8A8F98] mb-2 block">Modality</label>
                    <div className="flex flex-wrap gap-2">
                      {modalities.map((mod) => (
                        <button
                          key={mod}
                          onClick={() => setModality(mod)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            modality === mod
                              ? "bg-[#5E6AD2] text-white"
                              : "bg-[#050506] text-[#8A8F98] border border-white/[0.1] hover:text-[#EDEDEF]"
                          )}
                        >
                          {mod}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#8A8F98] mb-2 block">Patient Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="Enter patient name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-[#050506] border border-white/[0.1] rounded-lg py-2 px-3 text-sm text-[#EDEDEF] placeholder:text-[#8A8F98] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2]"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <div className="bg-[#12121a] border border-white/[0.1] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === index;
                    const isComplete = step.complete;

                    return (
                      <div key={step.label} className="flex items-center">
                        <div className="flex flex-col items-center gap-2">
                          <motion.div
                            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                              isComplete ? "bg-[#5E6AD2] text-white" : "",
                              isActive ? "bg-[#5E6AD2] text-white ring-4 ring-[#5E6AD2]/20" : "",
                              !isComplete && !isActive ? "bg-[#050506] text-[#8A8F98]" : ""
                            )}
                          >
                            {isComplete ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </motion.div>
                          <span className={cn(
                            "text-[10px] font-medium uppercase",
                            isActive ? "text-[#5E6AD2]" : isComplete ? "text-emerald-400" : "text-[#8A8F98]"
                          )}>
                            {step.label}
                          </span>
                        </div>

                        {index < steps.length - 1 && (
                          <div className="flex-1 mx-3 h-0.5 min-w-[20px]">
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: currentStep > index ? 1 : 0 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full origin-left",
                                currentStep > index ? "bg-[#5E6AD2]" : "bg-white/[0.06]"
                              )}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <TransferStatusCard status={mockTransferStatus} />
            </motion.div>

            <motion.div variants={itemVariants}>
              <button
                onClick={initiateUpload}
                disabled={!file || isUploading}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#5E6AD2] text-white font-medium hover:bg-[#6872D9] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Transferring securely...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Initiate Secure Transfer
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
