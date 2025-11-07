"use client";

import Link from 'next/link';
import Image from 'next/image';
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
  image?: string; // allow sessions to provide an image URL
}

// Predefined calling center images
const defaultImages = [
  // Use reliable direct image URLs (Unsplash) to avoid landing pages or blocked links
  "https://images.unsplash.com/photo-1525186402429-1f38d5c6f7a1?auto=format&fit=crop&w=1080&q=80",
  "https://images.unsplash.com/photo-1560264280-8a9f758ab1f3?auto=format&fit=crop&w=1080&q=80",
  "https://images.unsplash.com/photo-1581092795362-82e3f3042e5d?auto=format&fit=crop&w=1080&q=80",
];

export default function TrainingGrid() {
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  // store per-session fallback src (e.g. local placeholder) when external load fails
  const [fallbacks, setFallbacks] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions');
        if (!response.ok) {
          console.error('Failed to fetch sessions', response.status);
          return;
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
          console.error('Sessions API returned unexpected data', data);
          return;
        }

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
    return (
      <div className="p-4 text-center text-gray-500">No training sessions available.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {trainingSessions.map((session, index) => {
        const imgSrc = fallbacks[session.id] ?? session.image;

        return (
          <div
            key={session.id}
            className={`cursor-pointer bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transform transition-all duration-500 hover:shadow-lg hover:-translate-y-2 hover:scale-105 opacity-0 animate-fadeIn`}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest('a')) {
                router.push(`/dashboard/trainer?view=assessment&session_id=${session.id}`);
              }
            }}
          >
            {/* Image Section */}
            <div className={`relative h-48 ${session.bgColor} overflow-hidden flex items-center justify-center transition-transform duration-500 hover:scale-110`}>
              <Image
                src={imgSrc}
                alt={session.session_name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 hover:scale-110"
                onError={() => {
                  setFallbacks((prev) => ({ ...prev, [session.id]: '/Bg.png' }));
                }}
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
        );
      })}
    </div>
  );
}
