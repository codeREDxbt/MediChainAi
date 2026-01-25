"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Trash2,
  User,
  Calendar,
  Activity
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock patient data with enhanced fields
const mockPatients = [
  { 
    id: "P001", 
    name: "Dr. Sarah Silva", 
    avatar: "SS",
    lastScan: "CT Chest", 
    lastScanDate: "Jan 24, 2026", 
    risk: "high",
    lastActivity: "2 hours ago", 
    totalScans: 24
  },
  { 
    id: "P002", 
    name: "Dr. Maria Martinez", 
    avatar: "MM",
    lastScan: "MRI Brain", 
    lastScanDate: "Jan 23, 2026", 
    risk: "low",
    lastActivity: "1 day ago", 
    totalScans: 18
  },
  { 
    id: "P003", 
    name: "Dr. James Johnson", 
    avatar: "JJ",
    lastScan: "X-Ray Lung", 
    lastScanDate: "Jan 22, 2026", 
    risk: "medium",
    lastActivity: "3 hours ago", 
    totalScans: 42
  },
  { 
    id: "P004", 
    name: "Dr. Emily Williams", 
    avatar: "EW",
    lastScan: "Ultrasound Liver", 
    lastScanDate: "Jan 20, 2026", 
    risk: "low",
    lastActivity: "5 days ago", 
    totalScans: 8
  },
  { 
    id: "P005", 
    name: "Dr. Michael Brown", 
    avatar: "MB",
    lastScan: "CT Abdomen", 
    lastScanDate: "Jan 19, 2026", 
    risk: "high",
    lastActivity: "12 hours ago", 
    totalScans: 31
  },
  { 
    id: "P006", 
    name: "Dr. Lisa Davis", 
    avatar: "LD",
    lastScan: "MRI Spine", 
    lastScanDate: "Jan 18, 2026", 
    risk: "medium",
    lastActivity: "2 days ago", 
    totalScans: 15
  },
  { 
    id: "P007", 
    name: "Dr. Robert Chen", 
    avatar: "RC",
    lastScan: "X-Ray Chest", 
    lastScanDate: "Jan 17, 2026", 
    risk: "low",
    lastActivity: "6 hours ago", 
    totalScans: 27
  },
  { 
    id: "P008", 
    name: "Dr. Anna Wilson", 
    avatar: "AW",
    lastScan: "CT Brain", 
    lastScanDate: "Jan 16, 2026", 
    risk: "high",
    lastActivity: "1 hour ago", 
    totalScans: 33
  },
];

const scanTypes = ["All Scans", "CT", "MRI", "X-Ray", "Ultrasound"];
const riskLevels = ["All Risk Levels", "High", "Medium", "Low"];

const riskConfig = {
  high: {
    label: "High Risk",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  medium: {
    label: "Medium Risk",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  low: {
    label: "Low Risk",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
};

export default function AdminPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScanType, setSelectedScanType] = useState("All Scans");
  const [selectedRisk, setSelectedRisk] = useState("All Risk Levels");

  const filteredPatients = mockPatients.filter((patient) => {
    const matchesSearch = 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesScanType = 
      selectedScanType === "All Scans" || 
      patient.lastScan.toLowerCase().includes(selectedScanType.toLowerCase());
    
    const matchesRisk = 
      selectedRisk === "All Risk Levels" || 
      patient.risk === selectedRisk.toLowerCase();

    return matchesSearch && matchesScanType && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Patient Records</h1>
          <p className="text-muted-foreground">Manage patient data and scan history</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search patients by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Scan Type Filter */}
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={selectedScanType}
              onChange={(e) => setSelectedScanType(e.target.value)}
              className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[140px]"
            >
              {scanTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Risk Filter */}
          <div className="relative">
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[160px]"
            >
              {riskLevels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
            <Activity className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredPatients.length} of {mockPatients.length} patients
      </p>

      {/* Patients Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground uppercase">Patient</th>
                  <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">Last Scan</th>
                  <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground uppercase">Risk</th>
                  <th className="text-left py-4 px-4 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">Last Activity</th>
                  <th className="text-right py-4 px-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPatients.map((patient) => {
                  const risk = riskConfig[patient.risk as keyof typeof riskConfig];
                  
                  return (
                    <tr key={patient.id} className="hover:bg-muted/30 transition-colors">
                      {/* Patient */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {patient.avatar}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{patient.name}</p>
                            <p className="text-xs text-muted-foreground">{patient.id} • {patient.totalScans} scans</p>
                          </div>
                        </div>
                      </td>

                      {/* Last Scan */}
                      <td className="py-4 px-4 hidden md:table-cell">
                        <div>
                          <p className="font-medium text-foreground">{patient.lastScan}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {patient.lastScanDate}
                          </p>
                        </div>
                      </td>

                      {/* Risk Chip */}
                      <td className="py-4 px-4">
                        <Badge className={`${risk.className} border font-medium`}>
                          {risk.label}
                        </Badge>
                      </td>

                      {/* Last Activity */}
                      <td className="py-4 px-4 text-sm text-muted-foreground hidden lg:table-cell">
                        {patient.lastActivity}
                      </td>

                      {/* Actions Menu */}
                      <td className="py-4 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" />
                              View Scans
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="w-4 h-4 mr-2" />
                              Export Records
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500 focus:text-red-500">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Patient
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredPatients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No patients found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page 1 of 1
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
