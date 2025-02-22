"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#3D4E52] text-[#F1EFD8] p-6">
      <h1 className="text-4xl font-bold mb-4">Welcome to Frij.io</h1>
      <p className="text-lg mb-6">Keep track of your fridge, reduce waste, and manage groceries with ease.</p>
      <button
        onClick={() => router.push("/login")}
        className="bg-blue-500 text-white px-6 py-3 rounded-full text-lg font-semibold hover:bg-blue-600 transition"
      >
        Get Started
      </button>
    </div>
  );
}
