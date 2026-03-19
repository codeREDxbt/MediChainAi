"use client";

import { useEffect } from "react";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MediChainAI",
  url: "https://medichainai.com",
  description: "Privacy-First Medical AI with Blockchain - Secure, federated medical imaging analysis powered by AI and blockchain technology",
  foundingDate: "2024",
  logo: "https://medichainai.com/logo.png",
  sameAs: [
    "https://twitter.com/medichainai",
    "https://github.com/medichainai",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-555-0123",
    contactType: "customer service",
    email: "support@medichainai.com",
  },
};

const medicalDeviceSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalWebApplication",
  name: "MediChainAI",
  applicationCategory: "MedicalApplication",
  operatingSystem: "Web Browser",
  description: "AI-powered medical imaging analysis platform with blockchain provenance",
  features: [
    "AI Scan Analysis with 99.2% accuracy",
    "Blockchain Provenance for medical records",
    "Federated Learning for privacy",
    "Zero-knowledge architecture",
  ],
  provider: {
    "@type": "Organization",
    name: "MediChainAI",
  },
};

export function StructuredData() {
  useEffect(() => {
    const script1 = document.createElement("script");
    script1.type = "application/ld+json";
    script1.textContent = JSON.stringify(organizationSchema);
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.type = "application/ld+json";
    script2.textContent = JSON.stringify(medicalDeviceSchema);
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  return null;
}
