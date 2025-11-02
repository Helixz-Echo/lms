"use client";

import Link from "next/link";
import React from "react";

const trainingSessions = [
    {
        id: 1,
        title: "Training Session 1",
        bgColor: "bg-gradient-to-br from-cyan-300 to-blue-300",
        image:
            "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    },
    {
        id: 2,
        title: "Training Session 2",
        bgColor: "bg-gradient-to-br from-purple-700 to-purple-900",
        image:
            "https://media.istockphoto.com/id/1331493599/photo/shot-of-a-businessman-using-a-computer-while-working-in-a-call-center.jpg?s=612x612&w=0&k=20&c=ocaFzVRnDARFnANjyd6CMrwAI0Ua6I0Na_MKej8IysA=",
    },
    {
        id: 3,
        title: "Training Session 3",
        bgColor: "bg-gradient-to-br from-pink-400 via-purple-500 to-purple-700",
        image:
            "https://media.istockphoto.com/id/2226940248/photo/call-center-senior-manager-providing-guidance-to-intern-on-how-to-use-ai-chatbot.webp?a=1&b=1&s=612x612&w=0&k=20&c=gBIY7EE0aXbdynhsARjykLnCJGl-RbA3T388h6tCq0Q=",
    },
    {
        id: 4,
        title: "Training Session 4",
        bgColor: "bg-gradient-to-br from-blue-900 to-indigo-900",
        image:
            "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=60&w=600",
    },
    {
        id: 5,
        title: "Training Session 5",
        bgColor: "bg-gradient-to-br from-gray-900 to-black",
        image:
            "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?auto=format&fit=crop&q=60&w=600",
    },
    {
        id: 6,
        title: "Training Session 6",
        bgColor: "bg-gradient-to-br from-red-900 to-blue-900",
        image:
            "https://media.istockphoto.com/id/1485983799/photo/crm-call-center-and-telemarketing-or-about-us-team-during-training-or-coaching-with-manager.webp?a=1&b=1&s=612x612&w=0&k=20&c=gYoCTvSoj4j9hlVnfsjUaxvMbjeI7DiVzRfPQHaUXak=",
    },
];

export default function TrainingGrid() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {trainingSessions.map((session, index) => (
                <Link key={session.id} href={`/training/${session.id}`} className="block">
                    <div
                        className={`cursor-pointer bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transform transition-all duration-500 hover:shadow-lg hover:-translate-y-2 hover:scale-105
                        opacity-0 animate-fadeIn`}
                        style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                    >
                        {/* Image Section */}
                        <div
                            className={`relative h-48 ${session.bgColor} overflow-hidden flex items-center justify-center transition-transform duration-500 hover:scale-110`}
                        >
                            <img
                                src={session.image || "/placeholder.svg"}
                                alt={session.title}
                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            />
                        </div>

                        <div className="p-4">
                            <h3 className="text-gray-900 font-semibold text-center text-lg transition-all duration-500 transform hover:scale-105 animate-slideUp">
                                {session.title}
                            </h3>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
