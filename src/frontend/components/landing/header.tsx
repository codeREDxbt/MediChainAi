"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Shield } from "lucide-react";

export const Header = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={cn(
                "fixed top-0 inset-x-0 z-[100] transition-all duration-300 border-b border-transparent",
                scrolled && "bg-slate-950/50 backdrop-blur-md border-white/10 py-2 shadow-xl"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        MediChainAI
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    {["Features", "Stack", "Docs"].map((item) => (
                        <Link
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            {item}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <Link href="/auth">
                        <button className="px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all">
                            Login
                        </button>
                    </Link>
                    <Link href="/auth">
                        <button className="px-4 py-2 text-sm font-medium text-slate-950 bg-white hover:bg-slate-200 rounded-full transition-all shadow-lg shadow-white/10">
                            Join Beta
                        </button>
                    </Link>
                </div>
            </div>
        </motion.header>
    );
};
