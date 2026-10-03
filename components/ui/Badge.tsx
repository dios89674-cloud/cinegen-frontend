import { cn } from "@/lib/cn";

type BadgeVariant = "blue" | "green" | "yellow" | "red" | "purple" | "gray";

const variants: Record<BadgeVariant, string> = {
  blue: "bg-[#0a84ff]/15 text-[#0a84ff] border-[#0a84ff]/20",
  green: "bg-[#30d158]/15 text-[#30d158] border-[#30d158]/20",
  yellow: "bg-[#ff9f0a]/15 text-[#ff9f0a] border-[#ff9f0a]/20",
  red: "bg-[#ff3b30]/15 text-[#ff3b30] border-[#ff3b30]/20",
  purple: "bg-[#bf5af2]/15 text-[#bf5af2] border-[#bf5af2]/20",
  gray: "bg-white/5 text-[#8e8e93] border-white/10",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
