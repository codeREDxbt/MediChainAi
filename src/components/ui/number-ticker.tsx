"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// Aceternity-style NumberTicker: animates a number counting up when it scrolls into view
export function NumberTicker({
    value,
    direction = "up",
    delay = 0,
    className,
    decimalPlaces = 0,
}: {
    value: number;
    direction?: "up" | "down";
    className?: string;
    delay?: number;
    decimalPlaces?: number;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const motionValue = useMotionValue(direction === "down" ? value : 0);
    const springValue = useSpring(motionValue, {
        damping: 60,
        stiffness: 100,
    });
    const isInView = useInView(ref, { once: true, margin: "0px" });
    const [displayValue, setDisplayValue] = useState(
        direction === "down" ? value : 0
    );

    useEffect(() => {
        if (isInView) {
            setTimeout(() => {
                motionValue.set(direction === "down" ? 0 : value);
            }, delay * 1000);
        }
    }, [motionValue, isInView, delay, value, direction]);

    useEffect(() => {
        const unsubscribe = springValue.on("change", (latest) => {
            setDisplayValue(parseFloat(latest.toFixed(decimalPlaces)));
        });
        return () => unsubscribe();
    }, [springValue, decimalPlaces]);

    return (
        <span
            ref={ref}
            className={cn(
                "inline-block tabular-nums text-black dark:text-white tracking-wider",
                className
            )}
        >
            {Intl.NumberFormat("en-US", {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces,
            }).format(displayValue)}
        </span>
    );
}
