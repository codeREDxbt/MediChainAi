"use client";

import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { TransferStatusCard } from "@/components/transfer-status-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Upload, HardDrive, Cpu, Globe, Lock, CheckCircle2 } from "lucide-react";
import { mockTransferStatus } from "@/lib/mock";

export default function PatientUploadPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: HardDrive, label: "Local", complete: currentStep > 0 },
    { icon: Cpu, label: "Encrypt", complete: currentStep > 1 },
    { icon: Globe, label: "IPFS", complete: currentStep > 2 },
  ];

  return (
    <div className="flex flex-col min-h-screen">
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

      <main className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-foreground mb-2">Secure Upload</h1>
          <p className="text-muted-foreground">
            Encrypt and anchor CT imaging data to the federated MediChain network.
          </p>
        </div>

        {/* Mobile Description */}
        <p className="text-sm text-muted-foreground text-center lg:hidden">
          Encrypt and anchor CT imaging data to the federated MediChain network.
        </p>

        {/* Upload Area */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Large Dashed Dropzone Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="border-2 border-dashed border-border rounded-3xl p-10 flex flex-col items-center justify-center min-h-[220px] lg:min-h-[300px] hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Upload DICOM/NIfTI
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Tap to browse or drag files here
                </p>
              </div>

              {/* Max Batch Badge */}
              <div className="flex justify-center mt-5">
                <Badge variant="secondary" className="font-mono text-xs px-4 py-1.5">
                  MAX BATCH: 500MB
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Right Column on Desktop */}
          <div className="space-y-6 mt-6 lg:mt-0">
            {/* 3-Step Indicator */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === index;
                    const isComplete = step.complete;

                    return (
                      <div key={step.label} className="flex items-center">
                        <div className="flex flex-col items-center gap-2">
                          <div
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
                          </div>
                          <span
                            className={`text-xs font-medium uppercase ${
                              isActive ? "text-primary" : isComplete ? "text-accent" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>

                        {index < steps.length - 1 && (
                          <div className="flex-1 mx-3 h-0.5 min-w-[40px]">
                            <div
                              className={`h-full rounded-full transition-all ${
                                currentStep > index ? "bg-accent" : "bg-border"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Transfer Status Card */}
            <TransferStatusCard status={mockTransferStatus} />

            {/* Desktop CTA */}
            <div className="hidden lg:block">
              <Button className="w-full h-14 text-base rounded-2xl shadow-lg" size="lg">
                <Shield className="w-5 h-5 mr-2" />
                Initiate Secure Transfer
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border max-w-md mx-auto safe-bottom">
        <Button className="w-full h-14 text-base rounded-2xl shadow-lg" size="lg">
          <Shield className="w-5 h-5 mr-2" />
          Initiate Secure Transfer
        </Button>
      </div>
    </div>
  );
}
