"use client"

import { BookOpen, Target, User } from "lucide-react"

export default function AdminStatCards() {
    const stats = [
        {
            icon: BookOpen,
            label: "Sessions",
            value: "4",
            trend: "+25 min",
            trendColor: "text-white",
        },
        {
            icon: Target,
            label: "Targets",
            value: "16%",
            trend: "+5.26% in last 7 days",
            trendColor: "text-white",
        },
        {
            icon: User,
            label: "Trainees",
            value: "16%",
            trend: "+5.26% in last 7 days",
            trendColor: "text-white",
        },
    ]

    return (
        <div className="max-w-7xl mx-auto mt-6 flex gap-6 justify-between">
            {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <div
                        key={index}
                        className="group flex-1 rounded-lg p-6 shadow-md transform transition-all duration-300 hover:scale-95 hover:shadow-xl bg-[#F4F7FF] hover:bg-gradient-to-br hover:from-[#FFD7A3]/80 hover:to-[#A3C7FF]/80"
                        style={{ transitionDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Icon className="w-6 h-6 text-gray-800 group-hover:text-white" />
                        </div>
                        <p className="text-gray-700 text-sm mb-1 group-hover:text-white">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-white">{stat.value}</h3>
                        <p className={`text-xs text-gray-600 group-hover:text-white`}>{stat.trend}</p>
                    </div>
                )
            })}
        </div>
    )
}