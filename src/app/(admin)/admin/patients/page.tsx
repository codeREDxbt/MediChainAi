"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Mock patient data
const mockPatients = [
  { id: "P001", name: "Dr. Silva", email: "dr.silva@hospital.com", scans: 24, lastActive: "2h ago", status: "active" },
  { id: "P002", name: "Dr. Martinez", email: "martinez@clinic.org", scans: 18, lastActive: "1d ago", status: "active" },
  { id: "P003", name: "Dr. Johnson", email: "johnson@med.edu", scans: 42, lastActive: "3h ago", status: "active" },
  { id: "P004", name: "Dr. Williams", email: "williams@hospital.com", scans: 8, lastActive: "5d ago", status: "inactive" },
  { id: "P005", name: "Dr. Brown", email: "brown@clinic.org", scans: 31, lastActive: "12h ago", status: "active" },
  { id: "P006", name: "Dr. Davis", email: "davis@med.edu", scans: 15, lastActive: "2d ago", status: "active" },
];

export default function AdminPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPatients = mockPatients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Patient Records</h1>
          <p className="text-muted-foreground">Manage and view patient data</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            Export Data
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search patients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patients Table */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">ID</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Name</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Email</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Scans</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Last Active</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono text-sm text-muted-foreground">{patient.id}</td>
                    <td className="p-4 font-medium text-foreground">{patient.name}</td>
                    <td className="p-4 text-muted-foreground">{patient.email}</td>
                    <td className="p-4 text-foreground">{patient.scans}</td>
                    <td className="p-4 text-muted-foreground">{patient.lastActive}</td>
                    <td className="p-4">
                      <Badge variant={patient.status === "active" ? "success" : "secondary"}>
                        {patient.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-border">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">{patient.email}</p>
                  </div>
                  <Badge variant={patient.status === "active" ? "success" : "secondary"}>
                    {patient.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{patient.scans} scans</span>
                  <span className="text-muted-foreground">{patient.lastActive}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Reports
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredPatients.length} of {mockPatients.length} patients
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
