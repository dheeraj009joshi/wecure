import { DoctorSidebar } from "@/components/doctor/Sidebar"

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-muted/30">
            <DoctorSidebar />
            {/* Main content with padding for sidebar */}
            <div className="lg:pl-64">
                <div className="pt-16 lg:pt-0">
                    <main className="p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
