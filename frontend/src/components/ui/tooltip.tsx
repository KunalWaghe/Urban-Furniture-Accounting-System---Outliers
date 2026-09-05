"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "cn";

export function TooltipProvider({
  children,
  delay = 300,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <TooltipPrimitive.Provider delay={delay} closeDelay={80} timeout={400}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Root>{children}</TooltipPrimitive.Root>;
}

export function TooltipTrigger({
  className,
  ...props
}: TooltipPrimitive.Trigger.Props) {
  return (
    <TooltipPrimitive.Trigger
      className={cn("inline-flex", className)}
      {...props}
    />
  );
}

export function TooltipContent({
  className,
  children,
  sideOffset = 6,
}: {
  className?: string;
  children: React.ReactNode;
  sideOffset?: number;
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner sideOffset={sideOffset}>
        <TooltipPrimitive.Popup
          className={cn(
            "z-50 rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text shadow-md",
            "origin-[var(--transform-origin)] transition-[transform,opacity] duration-100 ease-out",
            "data-starting-style:scale-95 data-starting-style:opacity-0",
            "data-ending-style:scale-95 data-ending-style:opacity-0",
            className
          )}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

/**
 * Wraps an icon-only control with a hover/focus tooltip.
 * Use for table action buttons and other controls that only show an icon.
 */
export function ActionTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  const child = React.cloneElement(children, {
    "aria-label": label,
    ...(children.props as Record<string, unknown>),
  } as Record<string, unknown>);

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{child}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
