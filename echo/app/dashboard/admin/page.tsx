import AdminSidebar from "@/modules/component/Dashboard/admin/admin_sidebar";
import AdminHeader from "@/modules/component/Dashboard/admin/admin_header";
import AdminStatCards from "@/modules/component/Dashboard/admin/admin_stat-cards";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AssessmentChat from "@/modules/component/AssessmentChat";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;
    const viewParam = params?.view;
    const view = Array.isArray(viewParam) ? viewParam[0] : viewParam;
    const sessionId = Array.isArray(params?.session_id) ? params.session_id[0] : params?.session_id;

    if (view === "assessment" && sessionId) {
        return <AssessmentChat session_id={sessionId} />;
    }

    return (
        <div className="flex h-screen bg-background">

            <AdminSidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader />

                <main className="flex-1 overflow-auto bg-white p-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        <div className="opacity-0 animate-fadeInSlide delay-100">
                            <p className="text-sm text-blue-400 font-medium">Hi Admin,</p>
                            <h1 className="text-4xl font-bold text-blue-300">Welcome to Echo!</h1>
                        </div>

                        <div className="opacity-0 animate-fadeInSlide delay-300">
                            <AdminStatCards />
                        </div>

                    </div>
                </main>
            </div>
        </div>
    )
}
