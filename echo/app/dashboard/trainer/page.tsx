import Sidebar from "@/modules/component/Dashboard/trainer/sidebar";
import Header from "@/modules/component/Dashboard/trainer/header";
import StatCards from "@/modules/component/Dashboard/trainer/stat-cards";
import TrainingGrid from "@/modules/component/Dashboard/trainer/training-grid";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function TrainerDashboard() {
    return (
        <div className="flex h-screen bg-background">

            <Sidebar />

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-auto bg-white p-8">
                    <div className="max-w-7xl mx-auto space-y-8">

                        <div className="opacity-0 animate-fadeInSlide delay-100">
                            <p className="text-sm text-blue-400 font-medium">Hi Tarun,</p>
                            <h1 className="text-4xl font-bold text-blue-300">Welcome to Sova!</h1>
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