"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import React from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "light" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      expand={false}
      richColors={false}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "bg-white text-black border border-gray-200 shadow-md rounded-xl p-4",

          title: "text-black font-semibold",

          description: "text-gray-600",

          success:
            "bg-white text-black border border-gray-200",

          error:
            "bg-white text-black border border-gray-200",

          warning:
            "bg-white text-black border border-gray-200",

          info:
            "bg-white text-black border border-gray-200",

          icon: "text-green-600",
        },
      }}
      style={
        {
          "--normal-bg": "white",
          "--normal-text": "black",
          "--normal-border": "#e5e7eb",

          "--success-bg": "white",
          "--success-border": "#e5e7eb",
          "--success-text": "black",

          "--error-bg": "white",
          "--warning-bg": "white",
          "--info-bg": "white",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }