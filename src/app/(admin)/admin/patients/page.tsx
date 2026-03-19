"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  FileText,
  Download,
  Mail,
  Trash2,
  Calendar,
  Activity,
  User,
} from "lucide-react";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Mock patient data with enhanced fields
const mockPatients = [
  {
    id: "P001",
    name: "Dr. Sarah Silva",
    avatar: "SS",
    image: "https://images.unsplash.com/photo-1594824416965-9ab57a791a8e?q=80&w=200&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1594824416965-9ab57a791a8e?q=80&w=200&auto=format&fit=crop",
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
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop",
    lastScan: "CT Abdomen",
    lastScanDate: "Jan 19, 2026",
    risk: "high",
    lastActivity: "12 hours ago",
    totalScans: 31
  },
];

const featuredPatients = mockPatients.slice(0, 4).map((p, i) => ({
  id: i + 1,
  name: p.name,
  designation: `${p.risk.toUpperCase()} RISK • ${p.lastScan}`,
  image: p.image || ""
}));

const scanTypes = ["All Scans", "CT", "MRI", "X-Ray", "Ultrasound"];
const riskLevels = ["All Risk Levels", "High", "Medium", "Low"];

const riskConfig = {
  high: {
    label: "High Risk",
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500/20"
  },
  medium: {
    label: "Medium Risk",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20"
  },
  low: {
    label: "Low Risk",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20"
  },
};

export default function AdminPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScanType, setSelectedScanType] = useState("All Scans");
  const [selectedRisk, setSelectedRisk] = useState("All Risk Levels");

  const filteredPatients = mockPatients.filter((patient) => {
    const matchesSearch =
      (patient.name && patient.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (patient.id && patient.id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesScanType =
      selectedScanType === "All Scans" ||
      (patient.lastScan && patient.lastScan.toLowerCase().includes(selectedScanType.toLowerCase()));

    const matchesRisk =
      selectedRisk === "All Risk Levels" ||
      patient.risk === selectedRisk.toLowerCase();

    return matchesSearch && matchesScanType && matchesRisk;
  });

  return (
    <div className="space-y-10 py-8 px-4 md:px-8 max-w-7xl mx-auto pb-24 text-slate-200">
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Patient Records</h1>
          <p className="text-slate-400">Manage patient data, scan history, and node validation records.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-row items-center border border-white/10 p-2 rounded-2xl bg-black/20">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-4 ml-2">Recently Active</span>
            <div className="flex flex-row items-center justify-center -ml-2">
              <AnimatedTooltip items={featuredPatients} />
            </div>
          </div>
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Data</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-6 relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search patients by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
          />
        </div>

        {/* Scan Type Filter */}
        <div className="md:col-span-3 relative group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
          <select
            value={selectedScanType}
            onChange={(e) => setSelectedScanType(e.target.value)}
            className="w-full appearance-none bg-slate-900 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white shadow-inner cursor-pointer"
          >
            {scanTypes.map((type) => (
              <option key={type} value={type} className="bg-slate-900">{type}</option>
            ))}
          </select>
        </div>

        {/* Risk Filter */}
        <div className="md:col-span-3 relative group">
          <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="w-full appearance-none bg-slate-900 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-white shadow-inner cursor-pointer"
          >
            {riskLevels.map((level) => (
              <option key={level} value={level} className="bg-slate-900">{level}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm font-medium text-slate-500 mt-2">
        Showing <span className="text-emerald-400">{filteredPatients.length}</span> of {mockPatients.length} patients
      </div>

      {/* Modern Card Table */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        <div className="overflow-x-auto relative z-10 w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-slate-900/50 text-xs uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4 font-semibold">Patient</th>
                <th className="px-6 py-4 font-semibold hidden md:table-cell">Last Scan</th>
                <th className="px-6 py-4 font-semibold">Risk Level</th>
                <th className="px-6 py-4 font-semibold hidden lg:table-cell">Last Activity</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredPatients.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={5} className="py-20 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <User className="w-10 h-10 opacity-20" />
                        <p className="text-lg">No patients found</p>
                        <p className="text-sm text-slate-600">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  filteredPatients.map((patient, index) => {
                    const risk = riskConfig[patient.risk as keyof typeof riskConfig];
                    return (
                      <motion.tr
                        key={patient.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            {patient.image ? (
                              <Image src={patient.image} alt={patient.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300 border border-white/10 shadow-sm">
                                {patient.avatar}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{patient.name}</p>
                              <p className="text-xs text-slate-500">{patient.id} • {patient.totalScans} total scans</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 hidden md:table-cell">
                          <div>
                            <p className="font-medium text-slate-300">{patient.lastScan}</p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {patient.lastScanDate}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={cn("px-3 py-1 rounded-full text-xs font-bold tracking-wide border", risk.bg, risk.text, risk.border)}>
                            {risk.label}
                          </span>
                        </td>
                        <td className="px-6 py-5 hidden lg:table-cell text-sm text-slate-400 font-medium">
                          {patient.lastActivity}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors" title="View Scans">
                              <FileText className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-500 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
