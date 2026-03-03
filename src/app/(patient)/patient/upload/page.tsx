"use client";

import { useState, useRef } from "react";
import { TopBar } from "@/components/top-bar";
import { TransferStatusCard } from "@/components/transfer-status-card";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { Shield, Upload, HardDrive, Cpu, Globe, Lock, CheckCircle2 } from "lucide-react";
import { mockTransferStatus } from "@/lib/mock";
import { useRouter } from "next/navigation";
import { BackgroundLines } from "@/components/ui/background-lines";
import { SparklesCore } from "@/components/ui/sparkles";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { motion } from "motion/react";

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
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function PatientUploadPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [originalName, setOriginalName] = useState<string>("");
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
      setOriginalName(selectedFile.name);
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
      formData.append("originalName", originalName || file.name);
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

      // Let the loader finish its last state before redirecting
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
    <>
      {/* Multi-Step Loader Overlay */}
      <MultiStepLoader
        loadingStates={uploadLoadingStates}
        loading={isUploading}
        duration={1800}
        loop={false}
      />

      <BackgroundLines className="!h-auto !min-h-screen !bg-transparent" svgOptions={{ duration: 15 }}>
        <div className="flex flex-col min-h-screen relative z-10">
          {/* Mobile TopBar */}
          <div className="lg:hidden">
            <TopBar
              title="Secure Upload"
              showBack
              showLogo={false}
              rightContent={
                <div className="flex items-center gap-1">
                  <Lock className="w-4 h-4 text-accent" />
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
              }
            />
          </div>

          <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0"
          >
            {/* Desktop Header */}
            <motion.div variants={itemVariants} className="hidden lg:block">
              <h1 className="text-2xl font-bold text-foreground mb-2">Secure Upload</h1>
              <p className="text-muted-foreground">
                Encrypt and anchor CT imaging data to the federated MediChain network.
              </p>
            </motion.div>

            {/* Mobile Description */}
            <motion.p variants={itemVariants} className="text-sm text-muted-foreground text-center lg:hidden">
              Encrypt and anchor CT imaging data to the federated MediChain network.
            </motion.p>

            {/* Upload Area */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-6">
              {/* Large Dashed Dropzone Card */}
              <motion.div variants={itemVariants}>
                <Card className="overflow-hidden bg-background/50 backdrop-blur-sm border border-border/50" shadow="sm">
                  <CardBody className="p-6">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*,.dcm,.nii"
                      onChange={handleFileSelect}
                    />
                    <div
                      className={`relative border-2 border-dashed ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border'} rounded-3xl p-10 flex flex-col items-center justify-center min-h-[220px] lg:min-h-[300px] hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group overflow-hidden`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {/* Sparkles behind the dropzone */}
                      <div className="absolute inset-0 z-0">
                        <SparklesCore
                          id="uploadSparkles"
                          background="transparent"
                          minSize={0.4}
                          maxSize={1.4}
                          particleDensity={40}
                          className="w-full h-full"
                          particleColor={file ? "#22c55e" : "#3b82f6"}
                          speed={1.5}
                        />
                      </div>

                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-20 h-20 rounded-3xl ${file ? 'bg-emerald-500/20' : 'bg-primary/10'} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                          {file ? <CheckCircle2 className="w-10 h-10 text-emerald-500" /> : <Upload className="w-10 h-10 text-primary" />}
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          {file ? file.name : "Upload DICOM/NIfTI"}
                        </h3>
                        <p className="text-sm text-muted-foreground text-center">
                          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Tap to browse or drag files here"}
                        </p>
                      </div>
                    </div>

                    {/* Max Batch Badge */}
                    <div className="flex justify-center mt-5">
                      <Chip variant="faded" size="sm" className="font-mono text-xs px-2">
                        MAX BATCH: 500MB
                      </Chip>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>

              {/* Scan Details Card */}
              {file && (
                <motion.div variants={itemVariants}>
                  <Card className="overflow-hidden bg-background/50 backdrop-blur-sm border border-border/50" shadow="sm">
                    <CardBody className="p-5 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Scan Details</h3>

                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Modality</label>
                        <div className="flex flex-wrap gap-2">
                          {modalities.map((mod) => (
                            <Chip
                              key={mod}
                              variant={modality === mod ? "solid" : "flat"}
                              color={modality === mod ? "primary" : "default"}
                              className="cursor-pointer"
                              onClick={() => setModality(mod)}
                            >
                              {mod}
                            </Chip>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">Patient Name (Optional)</label>
                        <input
                          type="text"
                          placeholder="Enter patient name"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl py-2 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              )}

              {/* Right Column on Desktop */}
              <div className="space-y-6 mt-6 lg:mt-0">
                {/* 3-Step Indicator */}
                <motion.div variants={itemVariants}>
                  <Card className="bg-background/50 backdrop-blur-sm border border-border/50" shadow="sm">
                    <CardBody className="p-5">
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
                                  className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center transition-all
                                    ${isComplete ? "bg-accent text-white" : ""}
                                    ${isActive ? "bg-primary text-white ring-4 ring-primary/20" : ""}
                                    ${!isComplete && !isActive ? "bg-muted text-muted-foreground" : ""}
                                  `}
                                >
                                  {isComplete ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                  ) : (
                                    <Icon className="w-6 h-6" />
                                  )}
                                </motion.div>
                                <span
                                  className={`text-xs font-medium uppercase ${isActive ? "text-primary" : isComplete ? "text-accent" : "text-muted-foreground"
                                    }`}
                                >
                                  {step.label}
                                </span>
                              </div>

                              {index < steps.length - 1 && (
                                <div className="flex-1 mx-3 h-0.5 min-w-[40px]">
                                  <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: currentStep > index ? 1 : 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className={`h-full rounded-full origin-left ${currentStep > index ? "bg-accent" : "bg-border"
                                      }`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>

                {/* Transfer Status Card */}
                <motion.div variants={itemVariants}>
                  <TransferStatusCard status={mockTransferStatus} />
                </motion.div>

                {/* Desktop CTA */}
                <motion.div variants={itemVariants} className="hidden lg:block">
                  <Button
                    color="primary"
                    className="w-full h-14 text-base rounded-2xl shadow-lg"
                    size="lg"
                    onPress={initiateUpload}
                    isDisabled={!file || isUploading}
                    startContent={<Shield className="w-5 h-5" />}
                    isLoading={isUploading}
                  >
                    {isUploading ? "Transferring securely..." : "Initiate Secure Transfer"}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.main>

          {/* Mobile Sticky Bottom CTA */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border max-w-md mx-auto safe-bottom z-20">
            <Button
              color="primary"
              className="w-full h-14 text-base rounded-2xl shadow-lg"
              size="lg"
              onPress={initiateUpload}
              isDisabled={!file || isUploading}
              startContent={<Shield className="w-5 h-5" />}
              isLoading={isUploading}
            >
              {isUploading ? "Transferring securely..." : "Initiate Secure Transfer"}
            </Button>
          </div>
        </div>
      </BackgroundLines>
    </>
  );
}
