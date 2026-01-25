"use client";

import { TopBar } from "@/components/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Wallet, 
  HelpCircle, 
  LogOut,
  ChevronRight
} from "lucide-react";

export default function PatientSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  const settingsGroups = [
    {
      title: "Appearance",
      items: [
        {
          icon: theme === "dark" ? Moon : Sun,
          label: "Dark Mode",
          description: "Toggle dark/light theme",
          action: (
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          ),
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
          action: <Switch defaultChecked />,
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
          action: <Switch defaultChecked />,
        },
        {
          icon: Wallet,
          label: "Wallet Settings",
          description: "Manage connected wallet",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center",
          description: "FAQs and documentation",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile TopBar */}
      <div className="lg:hidden">
        <TopBar title="Settings" showLogo={false} showNotifications={false} showAvatar={false} />
      </div>

      <main className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0">
        {/* Desktop Header */}
        <div className="hidden lg:block lg:mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and security settings</p>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="space-y-6">
            {settingsGroups.slice(0, 2).map((group) => (
              <Card key={group.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {group.items.map((item, index) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between p-4 ${
                        index !== group.items.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      {item.action}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6 mt-6 lg:mt-0">
            {settingsGroups.slice(2).map((group) => (
              <Card key={group.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {group.items.map((item, index) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between p-4 ${
                        index !== group.items.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      {item.action}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            <Button 
              variant="outline" 
              className="w-full text-destructive hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              MediChainAI v1.0.2 (Beta)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
