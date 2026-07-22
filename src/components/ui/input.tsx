import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn("h-11 w-full max-w-full min-w-0 box-border rounded-lg border border-input bg-white px-3 text-base shadow-xs outline-none transition-[color,background-color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-900 dark:text-slate-100 dark:[color-scheme:dark] sm:text-sm", className)}
      {...props}
    />
  )
}

export { Input }
