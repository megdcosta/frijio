"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { registerWithEmail, loginWithEmail, signInWithGoogle, logout } from "../firebase/auth";
import { getUser } from "../firebase/firestore";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [fridgeData, setFridgeData] = useState<any>(null);

  // After login, fetch the user's fridge info.
  const checkUserAndRedirect = async (userId: string) => {
    router.push("/select-fridge");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    let loggedInUser;
    if (isRegistering) {
      loggedInUser = await registerWithEmail(email, password);
    } else {
      loggedInUser = await loginWithEmail(email, password);
    }
    if (loggedInUser) {
      checkUserAndRedirect(loggedInUser.uid);
    }
  };

  const handleGoogleLogin = async () => {
    const loggedInUser = await signInWithGoogle();
    if (loggedInUser) {
      checkUserAndRedirect(loggedInUser.uid);
    }
  };

  // If the user is already logged in but fridgeData hasn't been fetched, get it.
  useEffect(() => {
    if (user && !fridgeData) {
      (async () => {
        const userData = await getUser(user.uid);
        if (userData && userData.fridgeId) {
          setFridgeData(userData);
        }
      })();
    }
  }, [user, fridgeData]);

  if (loading) return <p>Loading...</p>;

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#3D4E52] text-[#F1EFD8]">
        <h1 className="text-2xl mb-4">
          Welcome, {user.email || user.displayName}!
        </h1>
        {fridgeData ? (
          <p className="mb-4">Your fridge: {fridgeData.fridgeId}</p>
        ) : (
          <p className="mb-4">Loading your fridge info...</p>
        )}
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
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4 font-sans">
      <div className="bg-background relative w-full max-w-5xl h-[600px] flex rounded-3xl overflow-hidden shadow-xl">
        {!isRegistering && (
          <>
            <div className="flex-1 text-white flex flex-col items-center justify-center p-10 text-center">
              <h2 className="text-4xl font-bold mb-4 font-playpen">
                Hello, Friend!
              </h2>
              <p className="mb-8 font-semibold text-lg">Join us and take control of your fridge!</p>
              <button
                onClick={() => setIsRegistering(true)}
                className="border-2 border-white px-6 py-2 rounded-full font-semibold hover:bg-white hover:text-[#5E7A80] transition"
              >
                Sign Up
              </button>
            </div>
            <div className="flex-1 bg-white text-text flex flex-col items-center rounded-3xl justify-center p-10 text-center">
              <h1 className="text-5xl font-bold mb-2 font-playpen">frij.io</h1>
              <h2 className="text-xl mb-6 mt-1 font-semibold">Welcome to frij.io</h2>
              <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-full indent-2"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-full indent-2"
                />
                <button
                  type="submit"
                  className="w-full bg-[#473C38] text-[#F1EFD8] py-2 rounded-full text-lg font-semibold hover:bg-[#5A4C47]"
                >
                  Log In
                </button>
                <p className="text-sm underline cursor-pointer">
                  Forgot your password?
                </p>
                <div className="mt-4">
                  <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-full"
                  >
                    Sign in with Google
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {isRegistering && (
          <>
            <div className="flex-1 bg-[#F1EFD8] text-[#473C38] flex flex-col items-center rounded-3xl justify-center p-10 text-center">
              <h1 className="text-5xl font-bold mb-2 font-playpen">frij.io</h1>
              <h2 className="text-xl mb-6 mt-1 font-semibold">Create Account</h2>
              <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-full indent-2"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-full indent-2"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border border-gray-300 rounded-full indent-2"
                />
                <button
                  type="submit"
                  className="w-full bg-[#473C38] text-[#F1EFD8] py-2 rounded-full text-lg font-semibold hover:bg-[#5A4C47]"
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-full"
                >
                  <span>Continue with Google</span>
                </button>
              </form>
            </div>
            <div className="flex-1 bg-[#5E7A80] text-[#F1EFD8] flex flex-col items-center justify-center p-10 text-center">
              <h2 className="text-3xl font-bold mb-2 font-playpen after:content-[':)']">
                Welcome Back
              </h2>
              <p className="mb-8 font-semibold text-lg">Let us track your fridge!</p>
              <button
                onClick={() => setIsRegistering(false)}
                className="border-2 border-[#F1EFD8] px-6 py-2 rounded-full font-semibold hover:bg-white hover:text-[#5E7A80] transition"
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