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

interface SessionDto {
  id?: string;
  session_name?: string;
  name?: string;
  score?: number | string;
  image?: string;
}

// Predefined calling center images
const defaultImages = [
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
  "https://media.istockphoto.com/id/1331493599/photo/shot-of-a-businessman-using-a-computer-while-working-in-a-call-center.jpg?s=612x612&w=0&k=20&c=ocaFzVRnDARFnANjyd6CMrwAI0Ua6I0Na_MKej8IysA=",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=60&w=600"
];

export default function TrainingGrid() {
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions');
        if (!response.ok) return;
        const data = await response.json();

        const sessionsWithImages: TrainingSession[] = data.map((session: SessionDto, index: number) => ({
          id: session.id ?? `session-${index}`,
          session_name: session.session_name ?? session.name ?? `Session ${index + 1}`,
          score: typeof session.score === 'number' ? session.score : (session.score ? Number(session.score) : 0),
          image: session.image?.trim() ? session.image : defaultImages[index % defaultImages.length],
          bgColor: 'bg-gray-200',
        }));

        setTrainingSessions(sessionsWithImages);
      } catch (err) {
        console.error('Error fetching sessions', err);
      }
    };

    fetchSessions();
  }, []);

  if (trainingSessions.length === 0) {
    return <div className="p-4 text-center text-gray-500">No training sessions available.</div>;
  }

  return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {trainingSessions.map((session, index) => (
            <div
                key={session.id}
                className={`cursor-pointer bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transform transition-all duration-500 hover:shadow-lg hover:-translate-y-2 hover:scale-105 opacity-0 animate-fadeIn`}
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                onClick={() => router.push(`/dashboard/trainer?view=assessment&session_id=${session.id}`)}
            >
              {/* Image Section */}
              <div className={`relative h-48 ${session.bgColor} overflow-hidden flex items-center justify-center transition-transform duration-500 hover:scale-110`}>
                <img
                    src={session.image}
                    alt={session.session_name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    onError={(e) => (e.currentTarget.src = defaultImages[0])}
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
