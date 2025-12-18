"use client"

import { useState, createContext, useContext } from "react"

export interface Toast {
    id: string
    title?: string
    description?: string
    action?: React.ReactNode
    variant?: "default" | "destructive"
}

interface ToastContextType {
    toasts: Toast[]
    toast: (toast: Omit<Toast, "id">) => void
    dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const toast = ({ title, description, variant = "default" }: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9)
        const newToast = { id, title, description, variant }
        setToasts((prev) => [...prev, newToast])

        // Auto dismiss after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 4000)
    }

    const dismiss = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ toasts, toast, dismiss }}>
            {children}
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        // Fallback for components outside provider
        const [toasts, setToasts] = useState<Toast[]>([])
        const toast = ({ title, description, variant = "default" }: Omit<Toast, "id">) => {
            const id = Math.random().toString(36).substring(2, 9)
            const newToast = { id, title, description, variant }
            setToasts((prev) => [...prev, newToast])
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id))
            }, 4000)
        }
        const dismiss = (id: string) => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }
        return { toasts, toast, dismiss }
    }
    return context
}
