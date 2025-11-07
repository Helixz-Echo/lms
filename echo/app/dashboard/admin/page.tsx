"use client"

import React, { useState } from "react"
import {
    Calendar,
    Phone,
    Clock,
    TrendingUp,
    TrendingDown,
    Users,
} from "lucide-react"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts"

// ===== Demo Data =====
const callVolumeData = [
    { time: "9 AM", calls: 45, answered: 38, missed: 7 },
    { time: "10 AM", calls: 62, answered: 55, missed: 7 },
    { time: "11 AM", calls: 78, answered: 71, missed: 7 },
    { time: "12 PM", calls: 85, answered: 76, missed: 9 },
    { time: "1 PM", calls: 52, answered: 47, missed: 5 },
    { time: "2 PM", calls: 68, answered: 62, missed: 6 },
    { time: "3 PM", calls: 91, answered: 83, missed: 8 },
    { time: "4 PM", calls: 73, answered: 68, missed: 5 },
]

const agentPerformance = [
    { name: "Sarah M.", calls: 156, avgTime: "4:32", satisfaction: 4.8 },
    { name: "John D.", calls: 142, avgTime: "5:12", satisfaction: 4.6 },
    { name: "Emma W.", calls: 138, avgTime: "4:45", satisfaction: 4.9 },
    { name: "Mike R.", calls: 125, avgTime: "5:34", satisfaction: 4.5 },
    { name: "Lisa K.", calls: 118, avgTime: "4:58", satisfaction: 4.7 },
]

const callStatusData = [
    { name: "Answered", value: 682, color: "#10b981" },
    { name: "Missed", value: 68, color: "#ef4444" },
    { name: "In Queue", value: 24, color: "#f59e0b" },
]

const weeklyCallData = [
    { day: "Mon", calls: 324 },
    { day: "Tue", calls: 398 },
    { day: "Wed", calls: 412 },
    { day: "Thu", calls: 387 },
    { day: "Fri", calls: 445 },
    { day: "Sat", calls: 198 },
    { day: "Sun", calls: 156 },
]

// ===== Calendar Component =====
const CalendarComponent = () => {
    const [currentDate] = useState(new Date(2025, 10, 7))
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]

    const days: React.ReactNode[] = []
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="aspect-square"></div>)
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === 7
        const hasEvent = [5, 12, 18, 25].includes(day)
        days.push(
            <div
                key={day}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm cursor-pointer transition-colors ${
                    isToday ? "bg-blue-600 text-white font-bold" : "hover:bg-gray-100"
                } ${hasEvent && !isToday ? "bg-green-50 font-semibold text-green-700" : ""}`}
            >
                <span>{day}</span>
                {hasEvent && <span className="text-xs mt-0.5">●</span>}
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">{days}</div>
        </div>
    )
}

// ===== Stat Card =====
interface StatCardProps {
    title: string
    value: string | number
    change: string | number
    icon: React.ComponentType<any>
    trend: "up" | "down"
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, trend }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-blue-50">
                    <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {change}%
                </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    )
}

// ===== Main Dashboard Layout =====
export default function AdminDashboard() {
    return (
        <div className="h-screen bg-gray-50 overflow-y-auto p-8 pb-10">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-8 animate-fadeIn">
                    <p className="text-sm text-gray-600 font-medium">Hi Admin,</p>
                    <h1 className="text-4xl font-bold text-gray-800">Welcome to Echo!</h1>
                    <p className="text-gray-500 mt-1">Friday, November 7, 2025</p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Column */}
                    <div className="xl:col-span-8 space-y-8">
                        {/* Stat Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard title="Total Calls Today" value="774" change="12.5" icon={Phone} trend="up" />
                            <StatCard title="Active Agents" value="28" change="8.3" icon={Users} trend="up" />
                            <StatCard title="Avg Response Time" value="32s" change="15.2" icon={Clock} trend="down" />
                        </div>

                        {/* Call Volume Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Call Volume</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={callVolumeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="time" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                                    <Line type="monotone" dataKey="answered" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                                    <Line type="monotone" dataKey="missed" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444" }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Weekly + Call Status */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Overview</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={weeklyCallData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="day" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="calls" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Call Status</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={callStatusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={90}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={(entry: any) => {
                                                const name = entry?.name ?? ''
                                                const pct = typeof entry?.percent === 'number' ? entry.percent : 0
                                                return `${name} ${Math.round(pct * 100)}%`
                                            }}
                                        >
                                            {callStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="xl:col-span-4 space-y-8">
                        <CalendarComponent />

                        {/* Top Agents */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Agents</h3>
                            <div className="space-y-4">
                                {agentPerformance.map((agent, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                                                {agent.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{agent.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {agent.calls} calls • {agent.avgTime}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            <span className="text-lg">★</span>
                                            <span className="font-semibold">{agent.satisfaction}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
