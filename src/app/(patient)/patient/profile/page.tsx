"use client";

import { useState, useEffect } from "react";
import { TopBar } from "@/components/top-bar";
import { Card, CardBody, CardHeader, Button, Chip, Avatar, Input } from "@heroui/react";
import { 
  User, Wallet, Shield, Bell, Settings, HelpCircle, LogOut, 
  Copy, Check, Camera, Mail, Phone, Calendar, AlertCircle,
  FileText, Brain, Coins, Activity, Edit2, Save, X
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "motion/react";
import { useToast } from "@/hooks/use-toast";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { NumberTicker } from "@/components/ui/number-ticker";
import Link from "next/link";

const containerVariants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] as any }
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

  const getInitials = (name: string | null) => {
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
      <div className="flex flex-col min-h-screen">
        <div className="lg:hidden">
          <TopBar title="Profile" showLogo={false} showNotifications={false} showAvatar={false} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="lg:hidden">
        <TopBar 
          title="Profile" 
          showLogo={false} 
          showNotifications={false} 
          showAvatar={false}
          rightContent={
            <Button 
              isIconOnly 
              variant="light" 
              size="sm"
              onPress={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </Button>
          }
        />
      </div>

      <motion.main 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="flex-1 px-4 py-6 space-y-6 lg:px-0 lg:py-0"
      >
        {/* Desktop Header */}
        <motion.div variants={itemVariants} className="hidden lg:flex lg:items-center lg:justify-between lg:mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground">Manage your account and view your stats</p>
          </div>
          {!isEditing && (
            <Button
              variant="flat"
              color="primary"
              startContent={<Edit2 className="w-4 h-4" />}
              onPress={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </motion.div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl">
                <div className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-emerald-500/20">
                  <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
                </div>
                <CardBody className="relative pb-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
                    <div className="relative">
                      <Avatar
                        src={profile?.avatarUrl || undefined}
                        name={getInitials(profile?.username)}
                        className="w-24 h-24 text-2xl border-4 border-background"
                        color="primary"
                      />
                      {isEditing && (
                        <Button
                          isIconOnly
                          size="sm"
                          className="absolute bottom-0 right-0 rounded-full"
                          onPress={() => {}}
                        >
                          <Camera className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-2xl font-bold text-foreground">
                          {profile?.username || "Anonymous User"}
                        </h2>
                        <Chip 
                          variant="flat" 
                          color={profile?.role === "admin" ? "warning" : "primary"}
                          size="sm"
                        >
                          {profile?.role === "admin" ? "Admin" : "Patient"}
                        </Chip>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Member since {formatDate(profile?.createdAt || null)}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            {/* Wallet Connection Card */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Wallet Connection</h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Solana Wallet</p>
                        <p className="font-mono text-sm text-foreground">
                          {profile?.walletAddress ? formatWalletAddress(profile.walletAddress) : "Not connected"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip variant="flat" color="success" size="sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
                        Devnet
                      </Chip>
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={copyAddress}
                      >
                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {tokenBalance && (
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <Coins className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">MCI Token Balance</p>
                          <p className="text-xl font-bold text-foreground">
                            <NumberTicker value={tokenBalance.uiAmount} /> <span className="text-sm font-normal text-muted-foreground">MCI</span>
                          </p>
                        </div>
                      </div>
                      <Link href="/patient/wallet">
                        <Button variant="flat" size="sm" color="success">
                          View Wallet
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardBody>
              </Card>
            </motion.div>

            {/* Personal Information Card */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Personal Information</h3>
                    </div>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="flat" onPress={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" color="primary" startContent={<Save className="w-3 h-3" />} onPress={handleSaveProfile}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="light" startContent={<Edit2 className="w-3 h-3" />} onPress={() => setIsEditing(true)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  {isEditing ? (
                    <>
                      <Input
                        label="Username"
                        placeholder="Enter your username"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        startContent={<User className="w-4 h-4 text-muted-foreground" />}
                      />
                      <Input
                        label="Email"
                        placeholder="Enter your email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        startContent={<Mail className="w-4 h-4 text-muted-foreground" />}
                      />
                      <Input
                        label="Phone"
                        placeholder="Enter your phone number"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        startContent={<Phone className="w-4 h-4 text-muted-foreground" />}
                      />
                      <Input
                        label="Emergency Contact"
                        placeholder="Enter emergency contact"
                        value={editForm.emergencyContact}
                        onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                        startContent={<AlertCircle className="w-4 h-4 text-muted-foreground" />}
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between py-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Username</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{profile?.username || "Not set"}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Email</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{profile?.email || "Not set"}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Phone</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{profile?.phone || "Not set"}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Member Since</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{formatDate(profile?.createdAt || null)}</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Emergency Contact</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{profile?.emergencyContact || "Not set"}</span>
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="space-y-6 mt-6 lg:mt-0">
            {/* Stats Card */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Your Stats</h3>
                  </div>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="relative rounded-2xl bg-background/50 p-4 border border-white/5">
                    <GlowingEffect spread={20} glow={true} className="z-0" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-sm text-muted-foreground">Total Scans</span>
                      </div>
                      <p className="text-3xl font-bold text-foreground">
                        <NumberTicker value={stats?.totalScans || 0} />
                      </p>
                    </div>
                  </div>

                  <div className="relative rounded-2xl bg-background/50 p-4 border border-white/5">
                    <GlowingEffect spread={20} glow={true} className="z-0" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <Brain className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-sm text-muted-foreground">Analyzed</span>
                      </div>
                      <p className="text-3xl font-bold text-foreground">
                        <NumberTicker value={stats?.analyzedScans || 0} />
                      </p>
                    </div>
                  </div>

                  <div className="relative rounded-2xl bg-background/50 p-4 border border-white/5">
                    <GlowingEffect spread={20} glow={true} className="z-0" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Coins className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="text-sm text-muted-foreground">MCI Earned</span>
                      </div>
                      <p className="text-3xl font-bold text-foreground">
                        <NumberTicker value={tokenBalance?.uiAmount || 0} />
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl">
                <CardHeader className="pb-2">
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Quick Actions</h3>
                </CardHeader>
                <CardBody className="space-y-2">
                  <Link href="/patient/settings" className="block">
                    <Button variant="flat" className="w-full justify-start h-12" startContent={<Settings className="w-4 h-4" />}>
                      Settings
                    </Button>
                  </Link>
                  <Link href="/patient/wallet" className="block">
                    <Button variant="flat" className="w-full justify-start h-12" startContent={<Wallet className="w-4 h-4" />}>
                      Manage Wallet
                    </Button>
                  </Link>
                  <Button variant="flat" className="w-full justify-start h-12" startContent={<HelpCircle className="w-4 h-4" />}>
                    Help Center
                  </Button>
                  <Button 
                    variant="flat" 
                    color="danger"
                    className="w-full justify-start h-12" 
                    startContent={<LogOut className="w-4 h-4" />}
                    onPress={logout}
                  >
                    Sign Out
                  </Button>
                </CardBody>
              </Card>
            </motion.div>

            {/* App Info */}
            <motion.div variants={itemVariants} className="text-center">
              <p className="text-xs text-muted-foreground">MediChainAI v1.0.2 (Beta)</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">Secured by Solana Blockchain</p>
            </motion.div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
