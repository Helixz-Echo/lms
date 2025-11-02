"use client"

import { LayoutGrid, BookOpen, HelpCircle, MessageSquare, Clock, User, Settings, LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import {useRouter} from "next/navigation";

export default function Sidebar() {
    const menuItems = [
        { icon: LayoutGrid, label: "Dashboard", active: true },
        { icon: BookOpen, label: "Course" },
        { icon: HelpCircle, label: "Resources" },
        { icon: MessageSquare, label: "Discussion" },
        { icon: Clock, label: "Schedules" },
        { icon: User, label: "My Account" },
        { icon: Settings, label: "Settings" },
    ]

    // Animation trigger on mount safely
    const [loaded, setLoaded] = useState(false)
    useEffect(() => {
        const timeout = setTimeout(() => setLoaded(true), 50) // small delay avoids sync setState
        return () => clearTimeout(timeout)
    }, [])

    const router = useRouter()

    return (
        <aside
            className={`w-52 flex flex-col text-white transform transition-all duration-500 ${
                loaded ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"
            }`}
            style={{ background: "linear-gradient(to bottom, #7B93DB, #9DB3E8)" }}
        >

            <div className="p-6 border-b border-white/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-white animate-bounce">
                        AI
                    </div>
                    <div>
                        <div className="font-bold text-white">AI</div>
                        <div className="text-xs uppercase tracking-wide text-white/80">Dashboard</div>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item, index) => {
                    const Icon = item.icon
                    return (
                        <div
                            key={index}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 transform ${
                                item.active
                                    ? "bg-white/20 text-white scale-105 shadow-md"
                                    : "hover:bg-white/10 hover:scale-105 text-white/90"
                            }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{item.label}</span>
                        </div>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/30">
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-300 hover:bg-white/10 rounded-lg">
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium" ><button onClick={() => router.push("/")}>Log Out</button></span>
                </div>
            </div>
        </aside>
    )
}
