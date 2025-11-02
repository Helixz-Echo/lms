import { NextRequest, NextResponse } from "next/server";
import Sidebar from "@/modules/component/Dashboard/trainer/sidebar";
import {redirect} from "next/navigation";

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

        const trainerEmail = "trainer@example.com";
        const trainerPassword = "trainer123";

        const adminEmail = "admin@example.com";
        const adminPassword = "admin123";

        let user = null;

        if (email === adminEmail && password === adminPassword) {
            user = { email, name: "Admin User", role: "admin" };
        } else if (email === trainerEmail && password === trainerPassword) {
            user = { email, name: "Trainer User", role: "trainer" };
        }

        if (!user) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        const response = NextResponse.json(
            { message: "Login successful", user },
            { status: 200 }
        );

        // Set a simple auth cookie (in production, use proper session management)
        response.cookies.set("auth", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/"
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}