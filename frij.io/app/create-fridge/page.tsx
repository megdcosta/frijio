"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { createFridge, assignFridgeToUser } from "../firebase/firestore"
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function CreateFridgePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fridgeName, setFridgeName] = useState("");
  const [fridges, setFridges] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchFridges = async () => {
      const querySnapshot = await getDocs(collection(db, "fridges"));
      const allFridges = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFridges(allFridges);
    };
    fetchFridges();
  }, [user]);

  const handleCreateFridge = async () => {
    if (!user || fridgeName.trim() === "") return;
    const fridgeId = await createFridge(fridgeName, user.uid);
    await assignFridgeToUser(user.uid, fridgeId);
    router.push(`/fridge/${fridgeId}`); // Redirect to new fridge
  };

  const joinFridge = async (fridgeId: string) => {
    if (!user) return;
    await assignFridgeToUser(user.uid, fridgeId);
    router.push(`/fridge/${fridgeId}`); // Redirect to selected fridge
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Manage Your Fridge</h1>
      
      {/* Create New Fridge Section */}
      <div className="bg-white p-6 rounded shadow-lg mb-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create a New Fridge</h2>
        <input
          type="text"
          placeholder="Fridge Name"
          value={fridgeName}
          onChange={(e) => setFridgeName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-2"
        />
        <button
          onClick={handleCreateFridge}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
          Create Fridge
        </button>
      </div>

      {/* Join Existing Fridge Section */}
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Join an Existing Fridge</h2>
        {fridges.length === 0 ? (
          <p>No available fridges yet.</p>
        ) : (
          <ul className="space-y-2">
            {fridges.map((fridge) => (
              <li key={fridge.id} className="flex justify-between items-center p-2 border rounded">
                <span>{fridge.name}</span>
                <button
                  onClick={() => joinFridge(fridge.id)}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  Join
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
