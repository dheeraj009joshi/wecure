"use client"

import { ToastProvider } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            {children}
            <Toaster />
        </ToastProvider>
    );
}

