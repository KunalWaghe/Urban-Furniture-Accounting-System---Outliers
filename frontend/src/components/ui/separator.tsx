"use client"

/**
 * Reusable separator primitive (shadcn-style).
 * Visual divider for horizontal or vertical layout sections.
 */

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "cn"

/** Horizontal or vertical divider line. */
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
