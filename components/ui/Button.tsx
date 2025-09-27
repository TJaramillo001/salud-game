"use client";

import * as React from "react";
import clsx from "clsx";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
};

const base =
    "inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-400 ring-offset-neutral-950 disabled:opacity-60 disabled:cursor-not-allowed";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
        "bg-white text-neutral-950 hover:bg-neutral-200 focus-visible:ring-neutral-300",
    secondary:
        "bg-neutral-800 text-white hover:bg-neutral-700 focus-visible:ring-neutral-500",
    ghost:
        "bg-transparent text-white hover:bg-neutral-900/60 focus-visible:ring-neutral-700",
};

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "text-sm px-3 py-2",
    md: "text-base px-4 py-2.5",
    lg: "text-lg px-5 py-3",
};

// Define as a typed function component + export default to avoid any confusion
const Button: React.FC<ButtonProps> = ({
                                           className,
                                           variant = "primary",
                                           size = "md",
                                           loading = false,
                                           children,
                                           ...props
                                       }) => {
    return (
        <button
            className={clsx(base, variants[variant], sizes[size], className)}
            aria-busy={loading}
            {...props}
        >
            {loading ? (
                <span className="relative inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <span>Loading…</span>
        </span>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;
export { Button }; // optional named export for ergonomics
