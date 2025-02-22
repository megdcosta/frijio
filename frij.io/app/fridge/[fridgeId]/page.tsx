"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { logout } from "@/app/firebase/auth";
import { useEffect, useState } from "react";
import { db } from "@/app/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const FridgePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams(); // ✅ FIX: Use useParams() instead of accessing params directly
  const fridgeId = params.fridgeId as string; // ✅ Get fridgeId as a string
  const [fridge, setFridge] = useState<any>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    const fetchFridge = async () => {
      if (!fridgeId) return;
      const fridgeRef = doc(db, "fridges", fridgeId);
      const fridgeSnap = await getDoc(fridgeRef);

      if (fridgeSnap.exists()) {
        setFridge(fridgeSnap.data());
      } else {
        router.push("/create-fridge"); // If fridge doesn't exist, create one
      }
    };

    fetchFridge();
  }, [user, loading, fridgeId, router]);

  if (!fridge) return <p>Loading fridge data...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold">{fridge.name}</h1>
      <p className="text-lg">Fridge ID: {fridgeId}</p>
      <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded mt-4">
        Logout
      </button>
    </div>
  );
};

export default FridgePage;
