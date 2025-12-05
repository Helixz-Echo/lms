import Sidebar from "@/modules/component/Dashboard/trainer/sidebar";
import Header from "@/modules/component/Dashboard/trainer/header";
import StatCards from "@/modules/component/Dashboard/trainer/stat-cards";
import TrainingGrid from "@/modules/component/Dashboard/trainer/training-grid";
import AssessmentChat from "@/modules/component/AssessmentChat";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function TrainerDashboard({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;
    const viewParam = params?.view;
    const view = Array.isArray(viewParam) ? viewParam[0] : viewParam;
    const sessionIdParam = params?.session_id;
    const session_id = Array.isArray(sessionIdParam) ? sessionIdParam[0] : sessionIdParam;

    if (view === "assessment") {
        if (!session_id) {
            // Handle case where session_id is missing for assessment view
            return <div>Error: Session ID is required for assessment.</div>;
        }
        return <AssessmentChat session_id={session_id} />;
    }

    return (
        <div className="flex h-screen bg-background">

            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">


                <main className="flex-1 overflow-auto bg-white p-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        <div className="mb-8 animate-fadeIn">
                            <p className="text-sm text-gray-600 font-medium">Hi Yuwen,</p>
                            <h1 className="text-4xl font-bold text-gray-800">Welcome to Helixz Echo!</h1>
                            <p className="text-gray-500 mt-1">Friday, November 7, 2025</p>
                        </div>

                        <div className="opacity-0 animate-fadeInSlide delay-200">
                            <StatCards />
                        </div>

                        <div className="opacity-0 animate-fadeInSlide delay-300">
                            <TrainingGrid />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}