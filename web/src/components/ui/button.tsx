import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-md font-display tracking-wide transition",
    "disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
    {
      primary:
        "bg-paper text-ink hover:bg-white shadow-[3px_3px_0_0_rgb(255_255_255/0.25)] hover:shadow-[4px_4px_0_0_rgb(255_255_255/0.35)]",
      outline: "border border-line-strong text-paper hover:border-paper hover:bg-white/5",
      ghost: "text-ash hover:text-paper hover:bg-white/5",
      danger: "border border-danger/60 text-danger hover:bg-danger/10",
    }[variant],
    {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-5 text-base",
      lg: "h-14 px-7 text-lg sm:text-xl",
    }[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
