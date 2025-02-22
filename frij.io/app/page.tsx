"use client";
import { useRedirect } from "../app/hooks/useRedirect";

export default function Home() {
  useRedirect(); // Automatically redirects user

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold">Welcome to Frij.io</h1>
      <p>Redirecting...</p>
    </div>
  );
}
