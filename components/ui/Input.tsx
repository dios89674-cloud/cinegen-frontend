"use client";

import { cn } from "@/lib/cn";
import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-[#8e8e93]">{label}</label>
      )}
      <input
        className={cn(
          "w-full bg-[#1c1c1e] text-white placeholder-[#48484a] rounded-[12px] px-4 py-3",
          "border border-white/[0.08] outline-none",
          "transition-all duration-300",
          "focus:border-[#0a84ff] focus:ring-2 focus:ring-[#0a84ff]/20",
          error && "border-[#ff3b30] focus:border-[#ff3b30] focus:ring-[#ff3b30]/20",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-xs text-[#ff3b30]">{error}</span>
      )}
    </div>
  );
}
