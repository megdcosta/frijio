"use client";

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  registerWithEmail,
  loginWithEmail,
  signInWithGoogle,
  logout,
} from "../firebase/auth";

export default function AuthPage() {
  const { user, loading } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      await registerWithEmail(email, password);
    } else {
      await loginWithEmail(email, password);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#3D4E52]">
        <p className="text-[#F1EFD8] text-xl">Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#3D4E52] text-[#F1EFD8]">
        <h1 className="text-2xl mb-4">
          Welcome, {user.email || user.displayName}!
        </h1>
        <button
          onClick={logout}
          className="px-6 py-2 bg-red-500 rounded text-[#F1EFD8]"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#3D4E52] px-4">
      <div className="bg-[#5E7A80] relative w-full max-w-5xl h-[600px] flex rounded-3xl overflow-hidden shadow-xl">
        {!isRegistering && (
          <>
            <div className="flex-1 text-[#F1EFD8] flex flex-col items-center justify-center p-10 text-center">
              <h2 className="text-3xl font-bold mb-4 font-playpen">
                Hello, Friend!
              </h2>
              <p className="mb-8">
                Create an account to start your journey with us
              </p>
              <button
                onClick={() => setIsRegistering(true)}
                className="border-2 border-[#F1EFD8] px-6 py-2 rounded-full hover:bg-white hover:text-[#5E7A80] transition"
              >
                Sign Up
              </button>
            </div>
            <div className="flex-1 bg-[#F1EFD8] text-[#473C38] flex flex-col items-center rounded-3xl justify-center p-10 text-center">
              <h1 className="text-4xl font-bold mb-2 font-playpen">frij.io</h1>
              <h2 className="text-xl mb-8">Welcome to frij.io</h2>
              <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <button
                  type="submit"
                  className="w-full bg-[#473C38] text-[#F1EFD8] py-2 rounded text-lg font-semibold hover:bg-[#5A4C47]"
                >
                  Log In
                </button>
                <p className="text-sm underline cursor-pointer">
                  Forgot your password?
                </p>
              </form>
            </div>
          </>
        )}

        {isRegistering && (
          <>
            <div className="flex-1 bg-[#F1EFD8] text-[#473C38] flex flex-col items-center rounded-3xl justify-center p-10 text-center">
              <h1 className="text-4xl font-bold mb-2 font-playpen">frij.io</h1>
              <h2 className="text-xl mb-8">Create Account</h2>
              <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
                <button
                  type="submit"
                  className="w-full bg-[#473C38] text-[#F1EFD8] py-2 rounded text-lg font-semibold hover:bg-[#5A4C47]"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="w-full bg-[#4285F4] hover:bg-[#357ae8] text-[#F1EFD8] py-2 rounded font-semibold flex items-center justify-center gap-2 mt-4"
                >
                  <span>Continue with Google</span>
                </button>
              </form>
            </div>
            <div className="flex-1 bg-[#5E7A80] text-[#F1EFD8] flex flex-col items-center justify-center p-10 text-center">
              <h2 className="text-3xl font-bold mb-2 font-playpen">
                Welcome Back
              </h2>
              <p className="mb-8">Let us track your fridge!</p>
              <button
                onClick={() => setIsRegistering(false)}
                className="border-2 border-[#F1EFD8] px-6 py-2 rounded-full hover:bg-white hover:text-[#5E7A80] transition"
              >
                Sign In
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
