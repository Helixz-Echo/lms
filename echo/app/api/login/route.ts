import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Simple validation
        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required" },
                { status: 400 }
            );
        }

        // Simple hardcoded authentication for testing - replace with real authentication logic
        const validEmail = "admin@example.com";
        const validPassword = "password123";

        if (email === validEmail && password === validPassword) {
            // In a real app, you'd create a JWT or session here
            const response = NextResponse.json(
                { 
                    message: "Login successful",
                    user: { email: email, name: "Admin User" }
                },
                { status: 200 }
            );

            // Set a simple auth cookie (in production, use proper session management)
            response.cookies.set("auth", "true", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24, // 24 hours
                path: "/"
            });

            return response;
        } else {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}