"use client";
import AuthForm from "../components/AuthForm";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Login to Frij.io</h1>
      <AuthForm />
    </div>
  );
}
