"use client";

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TrainingSession {
  id: string;
  session_name: string;
  score: number;
  image: string;
  bgColor: string;
}

export default function TrainingGrid() {
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      const sessionsWithImages = data.map((session: any, index: number) => ({
        ...session,
        image: trainingSessions[index]?.image || '/placeholder.svg',
        bgColor: trainingSessions[index]?.bgColor || 'bg-gray-200',
      }));
      setTrainingSessions(sessionsWithImages);
    };

    fetchSessions();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {trainingSessions.map((session, index) => (
        <div
          key={session.id}
          className={`cursor-pointer bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transform transition-all duration-500 hover:shadow-lg hover:-translate-y-2 hover:scale-105
                      opacity-0 animate-fadeIn`}
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
          onClick={(e) => {
            // Only navigate to chat if not clicking the assessment button
            if (!(e.target as HTMLElement).closest('a')) {
              router.push(`/chat?session_id=${session.id}`);
            }
          }}
        >
            {/* Image Section */}
            <div
              className={`relative h-48 ${session.bgColor} overflow-hidden flex items-center justify-center transition-transform duration-500 hover:scale-110`}
            >
              <img
                src={session.image || '/placeholder.svg'}
                alt={session.session_name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>

            <div className="p-4">
              <h3 className="text-gray-900 font-semibold text-center text-lg transition-all duration-500 transform hover:scale-105 animate-slideUp">
                {session.session_name}
              </h3>
              <div className="text-center mt-2">
                <p className="text-gray-600">Score: {session.score}%</p>
              </div>
              <div className="text-center mt-4">
                <Link href={`/dashboard/trainer?view=assessment&session_id=${session.id}`} className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Start Assessment
                </Link>
              </div>
            </div>
          </div>
      ))}
    </div>
  );
}
