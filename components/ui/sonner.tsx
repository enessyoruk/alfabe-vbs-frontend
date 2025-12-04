"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: `
            group toast 
            group-[.toaster]:bg-background group-[.toaster]:text-foreground 
            group-[.toaster]:border-border group-[.toaster]:shadow-lg 
            px-6 py-4 rounded-lg min-w-[320px] 
            text-[15px] font-medium
          `,
          description: `
            group-[.toast]:text-muted-foreground 
            text-[14px]
          `,
          actionButton: `
            group-[.toast]:bg-primary 
            group-[.toast]:text-primary-foreground
          `,
          cancelButton: `
            group-[.toast]:bg-muted 
            group-[.toast]:text-muted-foreground
          `,
        },
        duration: 2000,
      }}
      {...props}
    />
  )
}

export { Toaster }
