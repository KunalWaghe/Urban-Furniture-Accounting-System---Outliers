"use client"

/**
 * Reusable form label primitive (shadcn-style).
 * Presentational label with disabled-state styling via peer/group selectors.
 */

import * as React from "react"
import { cn } from "cn"

/** Accessible label for form controls. */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
