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
        <div className="mx-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
                <p className="mt-1 text-sm text-gray-600">Sign in to continue</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900"
                        autoComplete="email"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            type={showPw ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 pr-16 text-gray-900 outline-none focus:border-gray-900"
                            autoComplete="current-password"
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPw((s) => !s)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                            aria-label={showPw ? "Hide password" : "Show password"}
                        >
                            {showPw ? "Hide" : "Show"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                        role="alert"
                        aria-live="polite"
                    >
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center rounded-xl bg-black px-4 py-2.5 font-medium text-white transition disabled:opacity-60"
                >
                    {isSubmitting ? "Signing in…" : "Sign in"}
                </button>

                <div className="text-center text-xs text-gray-500">
                    By continuing, you agree to our Terms & Privacy.
                </div>
            </form>
        </div>
    );
}
