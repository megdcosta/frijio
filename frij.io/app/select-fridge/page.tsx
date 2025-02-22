"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { createFridge, joinFridgeById, getUser } from "../firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export default function SelectFridgePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fridgeName, setFridgeName] = useState("");
  const [fridgeId, setFridgeId] = useState("");
  const [userFridges, setUserFridges] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchFridges = async () => {
      const userData = await getUser(user.uid);
      if (userData && userData.fridgeIds) {
        const userFridgeData = await Promise.all(
          userData.fridgeIds.map(async (fridgeId: string) => {
            const fridgeRef = doc(db, "fridges", fridgeId);
            const fridgeSnap = await getDoc(fridgeRef);
            return fridgeSnap.exists() ? { id: fridgeSnap.id, ...fridgeSnap.data() } : null;
          })
        );
        setUserFridges(userFridgeData.filter(Boolean));
      }
    };

    fetchFridges();
  }, [user]);

  const handleCreateFridge = async () => {
    setError("");
    if (!user || fridgeName.trim() === "") return;
    try {
      const fridgeId = await createFridge(fridgeName, user.uid);
      router.push(`/fridge/${fridgeId}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJoinFridge = async () => {
    setError("");
    if (!user || fridgeId.trim() === "") {
      setError("Please enter a valid Fridge ID.");
      return;
    }
    try {
      await joinFridgeById(user.uid, fridgeId);
      router.push(`/fridge/${fridgeId}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Select or Create a Fridge</h1>

      {error && <p className="text-red-500">{error}</p>}

      {/* If the user has fridges, allow them to select from a list */}
      {userFridges.length > 0 && (
        <div className="bg-white p-6 rounded shadow-lg mb-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Your Fridges</h2>
          <ul className="space-y-2">
            {userFridges.map((fridge) => (
              <li key={fridge.id} className="flex justify-between items-center p-2 border rounded">
                <span>{fridge.name}</span>
                <button
                  onClick={() => router.push(`/fridge/${fridge.id}`)}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  Enter
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Option to Join a Fridge by Entering an ID */}
      <div className="bg-white p-6 rounded shadow-lg mb-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Join Another Fridge</h2>
        <input
          type="text"
          placeholder="Enter Fridge ID"
          value={fridgeId}
          onChange={(e) => setFridgeId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-2"
        />
        <button
          onClick={handleJoinFridge}
          className="bg-yellow-500 text-white px-4 py-2 rounded w-full"
        >
          Join Fridge
        </button>
      </div>

      {/* Option to Create a New Fridge */}
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
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
    </div>
  );
}
