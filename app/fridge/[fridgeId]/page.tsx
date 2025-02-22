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
    <div className="min-h-screen bg-background text-[#F1EFD8] p-4">
      <header className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold font-playpen">frij.io</div>
      </header>
      <div className="flex border-b">
        <button className="p-2 font-bold">{fridge.name}</button>
        <button
          className={`py-2 px-4 w-full text-center ${
            activeTab === "overview"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`py-2 px-4 w-full text-center ${
            activeTab === "grocery"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("grocery")}
        >
          Grocery
        </button>
        <button
          className={`py-2 px-4 w-full text-center ${
            activeTab === "expense"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500"
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

      <div className="mt-4 text-center">
        <p className="text-lg">Fridge ID: {fridgeId}</p>
        <button
          onClick={logout}
          className="bg-green-500 text-white px-4 py-2 rounded mt-4"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default FridgePage;
