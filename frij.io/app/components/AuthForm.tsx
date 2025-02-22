"use client";

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { registerWithEmail, loginWithEmail, signInWithGoogle } from "../firebase/auth";
import { getUser } from "../firebase/firestore";

const AuthForm = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    let loggedInUser = null;
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

  // 🔥 Check user in Firestore and redirect accordingly
  const checkUserAndRedirect = async (userId: string) => {
    const userData = await getUser(userId);
    if (userData && userData.fridgeId) {
      router.push(`/fridge/${userData.fridgeId}`);
    } else {
      router.push("/create-fridge");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <form onSubmit={handleAuth} className="space-y-4">
        <h2 className="text-2xl font-bold text-center">
          {isRegistering ? "Register" : "Login"}
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
          {isRegistering ? "Register" : "Login"}
        </button>

        <p
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-blue-500 text-center cursor-pointer"
        >
          {isRegistering ? "Already have an account? Login" : "Need an account? Register"}
        </p>

        <div className="text-center">or</div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="bg-gray-800 text-white px-4 py-2 rounded w-full"
        >
          Sign in with Google
        </button>
      </form>
    </div>
  );
};

export default AuthForm;
