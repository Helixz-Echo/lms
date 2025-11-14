import AdminSidebar from "@/modules/component/Dashboard/admin/admin_sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

