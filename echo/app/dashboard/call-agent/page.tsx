"use client";
import { useRouter } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import CallAgentClient from "@/modules/component/Dashboard/trainer/CallAgentClient";

export default function CallAgent() {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-400 via-blue-300 to-black">
      <main className="flex flex-1 min-h-0 flex-col">
        <header className="relative px-4 py-4 pt-16 md:px-8 md:py-8 lg:px-12 lg:py-10 xl:px-16 xl:py-12">
          {/* Dashboard button */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <button
              onClick={() => router.push("/dashboard/trainer")}
              title="Go to Dashboard"
              aria-label="Go to dashboard"
              className="flex h-10 items-center gap-2 px-3 rounded-lg bg-white/10 text-white/90 backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="hidden sm:inline font-semibold">Dashboard</span>
            </button>
          </div>
        </header>
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden px-4 pb-6 md:px-8 md:pb-8 lg:px-12 lg:pb-12 xl:px-20">
          <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-1 min-h-0 flex-col pt-4">
              <div className="mx-auto w-full max-w-5xl flex-1 min-h-0">
                <CallAgentClient />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
