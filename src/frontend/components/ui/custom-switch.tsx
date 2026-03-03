"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CustomSwitchProps {
    isSelected: boolean;
    onValueChange: (isSelected: boolean) => void;
    className?: string;
}

export function CustomSwitch({ isSelected, onValueChange, className }: CustomSwitchProps) {
    return (
        <div
            onClick={() => onValueChange(!isSelected)}
            className={cn(
                "group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2",
                isSelected ? "bg-emerald-500/20 border-emerald-500/30" : "bg-white/5 border-white/10",
                "border ",
                className
            )}
        >
            <motion.span
                layout
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                }}
                className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-lg ring-0 transition-transform duration-200 ease-in-out",
                    isSelected ? "translate-x-6 bg-emerald-500" : "translate-x-1 bg-slate-400"
                )}
            />
            {/* Subtle glow effect when active */}
            {isSelected && (
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-[4px] pointer-events-none transition-opacity duration-300 opacity-100" />
            )}
        </div>
    );
}
