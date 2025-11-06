import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Authentication - Echo LMS",
    description: "Sign in to access Echo LMS training platform",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-linear-to-br from-[#F0F7FB] to-[#E8F4F8]">
            {children}
        </div>
    );
}