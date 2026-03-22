"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

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
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 inset-x-0 z-[100] transition-all duration-300",
        scrolled
          ? "bg-[#050506]/80 backdrop-blur-xl border-b border-white/[0.06] py-2 shadow-linear-card"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            <Image
              src="/image.png"
              alt="MediChainAI Logo"
              width={32}
              height={32}
              className="object-contain w-full h-full"
              priority
            />
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
              className="relative text-sm font-medium text-[#8A8F98] hover:text-[#EDEDEF] transition-colors duration-200 group"
            >
              {item}
              <span className="absolute -inset-2 rounded-lg bg-[#5E6AD2]/0 group-hover:bg-[#5E6AD2]/5 transition-colors duration-200" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/auth">
            <button className="px-4 py-2 text-sm font-medium text-[#EDEDEF] bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] rounded-full transition-all duration-200">
              Login
            </button>
          </Link>
          <Link href="/auth">
            <button className="px-4 py-2 text-sm font-medium text-white bg-[#5E6AD2] hover:bg-[#6872D9] rounded-full transition-all duration-200 shadow-linear-accent">
              Join Beta
            </button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
};
