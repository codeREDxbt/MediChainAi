"use client";

import React from "react";
import { motion } from "framer-motion";

const linearTransition = {
  duration: 0.3,
  ease: [0.16, 1, 0.3, 1] as const,
};

export const ScanVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-[#5E6AD2]/20 to-indigo-900/40 relative overflow-hidden flex items-center justify-center">
    {/* Grid pattern */}
    <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-1 p-2 opacity-20">
      {[...Array(24)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
          className="bg-[#5E6AD2] rounded-sm"
        />
      ))}
    </div>

    {/* Center scanning element */}
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={linearTransition}
      className="z-10 w-12 h-12 rounded-full border-2 border-[#5E6AD2]/50 flex items-center justify-center relative"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-8 h-8 rounded-full bg-[#5E6AD2]/30 blur-sm"
      />
      {/* Scan line */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-[#5E6AD2]/50 shadow-[0_0_10px_rgba(94,106,210,0.5)] animate-scan" />
    </motion.div>

    {/* Ambient glow */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ boxShadow: "inset 0 0 40px rgba(94, 106, 210, 0.1)" }}
    />
  </div>
);

export const BlockchainVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-900/40 relative overflow-hidden flex items-center justify-center">
    <div className="relative w-full h-full">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: i * 0.2, ...linearTransition }}
          className="absolute border border-blue-400/30 rounded-lg h-8 w-16 bg-blue-500/10 flex items-center justify-center text-[8px] text-blue-300 font-mono"
          style={{ top: `${20 + i * 15}%`, left: `${10 + i * 15}%` }}
        >
          0x{i}ef...
        </motion.div>
      ))}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
        <motion.path
          d="M 20,30 L 40,45 L 60,60 L 80,75"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-blue-500"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>
    </div>
  </div>
);

export const LearningVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-[#5E6AD2]/20 to-purple-900/40 relative overflow-hidden flex items-center justify-center p-4">
    <div className="grid grid-cols-3 gap-2 w-full max-w-[100px]">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.1, 1],
            backgroundColor:
              i % 2 === 0
                ? [
                    "rgba(94, 106, 210, 0.2)",
                    "rgba(94, 106, 210, 0.5)",
                    "rgba(94, 106, 210, 0.2)",
                  ]
                : "rgba(94, 106, 210, 0.2)",
          }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
          className="h-6 rounded bg-[#5E6AD2]/20 border border-[#5E6AD2]/30"
        />
      ))}
    </div>
  </div>
);

export const PrivacyVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-[#5E6AD2]/20 to-indigo-900/40 relative overflow-hidden flex items-center justify-center">
    <motion.div
      animate={{ rotateY: [0, 180, 360] }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      className="relative w-12 h-16 border-2 border-[#5E6AD2]/50 rounded-lg flex items-center justify-center bg-[#5E6AD2]/10"
    >
      <div className="w-1 h-4 bg-[#5E6AD2]/50 rounded-full" />
    </motion.div>
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ boxShadow: "inset 0 0 40px rgba(94, 106, 210, 0.1)" }}
    />
  </div>
);

export const ReportsVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-900/40 relative overflow-hidden p-3">
    <div className="space-y-1">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ width: 0 }}
          animate={{ width: `${Math.random() * 40 + 50}%` }}
          transition={{ delay: i * 0.1, ...linearTransition }}
          className="h-1 bg-amber-500/30 rounded-full"
        />
      ))}
    </div>
  </div>
);

export const TokensVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-900/40 relative overflow-hidden flex items-center justify-center">
    <motion.div
      animate={{ y: [-5, 5, -5], rotate: [0, 5, 0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center"
      style={{ boxShadow: "0 0 20px rgba(234, 179, 8, 0.2)" }}
    >
      <div className="text-yellow-500 font-bold text-lg">M</div>
    </motion.div>
  </div>
);
