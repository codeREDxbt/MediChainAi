"use client";

import { useMotionValue, useMotionTemplate, motion } from "motion/react";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const generateRandomString = (length: number) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return result;
};

export function CardPattern({
  mouseX,
  mouseY,
}: {
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
}) {
  const maskImage = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, white, transparent)`;
  const style = { maskImage, WebkitMaskImage: maskImage };

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {/* Gradient overlay - follows cursor with mask, only on hover */}
      <motion.div
        className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-[#5E6AD2]/40 to-indigo-600/30 opacity-0 group-hover/card:opacity-100 group-hover/evervault:opacity-100 transition-opacity duration-500"
        style={style}
      />

      {/* Subtle accent glow on hover */}
      <div
        className="absolute inset-0 rounded-[2.5rem] opacity-0 group-hover/card:opacity-100 group-hover/evervault:opacity-100 transition-opacity duration-500"
        style={{
          boxShadow:
            "0 0 40px rgba(94, 106, 210, 0.08), inset 0 0 20px rgba(94, 106, 210, 0.02)",
        }}
      />
    </div>
  );
}

export const EvervaultCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    setRandomString(generateRandomString(1500));
  }, []);

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
  }

  return (
    <div
      className={cn(
        "p-0.5 bg-transparent flex items-center justify-center w-full h-full relative",
        className
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full relative overflow-hidden bg-[#0a0a0c] flex items-center justify-center h-full"
      >
<CardPattern
      mouseX={mouseX}
      mouseY={mouseY}
    />
        <div className="relative z-50 w-full bg-[#0a0a0c]/95 backdrop-blur-sm rounded-3xl">
          {children}
        </div>
      </div>
    </div>
  );
};

export const EvervaultCardWrapper = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [randomString, setRandomString] = useState("");

  useEffect(() => {
    setRandomString(generateRandomString(1500));
  }, []);

  function onMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    setRandomString(generateRandomString(1500));
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={onMouseMove}
      className={cn(
        "group/evervault relative w-full rounded-[2.5rem] overflow-hidden",
        "bg-[#0a0a0c]",
        "border border-white/[0.06]",
        "shadow-linear-card",
        "hover:shadow-linear-card-hover",
        "transition-all duration-300",
        className
      )}
    >
      {/* Hover overlay - at z-0, behind everything */}
      <CardPattern
        mouseX={mouseX}
        mouseY={mouseY}
      />

      {/* Inner highlight border - z-10 */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[2.5rem] z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255, 255, 255, 0.08), transparent 50%)",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />

      {/* Card content - z-50, transparent so effect shows in empty spaces */}
      <div className="relative z-50 rounded-[2.5rem]">
        {children}
      </div>
    </motion.div>
  );
};

export const Icon = ({
  className,
  ...rest
}: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m6-6H6"
      />
    </svg>
  );
};
