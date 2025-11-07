"use client"

import { User } from "lucide-react"

export default function AdminHeader() {
    // header matches sidebar logo area height (h-20)

    const user = {
        name: "Tarun Kumar",
        initials: "TK",
        avatarColor:  "#15803D", // Amber-600
    }

    return (
        <header className="bg-[#F4F7FF] h-20 border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-end items-center h-full px-8">
                {/* User Avatar (Right Corner) - larger and no extra padding */}
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105"
                    style={{ backgroundColor: user.avatarColor }}
                    aria-label={user.name}
                >
                    <User className="w-6 h-6 text-white" />
                </div>
            </div>
        </header>
    )
}
