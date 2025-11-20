"use client"

import {
    LayoutGrid,
    BookOpen,
    User,
    Settings,
    LogOut,
    PhoneCall
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import logo from "./logo.png"

export default function Sidebar() {
    const router = useRouter()
    const [isHovered, setIsHovered] = useState(false)
    const [loaded, setLoaded] = useState(false)

    const menuItems = [
        { icon: LayoutGrid, label: "Dashboard", active: true, href: "/dashboard/trainer" },
        { icon: BookOpen, label: "Course", href: "#" },
        { icon: PhoneCall, label: "Call Agent", href: "/dashboard/call-agent" },
        { icon: User, label: "My Account", href: "#" },
        { icon: Settings, label: "Settings", href: "#" },
    ]

    useEffect(() => {
        const timeout = setTimeout(() => setLoaded(true), 50)
        return () => clearTimeout(timeout)
    }, [])

    return (
        <aside
            className={`flex flex-col text-white transition-all duration-300 ${loaded ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"
                } ${isHovered ? "w-52" : "w-20"}`}
            style={{ background: "#181818" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Logo Section */}
            <div className="border-b border-white/10 flex items-center justify-center h-20">
                <Image
                    src={logo}
                    alt="Trainer Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                    priority
                />
            </div>

            {/* User Section */}
            <div className="flex flex-col items-center gap-2 py-4 border-b border-white/10">
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-r from-[#FFD7A3] to-[#A3C7FF]">
                    <User className="w-7 h-7 text-[#181818]" />
                </div>
                <div className={`text-center transition-all ${isHovered ? "opacity-100" : "opacity-0"}`}>
                    <div className="text-sm font-semibold">Trainee</div>
                    <div className="text-xs text-white/70">Yuwen</div>
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item, index) => {
                    const Icon = item.icon
                    return (
                        <div
                            key={index}
                            onClick={() => item.href && router.push(item.href)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300 transform ${item.active
                                    ? "bg-gradient-to-r from-white/5 to-white/10 text-white scale-105 shadow-md"
                                    : "text-white/80 hover:scale-105 hover:shadow-md hover:text-white hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10"
                                }`}
                            style={{ transitionDelay: `${index * 50}ms` }}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0 text-white/90" />
                            <span
                                className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isHovered ? "w-auto opacity-100" : "w-0 opacity-0"
                                    }`}
                            >
                                {item.label}
                            </span>
                        </div>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="border-t border-white/10 mb-5">
                <div
                    className="flex items-center gap-3 px-3 py-3 cursor-pointer transition-all duration-300 rounded-lg hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10"
                    onClick={() => router.push("/")}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0 text-white/90" />
                    <span
                        className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isHovered ? "w-auto opacity-100 text-white" : "w-0 opacity-0"
                            }`}
                    >
                        Log Out
                    </span>
                </div>
            </div>
        </aside>
    )
}
