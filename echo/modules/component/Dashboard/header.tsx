"use client"

import { Search, User } from "lucide-react"
import { useState } from "react"

export default function Header() {
    const [focused, setFocused] = useState(false)

    const user = {
        name: "Tarun Kumar",
        initials: "TK",
        avatarColor: "#4A90E2"
    }

    return (
        <header className="bg-gradient-to-r from-[#7B93DB] to-[#9DB3E8] px-8 py-6 border-b border-white/20 shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">


                <div className="flex items-center gap-3 animate-fadeInUp">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                        style={{ backgroundColor: user.avatarColor }}
                    >
                        <User className="w-6 h-6" />
                    </div>
                    <div className="text-white font-semibold">
                        <p className="text-sm">{user.name}</p>
                    </div>
                </div>

                <div
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg shadow-md border transition-all duration-300 transform ${
                        focused
                            ? "bg-white/90 border-white/40 shadow-xl scale-105"
                            : "bg-white/80 border-white/20"
                    }`}
                >
                    <Search
                        className={`w-5 h-5 transition-colors duration-300 ${
                            focused ? "text-blue-500" : "text-gray-400"
                        }`}
                    />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 w-64"
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                    />
                </div>
            </div>
        </header>
    )
}
