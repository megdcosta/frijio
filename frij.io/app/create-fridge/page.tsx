"use client";

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { createFridge, assignFridgeToUser } from "../firebase/firestore";
import { useRouter } from "next/navigation";
import { logout } from "../firebase/auth";

const CreateFridge = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [fridgeName, setFridgeName] = useState("");

  const handleCreateFridge = async () => {
    if (!user || fridgeName.trim() === "") return;
    const fridgeId = await createFridge(fridgeName, user.uid);
    await assignFridgeToUser(user.uid, fridgeId);
    router.push(`/fridge/${fridgeId}`); // Redirect to new fridge
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Create Your Fridge</h1>
      <input
        type="text"
        placeholder="Fridge Name"
        value={fridgeName}
        onChange={(e) => setFridgeName(e.target.value)}
        className="w-64 p-2 border border-gray-300 rounded mb-4"
      />
      <button
        onClick={handleCreateFridge}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Create Fridge
      </button>
      <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded mt-4">
        Logout
      </button>
    </div>
  );
};

export default CreateFridge;
