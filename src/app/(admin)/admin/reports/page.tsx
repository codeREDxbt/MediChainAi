import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp
} from "lucide-react";

// Mock reports data
const reports = [
  { 
    id: 1, 
    name: "Monthly Analytics Report", 
    type: "Analytics", 
    date: "Jan 2026", 
    status: "ready",
    size: "2.4 MB"
  },
  { 
    id: 2, 
    name: "Patient Activity Summary", 
    type: "Activity", 
    date: "Jan 2026", 
    status: "ready",
    size: "1.2 MB"
  },
  { 
    id: 3, 
    name: "Federated Learning Metrics", 
    type: "ML", 
    date: "Jan 2026", 
    status: "generating",
    size: "-"
  },
  { 
    id: 4, 
    name: "Security Audit Report", 
    type: "Security", 
    date: "Dec 2025", 
    status: "ready",
    size: "856 KB"
  },
  { 
    id: 5, 
    name: "Compliance Report", 
    type: "Compliance", 
    date: "Dec 2025", 
    status: "ready",
    size: "1.8 MB"
  },
];

const quickStats = [
  { label: "Reports Generated", value: "156", icon: FileText },
  { label: "This Month", value: "12", icon: Calendar },
  { label: "Avg Processing", value: "2.3s", icon: TrendingUp },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Reports</h1>
          <p className="text-muted-foreground">Generate and download system reports</p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Generate New Report
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Types */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Analytics</h3>
            <p className="text-sm text-muted-foreground">Usage and performance metrics</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <PieChart className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">ML Insights</h3>
            <p className="text-sm text-muted-foreground">Model performance reports</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Compliance</h3>
            <p className="text-sm text-muted-foreground">Regulatory compliance docs</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {reports.map((report) => (
              <div key={report.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{report.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{report.type}</span>
                      <span>•</span>
                      <span>{report.date}</span>
                      <span>•</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={report.status === "ready" ? "success" : "secondary"}>
                    {report.status}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    disabled={report.status !== "ready"}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
