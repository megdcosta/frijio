"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { getUser, assignFridgeToUser } from "../firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export default function FridgeList() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fridges, setFridges] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchFridges = async () => {
      const querySnapshot = await getDocs(collection(db, "fridges"));
      const fridgeList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFridges(fridgeList);
    };
    fetchFridges();
  }, [user]);

  const joinFridge = async (fridgeId: string) => {
    setError("");
    if (!user) return;
    try {
      await assignFridgeToUser(user.uid, fridgeId);
      router.push(`/fridge/${fridgeId}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
      <h2 className="text-xl font-semibold mb-4">Join a Fridge</h2>
      {error && <p className="text-red-500">{error}</p>}
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
    </div>
  );
}
