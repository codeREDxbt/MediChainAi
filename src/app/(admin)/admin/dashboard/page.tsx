"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileStack, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Filter,
  ChevronDown,
  FileText,
  Calendar,
  MoreHorizontal
} from "lucide-react";

// KPI Data
const kpiCards = [
  { 
    label: "Total Scans", 
    value: "12,453", 
    change: "+847 this month", 
    icon: FileStack,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-500/10"
  },
  { 
    label: "AI Accuracy", 
    value: "97.2%", 
    change: "+0.5% from last week", 
    icon: Activity,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10"
  },
  { 
    label: "Efficiency Gain", 
    value: "42%", 
    change: "vs. manual review", 
    icon: TrendingUp,
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-500/10"
  },
  { 
    label: "Active Alerts", 
    value: "7", 
    change: "3 high priority", 
    icon: AlertTriangle,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-500/10"
  },
];

// Monthly trends data for bar chart
const monthlyTrends = [
  { month: "Jan", ct: 420, mri: 310, xray: 580, ultrasound: 190 },
  { month: "Feb", ct: 380, mri: 290, xray: 620, ultrasound: 210 },
  { month: "Mar", ct: 510, mri: 340, xray: 490, ultrasound: 230 },
  { month: "Apr", ct: 470, mri: 380, xray: 550, ultrasound: 250 },
  { month: "May", ct: 540, mri: 410, xray: 610, ultrasound: 280 },
  { month: "Jun", ct: 620, mri: 450, xray: 680, ultrasound: 320 },
];

// Disease categories for donut chart
const diseaseCategories = [
  { name: "Pulmonary", percentage: 32, color: "bg-blue-500" },
  { name: "Cardiac", percentage: 24, color: "bg-rose-500" },
  { name: "Neurological", percentage: 18, color: "bg-violet-500" },
  { name: "Musculoskeletal", percentage: 14, color: "bg-emerald-500" },
  { name: "Oncology", percentage: 8, color: "bg-amber-500" },
  { name: "Other", percentage: 4, color: "bg-slate-400" },
];

// Generated reports
const generatedReports = [
  { id: "RPT-2026-001", name: "Monthly Diagnostic Summary", type: "Analytics", date: "Jan 25, 2026", status: "Ready", size: "2.4 MB" },
  { id: "RPT-2026-002", name: "AI Performance Metrics Q4", type: "Performance", date: "Jan 24, 2026", status: "Ready", size: "1.8 MB" },
  { id: "RPT-2026-003", name: "Patient Demographics Report", type: "Demographics", date: "Jan 23, 2026", status: "Ready", size: "3.2 MB" },
  { id: "RPT-2026-004", name: "Federated Learning Status", type: "Technical", date: "Jan 22, 2026", status: "Processing", size: "—" },
  { id: "RPT-2026-005", name: "Weekly Scan Volume Analysis", type: "Analytics", date: "Jan 20, 2026", status: "Ready", size: "1.1 MB" },
];

const reportTypes = ["All Types", "Analytics", "Performance", "Demographics", "Technical"];

export default function AdminDashboardPage() {
  const [selectedReportType, setSelectedReportType] = useState("All Types");
  const maxValue = Math.max(...monthlyTrends.flatMap(m => [m.ct, m.mri, m.xray, m.ultrasound]));

  const filteredReports = selectedReportType === "All Types" 
    ? generatedReports 
    : generatedReports.filter(r => r.type === selectedReportType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Admin Dashboard</h1>
          <p className="text-muted-foreground">System analytics and reporting overview</p>
        </div>
        <Badge variant="success" className="hidden lg:flex gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          All Systems Operational
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${kpi.color.split(' ')[1]}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                  <p className={`text-xs mt-2 ${kpi.color.split(' ')[1]}`}>{kpi.change}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bar Chart - Monthly Diagnostic Trends */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Monthly Diagnostic Trends
              </span>
              <Button variant="ghost" size="sm" className="text-xs">
                <Calendar className="w-4 h-4 mr-1" />
                Last 6 Months
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>CT</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span>MRI</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>X-Ray</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-violet-500" />
                <span>Ultrasound</span>
              </div>
            </div>
            
            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-2 h-48">
              {monthlyTrends.map((month) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-0.5 h-40">
                    <div 
                      className="w-2 lg:w-3 bg-blue-500 rounded-t transition-all duration-300"
                      style={{ height: `${(month.ct / maxValue) * 100}%` }}
                    />
                    <div 
                      className="w-2 lg:w-3 bg-emerald-500 rounded-t transition-all duration-300"
                      style={{ height: `${(month.mri / maxValue) * 100}%` }}
                    />
                    <div 
                      className="w-2 lg:w-3 bg-amber-500 rounded-t transition-all duration-300"
                      style={{ height: `${(month.xray / maxValue) * 100}%` }}
                    />
                    <div 
                      className="w-2 lg:w-3 bg-violet-500 rounded-t transition-all duration-300"
                      style={{ height: `${(month.ultrasound / maxValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{month.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Donut Chart - Disease Categories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Disease Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Donut Chart */}
            <div className="relative w-40 h-40 mx-auto mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {diseaseCategories.reduce((acc, category, index) => {
                  const offset = acc.offset;
                  const dashArray = `${category.percentage} ${100 - category.percentage}`;
                  const colors = ["#3b82f6", "#f43f5e", "#8b5cf6", "#10b981", "#f59e0b", "#94a3b8"];
                  
                  acc.elements.push(
                    <circle
                      key={category.name}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={colors[index]}
                      strokeWidth="12"
                      strokeDasharray={dashArray}
                      strokeDashoffset={-offset}
                      className="transition-all duration-500"
                    />
                  );
                  acc.offset += category.percentage;
                  return acc;
                }, { elements: [] as JSX.Element[], offset: 0 }).elements}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">100%</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-2">
              {diseaseCategories.map((category) => (
                <div key={category.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${category.color}`} />
                    <span>{category.name}</span>
                  </div>
                  <span className="font-medium">{category.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Generated Reports
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="appearance-none bg-muted/50 border border-border rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {reportTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Report ID</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Size</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-mono text-muted-foreground">{report.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">{report.name}</span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <Badge variant="outline">{report.type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell">{report.date}</td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={report.status === "Ready" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {report.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground hidden md:table-cell">{report.size}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {report.status === "Ready" && (
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
