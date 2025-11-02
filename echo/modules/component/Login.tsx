"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
    redirectTo?: string; // e.g. "/dashboard"
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

            router.push(redirectTo);
            router.refresh();
        } catch (err: any) {
            setError(err?.message ?? "Something went wrong.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-md rounded-2xl border border-[#B7BCC9] bg-white p-6 shadow-[0_0_11px_0_rgba(128,139,157,0.15)] sm:p-8">
            <div className="mb-6 text-center">
                <h1 className="font-['IBM_Plex_Mono'] text-2xl font-bold text-[#3D2D4C] sm:text-3xl">
                    Welcome to Soft GPT
                </h1>
                <p className="mt-2 font-['Roboto'] text-sm text-[#3D2D4C] opacity-70">
                    Sign in to continue to your AI assistant
                </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="mb-2 block font-['Roboto'] text-sm font-medium text-[#3D2D4C]">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-[#B7BCC9] px-4 py-3 font-['Roboto'] text-[#3D2D4C] outline-none transition-colors focus:border-[#7B93DB] focus:ring-2 focus:ring-[#7B93DB] focus:ring-opacity-20"
                        autoComplete="email"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password" className="mb-2 block font-['Roboto'] text-sm font-medium text-[#3D2D4C]">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPw ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-[#B7BCC9] px-4 py-3 pr-16 font-['Roboto'] text-[#3D2D4C] outline-none transition-colors focus:border-[#7B93DB] focus:ring-2 focus:ring-[#7B93DB] focus:ring-opacity-20"
                            autoComplete="current-password"
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 font-['Roboto'] text-xs text-[#3D2D4C] opacity-70 transition-colors hover:bg-gray-100 hover:opacity-100"
                            aria-label={showPw ? "Hide password" : "Show password"}
                        >
                            {showPw ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-['Roboto'] text-sm text-red-700"
                        role="alert"
                        aria-live="polite"
                    >
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7B93DB] to-[#9DB3E6] px-4 py-3 font-['Roboto'] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Signing in…" : "Sign in"}
                </button>

                <div className="text-center font-['Roboto'] text-xs text-[#3D2D4C] opacity-60">
                    Demo: admin@example.com / password123
                </div>

                <div className="text-center font-['Roboto'] text-xs text-[#3D2D4C] opacity-50">
                    By continuing, you agree to our Terms & Privacy.
                </div>
            </form>
        </div>
    );
}