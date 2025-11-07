"use client"

import React from "react"
import { BookOpen, Target } from "lucide-react"

interface StatCardProps {
    icon: React.ComponentType<any>
    label: string
    value: string | number
    trend: string
}

export default function TrainerStatCards() {
    const stats: StatCardProps[] = [
        {
            icon: BookOpen,
            label: "Sessions Completed",
            value: "4",
            trend: "+25 min in last 7 days",
        },
        {
            icon: Target,
            label: "Accuracy",
            value: "11.3%",
            trend: "+5.26% in last 7 days",
        },
        {
            icon: Target,
            label: "Calls Accuracy",
            value: "92%",
            trend: "+3.5% in last 7 days",
        },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 rounded-lg bg-blue-50">
                                <Icon className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
                        <p className="text-xs text-gray-500">{stat.trend}</p>
                    </div>
                )
            })}
        </div>
    )
}
