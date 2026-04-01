"use client";

import { TopBar } from "@/components/top-bar";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Moon, Sun, Bell, Shield, Wallet, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.23, 1, 0.32, 1] as any
    }
  }
};

export default function PatientSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const { success } = useToast();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);

  const settingsGroups = [
    {
      title: "Appearance",
      items: [
        {
          icon: theme === "dark" ? Moon : Sun,
          label: "Dark Mode",
          description: "Toggle dark/light theme",
          action: (
            <CustomSwitch
              isSelected={theme === "dark"}
              onValueChange={(isSelected) => setTheme(isSelected ? "dark" : "light")}
            />
          )
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "Push Notifications",
          description: "Receive scan & reward alerts",
          action: (
            <CustomSwitch 
              isSelected={pushNotifications} 
              onValueChange={(isSelected) => {
                setPushNotifications(isSelected);
                success(isSelected ? "Notifications enabled" : "Notifications disabled");
              }} 
            />
          )
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          icon: Shield,
          label: "Biometric Lock",
          description: "Require authentication",
          action: (
            <CustomSwitch 
              isSelected={biometricLock} 
              onValueChange={(isSelected) => {
                setBiometricLock(isSelected);
                success(isSelected ? "Biometric lock enabled" : "Biometric lock disabled");
              }} 
            />
          )
        },
        {
          icon: Wallet,
          label: "Wallet Settings",
          description: "Manage connected wallet",
          action: <ChevronRight className="w-5 h-5 text-[#8A8F98]" />
        },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", description: "FAQs and documentation", action: <ChevronRight className="w-5 h-5 text-[#8A8F98]" /> },
      ],
    },
  ];

  const renderGroups = (groups: typeof settingsGroups) =>
    groups.map((group) => (
      <motion.div key={group.title} variants={itemVariants}>
        <div className="bg-[#12121a] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <h3 className="text-[10px] font-bold text-[#8A8F98] uppercase tracking-[0.2em]">{group.title}</h3>
          </div>
          <div className="p-0">
            {group.items.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
                className={`flex items-center justify-between p-5 ${index !== group.items.length - 1 ? "border-b border-white/[0.04]" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center border border-white/[0.06]">
                    <item.icon className="w-5 h-5 text-[#8A8F98]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#EDEDEF] text-sm">{item.label}</p>
                    <p className="text-xs text-[#8A8F98]">{item.description}</p>
                  </div>
                </div>
                {item.action}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    ));

  return (
    <div className="min-h-screen bg-[#050506] font-sans text-[#EDEDEF] selection:bg-[#5E6AD2]/30">
      <div className="lg:hidden">
        <TopBar title="Settings" showLogo={false} showNotifications={false} showAvatar={false} />
      </div>

      <motion.main variants={containerVariants} initial="hidden" animate="visible" className="max-w-5xl mx-auto px-4 py-8 lg:py-12 space-y-6">
        <motion.div variants={itemVariants} className="hidden lg:block">
          <h1 className="text-2xl font-bold text-[#EDEDEF] tracking-tight">Settings</h1>
          <p className="text-sm text-[#8A8F98]">Manage your preferences and security settings</p>
        </motion.div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="space-y-6">{renderGroups(settingsGroups.slice(0, 2))}</div>
          <div className="space-y-6 mt-6 lg:mt-0">
            {renderGroups(settingsGroups.slice(2))}
            <motion.div variants={itemVariants}>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </motion.div>
            <motion.p variants={itemVariants} className="text-center text-xs text-[#8A8F98]">
              MediChainAI v1.0.2 (Beta)
            </motion.p>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
