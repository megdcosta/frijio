"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { logout } from "@/app/firebase/auth";
import { useEffect, useState } from "react";
import { db } from "@/app/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Overview from "./Overview";
import GroceryList from "./GroceryList";
import Expense from "./Expense";

const FridgePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const fridgeId = params.fridgeId as string;
  const [fridge, setFridge] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "grocery" | "expense"
  >("overview");

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
        setFridge({ id: fridgeSnap.id, ...fridgeSnap.data() });
      } else {
        router.push("/create-fridge");
      }
    };

    fetchFridge();
  }, [user, loading, fridgeId, router]);

  if (!fridge) return <p>Loading fridge data...</p>;

  return (
    <div className="min-h-screen bg-background text-[#F1EFD8] p-4 font-sans">
      <header className="flex justify-between items-center p-6 pb-6 px-4 py-2">
        <div
          className="text-2xl font-bold font-playpen cursor-pointer"
          onClick={() => router.push("/")}
        >
          frij.io
        </div>
        <button
          onClick={logout}
          className="bg-green-500 text-white rounded px-4 py-2"
        >
          Logout
        </button>
      </header>

      {/* Fridge title and ID above buttons */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold font-playpen">{fridge.name}</h1>
        <p className="mt-2 text-sm text-gray-400">Fridge ID: {fridgeId}</p>
      </div>

      {/* Centered buttons */}
      <div className="flex justify-center px-2 font-semibold">
        <button
          className={`m-4 py-2 px-12 w-fit text-center rounded-full text-white font-semibold hover:bg-[#4a5f64] transition ${
            activeTab === "overview" ? "bg-[#2d3c40]" : "bg-[#3d4e52]"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Fridge Overview
        </button>
        <button
          className={`m-4 py-2 px-12 w-fit text-center rounded-full text-white font-semibold hover:bg-[#4a5f64] transition ${
            activeTab === "grocery" ? "bg-[#2d3c40]" : "bg-[#3d4e52]"
          }`}
          onClick={() => setActiveTab("grocery")}
        >
          Grocery List
        </button>
        <button
          className={`m-4 py-2 px-12 w-fit text-center rounded-full text-white font-semibold hover:bg-[#4a5f64] transition ${
            activeTab === "expense" ? "bg-[#2d3c40]" : "bg-[#3d4e52]"
          }`}
          onClick={() => setActiveTab("expense")}
        >
          Expense
        </button>
      </div>

      <div className="p-5">
        {activeTab === "overview" && <Overview fridgeId={fridgeId} />}
        {activeTab === "grocery" && <GroceryList fridgeId={fridgeId} />}
        {activeTab === "expense" && <Expense fridgeId={fridgeId} />}
      </div>
    </div>
  );
};

export default FridgePage;
