"use client"

import { X, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "./use-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
    const { toasts, dismiss } = useToast()

    if (toasts.length === 0) return null

    return (
        <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
            ))}
        </div>
    )
}

function Toast({ toast, onDismiss }: { toast: any; onDismiss: () => void }) {
    return (
        <div
            className={cn(
                "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all animate-in slide-in-from-top-full",
                toast.variant === "destructive"
                    ? "border-red-500 bg-red-50 text-red-900"
                    : "border bg-white text-foreground shadow-md"
            )}
        >
            <div className="grid gap-1 flex-1">
                {toast.title && (
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        {toast.variant === "destructive" ? (
                            <AlertCircle className="h-4 w-4" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        {toast.title}
                    </div>
                )}
                {toast.description && (
                    <div className="text-sm opacity-90 ml-6">{toast.description}</div>
                )}
            </div>
            <button
                className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
                onClick={onDismiss}
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

