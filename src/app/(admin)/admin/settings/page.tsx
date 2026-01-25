"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Database,
  Server,
  Key,
  Users,
  LogOut,
  ChevronRight,
  Save
} from "lucide-react";

export default function AdminSettingsPage() {
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
          label: "System Alerts",
          description: "Critical system notifications",
          action: <Switch defaultChecked />,
        },
        {
          icon: Bell,
          label: "User Activity",
          description: "New user registrations & activity",
          action: <Switch defaultChecked />,
        },
      ],
    },
    {
      title: "Security",
      items: [
        {
          icon: Shield,
          label: "Two-Factor Auth",
          description: "Require 2FA for admin access",
          action: <Switch defaultChecked />,
        },
        {
          icon: Key,
          label: "API Keys",
          description: "Manage API access tokens",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
        {
          icon: Users,
          label: "User Roles",
          description: "Configure role permissions",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          icon: Database,
          label: "Database",
          description: "Backup and restore settings",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
        {
          icon: Server,
          label: "Server Config",
          description: "Advanced server settings",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Admin Settings</h1>
        <p className="text-muted-foreground">Manage system configuration and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
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

        {/* Right Column */}
        <div className="space-y-6">
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
                    className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors ${
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

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Export Configuration
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            MediChainAI Admin v1.0.2 (Beta)
          </p>
        </div>
      </div>
    </div>
  );
}
