"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import bg from './Bg.png';
const bgUrl = typeof bg === 'string' ? bg : bg.src;

type Props = {
    redirectTo?: string;
};

export default function Login({ redirectTo = "/" }: Props) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (!email || !password) {
            setError("Please fill in both fields.");
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setIsSubmitting(true);

            const trainerEmail = "trainer@example.com";
            const trainerPassword = "trainer123";

            const adminEmail = "admin@example.com";
            const adminPassword = "admin123";

            if (email === trainerEmail && password === trainerPassword) {
                router.push("/dashboard/trainer");
                router.refresh();
                return;
            } else if (email === adminEmail && password === adminPassword) {
                router.push("/dashboard/admin");
                router.refresh();
                return;
            }

            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || "Login failed. Check your credentials.");
            }

            const data = await res.json();
            const destination = redirectTo || (data.role === "admin" ? "/dashboard/admin" : "/dashboard/trainer");
            router.push(destination);
            router.refresh();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-4"
            style={{
                backgroundImage: `url(${bgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Overlay for better contrast */}
            <div className="absolute inset-0 bg-black/20"></div>

            {/* Login Card */}
            <div className="relative z-10 mx-auto w-full max-w-md">
                <div className="rounded-3xl border border-white/20 bg-white/95 backdrop-blur-xl p-8 shadow-2xl">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Welcome to Helixz Echo
                        </h1>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder=""
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPw ? "text" : "password"}
                                    placeholder=""
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-20 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                    autoComplete="current-password"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                                    aria-label={showPw ? "Hide password" : "Show password"}
                                >
                                    {showPw ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                role="alert"
                                aria-live="polite"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                                    Signing in…
                                </div>
                            ) : (
                                "Sign in"
                            )}
                        </button>

                        <div className="space-y-2 pt-2">
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
                                <p className="text-xs font-medium text-blue-900 mb-1">Demo Accounts:</p>
                                <p className="text-xs text-blue-700">
                                    admin@example.com / admin123
                                </p>
                                <p className="text-xs text-blue-700">
                                    trainer@example.com / trainer123
                                </p>
                            </div>
                        </div>

                        <div className="text-center text-xs text-gray-500">
                            By continuing, you agree to our Terms & Conditions.
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}