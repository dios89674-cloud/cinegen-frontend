"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-[14px] transition-all duration-300 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#0a84ff] text-white hover:bg-[#0070d4]",
    secondary: "bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/10",
    ghost: "text-[#8e8e93] hover:text-white hover:bg-white/5",
    danger: "bg-[#ff3b30] text-white hover:bg-[#e0352b]",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...(props as object)}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : null}
      {children}
    </motion.button>
  );
}
