"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, checked: checkedProp, defaultChecked, onCheckedChange, ...props }, ref) => {
  const [internalChecked, setInternalChecked] = React.useState<boolean>(defaultChecked ?? false)
  const isControlled = checkedProp !== undefined
  const checked = isControlled ? Boolean(checkedProp) : internalChecked

  const handleCheckedChange = React.useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalChecked(value)
      onCheckedChange?.(value)
    },
    [isControlled, onCheckedChange],
  )

  const prefersReducedMotion = useReducedMotion()

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className
      )}
      {...(isControlled ? { checked } : { defaultChecked })}
      onCheckedChange={handleCheckedChange}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb asChild>
        <motion.span
          className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0"
          animate={{ x: checked ? 20 : 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 700, damping: 30, mass: 0.7 }
          }
          whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
        />
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
