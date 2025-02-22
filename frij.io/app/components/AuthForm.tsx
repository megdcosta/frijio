"use client";

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { registerWithEmail, loginWithEmail, signInWithGoogle, logout } from "../firebase/auth";

const AuthForm = () => {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      await registerWithEmail(email, password);
    } else {
      await loginWithEmail(email, password);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      {user ? (
        <div className="text-center">
          <p className="text-lg font-semibold">Welcome, {user.email || user.displayName}!</p>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded mt-4 w-full"
          >
            Logout
          </button>
        </div>
      ) : (
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
            onClick={signInWithGoogle}
            type="button"
            className="bg-gray-800 text-white px-4 py-2 rounded w-full"
          >
            Sign in with Google
          </button>
        </form>
      )}
    </div>
  );
};

export default AuthForm;
