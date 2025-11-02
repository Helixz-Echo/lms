import { BookOpen, Target } from "lucide-react"

export default function StatCards() {
    const stats = [
        {
            icon: BookOpen,
            label: "Session Completed",
            value: "4",
            trend: "+25 min in last 7 days",
            trendColor: "text-black-500",
        },
        {
            icon: Target,
            label: "Accuracy",
            value: "11.3%",
            trend: "+5.26% in last 7 days",
            trendColor: "text-black-500",
        },
    ]

    return (
        <div className="grid grid-cols-2 gap-6 mb-8">
            {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <div
                        key={index}
                        className={`rounded-lg p-6 shadow-md transform transition-all duration-500 hover:scale-105 hover:shadow-xl opacity-0 animate-fadeInUp`}
                        style={{
                            background: "linear-gradient(135deg, #7B93DB 0%, #9DB3E8 100%)",
                            animationDelay: `${index * 150}ms`,
                            animationFillMode: "forwards",
                        }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <Icon
                                className="w-6 h-6 text-white transition-transform duration-500 hover:scale-110"
                            />
                        </div>
                        <p className="text-white text-sm mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-white mb-3 transition-transform duration-500 hover:scale-105">
                            {stat.value}
                        </h3>
                        <p className={`text-xs ${stat.trendColor} animate-pulse`}>{stat.trend}</p>
                    </div>
                )
            })}
        </div>
    )
}
