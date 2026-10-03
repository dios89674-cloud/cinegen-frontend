"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-1 bg-[#1c1c1e] p-1 rounded-[14px] w-fit", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[10px] transition-colors duration-200",
            active === tab.key ? "text-white" : "text-[#8e8e93] hover:text-white"
          )}
        >
          {active === tab.key && (
            <motion.div
              layoutId="tab-active"
              className="absolute inset-0 bg-[#2c2c2e] rounded-[10px]"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            />
          )}
          <span className="relative flex items-center gap-2">
            {tab.icon}
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="bg-[#0a84ff] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {tab.badge > 9 ? "9+" : tab.badge}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
