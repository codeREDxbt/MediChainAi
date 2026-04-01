"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
import { 
  User, Wallet, Copy, Check, Camera, Mail, Phone, Calendar, AlertCircle,
  FileText, Brain, Coins, Activity, Edit2, Save, X, LogOut, Settings, HelpCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { NumberTicker } from "@/components/ui/number-ticker";
import Link from "next/link";

const containerVariants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } } 
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }
  }
};

interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  avatarUrl: string | null;
  role: string;
  walletAddress: string;
  createdAt: string;
}

interface ProfileStats {
  totalScans: number;
  analyzedScans: number;
  pendingScans: number;
}

export default function PatientProfilePage() {
  const { user, tokenBalance, logout } = useAuth();
  const { success, error: showError } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    phone: "",
    emergencyContact: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setStats(data.stats);
        setEditForm({
          username: data.user.username || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          emergencyContact: data.user.emergencyContact || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setIsEditing(false);
        success("Profile updated successfully");
      } else {
        throw new Error("Failed to update");
      }
    } catch (err) {
      showError("Failed to update profile");
    }
  };

  const copyAddress = () => {
    if (profile?.walletAddress) {
      navigator.clipboard.writeText(profile.walletAddress);
      setCopied(true);
      success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Not set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#050506]">
        <div className="lg:hidden">
          <TopBar title="Profile" showLogo={false} showNotifications={false} showAvatar={false} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#5E6AD2] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050506] font-sans text-[#EDEDEF] selection:bg-[#5E6AD2]/30">
      <div className="lg:hidden">
        <TopBar 
          title="Profile" 
          showLogo={false} 
          showNotifications={false} 
          showAvatar={false}
          rightContent={
            <button onClick={() => setIsEditing(!isEditing)} className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
              {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </button>
          }
        />
      </div>

      <motion.main 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="max-w-5xl mx-auto px-4 py-8 lg:py-12 space-y-6"
      >
        <motion.div variants={itemVariants} className="hidden lg:flex lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#EDEDEF] tracking-tight">Profile</h1>
            <p className="text-sm text-[#8A8F98]">Manage your account and view your stats</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[#EDEDEF] text-sm font-medium hover:bg-white/[0.04] transition-all"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </motion.div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants}>
              <div className="relative bg-[#12121a] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="relative h-24 bg-gradient-to-r from-[#5E6AD2]/20 via-[#5E6AD2]/10 to-emerald-500/20" />
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-[#050506] border-4 border-[#050506] flex items-center justify-center text-xl font-bold text-[#5E6AD2]">
                        {getInitials(profile?.username)}
                      </div>
                      {isEditing && (
                        <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#5E6AD2] flex items-center justify-center">
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-xl font-bold text-[#EDEDEF]">
                          {profile?.username || "Anonymous User"}
                        </h2>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${profile?.role === "admin" ? "bg-amber-500/10 text-amber-400" : "bg-[#5E6AD2]/10 text-[#5E6AD2]"}`}>
                          {profile?.role === "admin" ? "Admin" : "Patient"}
                        </span>
                      </div>
                      <p className="text-sm text-[#8A8F98]">
                        Member since {formatDate(profile?.createdAt || null)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-[#12121a] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#5E6AD2]" />
                  <h3 className="text-sm font-semibold text-[#EDEDEF]">Wallet Connection</h3>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[#050506] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-[#5E6AD2]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#8A8F98]">Solana Wallet</p>
                      <p className="font-mono text-sm text-[#EDEDEF]">
                        {profile?.walletAddress ? formatWalletAddress(profile.walletAddress) : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Devnet
                    </span>
                    <button onClick={copyAddress} className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#8A8F98]" />}
                    </button>
                  </div>
                </div>

                {tokenBalance && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Coins className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm text-[#8A8F98]">MCI Token Balance</p>
                        <p className="text-xl font-bold text-[#EDEDEF]">
                          <NumberTicker value={tokenBalance.uiAmount} /> <span className="text-sm font-normal text-[#8A8F98]">MCI</span>
                        </p>
                      </div>
                    </div>
                    <Link href="/patient/wallet" className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
                      View Wallet
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-[#12121a] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-[#5E6AD2]" />
                    <h3 className="text-sm font-semibold text-[#EDEDEF]">Personal Information</h3>
                  </div>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded-lg bg-white/[0.02] text-[#8A8F98] text-sm hover:bg-white/[0.04] transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleSaveProfile} className="px-3 py-1.5 rounded-lg bg-[#5E6AD2] text-white text-sm font-medium hover:bg-[#6872D9] transition-colors flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 rounded-lg text-[#8A8F98] text-sm hover:text-[#EDEDEF] hover:bg-white/[0.02] transition-colors flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-[#8A8F98] mb-1 block">Username</label>
                      <input
                        type="text"
                        placeholder="Enter your username"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className="w-full bg-[#050506] border border-white/[0.1] rounded-lg py-2 px-3 text-sm text-[#EDEDEF] placeholder:text-[#8A8F98] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#8A8F98] mb-1 block">Email</label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full bg-[#050506] border border-white/[0.1] rounded-lg py-2 px-3 text-sm text-[#EDEDEF] placeholder:text-[#8A8F98] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#8A8F98] mb-1 block">Phone</label>
                      <input
                        type="text"
                        placeholder="Enter your phone number"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full bg-[#050506] border border-white/[0.1] rounded-lg py-2 px-3 text-sm text-[#EDEDEF] placeholder:text-[#8A8F98] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2]"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#8A8F98] mb-1 block">Emergency Contact</label>
                      <input
                        type="text"
                        placeholder="Enter emergency contact"
                        value={editForm.emergencyContact}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                        className="w-full bg-[#050506] border border-white/[0.1] rounded-lg py-2 px-3 text-sm text-[#EDEDEF] placeholder:text-[#8A8F98] focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {[
                      { icon: User, label: "Username", value: profile?.username || "Not set" },
                      { icon: Mail, label: "Email", value: profile?.email || "Not set" },
                      { icon: Phone, label: "Phone", value: profile?.phone || "Not set" },
                      { icon: Calendar, label: "Member Since", value: formatDate(profile?.createdAt || null) },
                      { icon: AlertCircle, label: "Emergency Contact", value: profile?.emergencyContact || "Not set" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-[#8A8F98]" />
                          <span className="text-sm text-[#8A8F98]">{item.label}</span>
                        </div>
                        <span className="text-sm font-medium text-[#EDEDEF]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-6 mt-6 lg:mt-0">
            <motion.div variants={itemVariants}>
              <div className="bg-[#12121a] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#5E6AD2]" />
                  <h3 className="text-sm font-semibold text-[#EDEDEF]">Your Stats</h3>
                </div>

                {[
                  { icon: FileText, label: "Total Scans", value: stats?.totalScans || 0, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { icon: Brain, label: "Analyzed", value: stats?.analyzedScans || 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { icon: Coins, label: "MCI Earned", value: tokenBalance?.uiAmount || 0, color: "text-amber-500", bg: "bg-amber-500/10" },
                ].map((stat) => (
                  <div key={stat.label} className="relative rounded-xl bg-[#050506] p-4 border border-white/[0.06]">
                    <GlowingEffect spread={20} glow={true} className="z-0" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                          <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <span className="text-sm text-[#8A8F98]">{stat.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-[#EDEDEF]">
                        <NumberTicker value={stat.value} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-[#12121a] border border-white/[0.06] rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-semibold text-[#EDEDEF] mb-3">Quick Actions</h3>
                {[
                  { icon: Settings, label: "Settings", href: "/patient/settings" },
                  { icon: Wallet, label: "Manage Wallet", href: "/patient/wallet" },
                  { icon: HelpCircle, label: "Help Center", href: null },
                ].map((item) => (
                  item.href ? (
                    <Link key={item.label} href={item.href} className="flex items-center gap-3 w-full p-3 rounded-xl text-[#EDEDEF] text-sm hover:bg-white/[0.02] transition-colors">
                      <item.icon className="w-4 h-4 text-[#8A8F98]" />
                      {item.label}
                    </Link>
                  ) : (
                    <button key={item.label} className="flex items-center gap-3 w-full p-3 rounded-xl text-[#EDEDEF] text-sm hover:bg-white/[0.02] transition-colors">
                      <item.icon className="w-4 h-4 text-[#8A8F98]" />
                      {item.label}
                    </button>
                  )
                ))}
                <button 
                  onClick={logout}
                  className="flex items-center gap-3 w-full p-3 rounded-xl text-red-400 text-sm hover:bg-red-500/10 transition-colors mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center">
              <p className="text-xs text-[#8A8F98]">MediChainAI v1.0.2 (Beta)</p>
              <p className="text-[10px] text-[#8A8F98]/50 mt-1">Secured by Solana Blockchain</p>
            </motion.div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
