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
      <header className="flex justify-between items-center p-6 pb-4">
        <div className="text-2xl font-bold font-playpen">frij.io</div>
      </header>
      <div className="flex px-2 font-semibold">
        <button className="m-4 pr-8 text-xl w-fit font-bold">{fridge.name}</button>
        <button
          className={`m-4 py-2 px-12 w-fit text-center rounded-full text-white font-semibold hover:bg-[#4a5f64] transition ${
            activeTab === "overview"
              ? "bg-[#2d3c40]"
              : "bg-[#3d4e52]"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Fridge Overview
        </button>
        <button
          className={`m-4 py-2 px-12 w-fit text-center rounded-full text-white font-semibold hover:bg-[#4a5f64] transition ${
            activeTab === "grocery"
              ? "bg-[#2d3c40]"
              : "bg-[#3d4e52]"
          }`}
          onClick={() => setActiveTab("grocery")}
        >
          Grocery List
        </button>
        <button
          className={`m-4 py-2 px-12 w-fit text-center rounded-full text-white font-semibold hover:bg-[#4a5f64] transition ${
            activeTab === "expense"
              ? "bg-[#2d3c40]"
              : "bg-[#3d4e52]"
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
