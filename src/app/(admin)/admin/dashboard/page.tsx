import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  FileStack, 
  Activity, 
  TrendingUp, 
  Cpu,
  Shield,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// Mock admin analytics data
const adminStats = [
  { label: "Total Patients", value: "2,847", change: "+12%", positive: true, icon: Users },
  { label: "Scans Processed", value: "12,453", change: "+8%", positive: true, icon: FileStack },
  { label: "Model Accuracy", value: "97.2%", change: "+0.5%", positive: true, icon: Activity },
  { label: "Active Sessions", value: "156", change: "-3%", positive: false, icon: Clock },
];

const recentActivity = [
  { id: 1, action: "New patient registered", user: "Dr. Martinez", time: "2m ago" },
  { id: 2, action: "Scan batch processed", user: "System", time: "5m ago" },
  { id: 3, action: "Model weights updated", user: "FL Node #42", time: "12m ago" },
  { id: 4, action: "Report generated", user: "Admin", time: "1h ago" },
];

const systemHealth = [
  { name: "API Gateway", status: "operational", uptime: 99.9 },
  { name: "ML Pipeline", status: "operational", uptime: 99.7 },
  { name: "Database", status: "operational", uptime: 99.99 },
  { name: "IPFS Node", status: "degraded", uptime: 97.2 },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and analytics</p>
        </div>
        <Badge variant="success" className="hidden lg:flex">
          All Systems Operational
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {adminStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    stat.positive ? "text-accent" : "text-destructive"
                  }`}>
                    {stat.positive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground lg:text-3xl">{stat.value}</p>
                <p className="text-xs text-muted-foreground uppercase mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemHealth.map((service) => (
              <div key={service.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      service.status === "operational" ? "bg-accent" : "bg-amber-500"
                    }`} />
                    <span className="font-medium text-foreground">{service.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{service.uptime}% uptime</span>
                </div>
                <Progress value={service.uptime} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Federated Learning Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Federated Learning Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <p className="text-3xl font-bold text-foreground">42</p>
              <p className="text-xs text-muted-foreground uppercase">Active Nodes</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <p className="text-3xl font-bold text-foreground">120</p>
              <p className="text-xs text-muted-foreground uppercase">Global Round</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <p className="text-3xl font-bold text-foreground">97.2%</p>
              <p className="text-xs text-muted-foreground uppercase">Avg Accuracy</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-xl">
              <p className="text-3xl font-bold text-foreground">1.2TB</p>
              <p className="text-xs text-muted-foreground uppercase">Data Processed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
