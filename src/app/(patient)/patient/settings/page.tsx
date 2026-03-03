"use client";

import { TopBar } from "@/components/top-bar";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Moon, Sun, Bell, Shield, Wallet, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useToast } from "@/hooks/use-toast";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
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
          action: <ChevronRight className="w-5 h-5 text-slate-500" />
        },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", description: "FAQs and documentation", action: <ChevronRight className="w-5 h-5 text-muted-foreground" /> },
      ],
    },
  ];

  const renderGroups = (groups: typeof settingsGroups) =>
    groups.map((group) => (
      <motion.div key={group.title} variants={itemVariants}>
        <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl">
          <CardHeader className="pb-2 pt-4 px-6">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{group.title}</h3>
          </CardHeader>
          <CardBody className="p-0">
            {group.items.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
                className={`flex items-center justify-between p-6 ${index !== group.items.length - 1 ? "border-b border-white/5" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                    <item.icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                </div>
                {item.action}
              </motion.div>
            ))}
          </CardBody>
        </Card>
      </motion.div>
    ));

  return (
    <div className="flex flex-col min-h-screen">
      <div className="lg:hidden">
        <TopBar title="Settings" showLogo={false} showNotifications={false} showAvatar={false} />
      </div>

      <motion.main variants={containerVariants} initial="hidden" animate="visible" className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0">
        <motion.div variants={itemVariants} className="hidden lg:block lg:mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and security settings</p>
        </motion.div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="space-y-6">{renderGroups(settingsGroups.slice(0, 2))}</div>
          <div className="space-y-6 mt-6 lg:mt-0">
            {renderGroups(settingsGroups.slice(2))}
            <motion.div variants={itemVariants}>
              <Button
                variant="flat"
                color="danger"
                className="w-full justify-start h-12 rounded-2xl bg-danger/10 hover:bg-danger/20 border border-danger/20 text-danger font-semibold mt-4"
                onPress={logout}
                startContent={<LogOut className="w-4 h-4" />}
              >
                Sign Out
              </Button>
            </motion.div>
            <motion.p variants={itemVariants} className="text-center text-xs text-muted-foreground">
              MediChainAI v1.0.2 (Beta)
            </motion.p>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
