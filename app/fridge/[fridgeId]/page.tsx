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
  const params = useParams(); // ✅ FIX: Use useParams() instead of accessing params directly
  const fridgeId = params.fridgeId as string; // ✅ Get fridgeId as a string
  const [fridge, setFridge] = useState<any>(null);
  // const [activeTab, setActiveTab] = useState<"overview" | "grocery" | "expenses">("overview");
  const [activeTab, setActiveTab] = useState("overview");


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
    <div className="min-h-screen bg-background text-[#F1EFD8] p-4">
      <header className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold font-playpen">frij.io</div>
      </header>
      <div className="flex border-b">
        <button>{fridge.name}</button>
          <button
            className={`py-2 px-4 w-full text-center ${activeTab === 'Overview' ? 'border-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('Overview')}
          >
            Tab 1
          </button>
          <button
            className={`py-2 px-4 w-full text-center ${activeTab === 'Grocery' ? 'border-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('Grocery')}
          >
            Tab 2
          </button>
          <button
            className={`py-2 px-4 w-full text-center ${activeTab === 'Expense' ? 'border-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('Expense')}
          >
            Tab 3
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === 'Overview' && <Overview />}
          {activeTab === 'Grocery' && <GroceryList />}
          {activeTab === 'Expense' && <Expense />}
        </div>
      
      <p className="text-lg">Fridge ID: {fridgeId}</p>
      <button onClick={logout} className="bg-green text-white px-4 py-2 rounded mt-4">
        Logout
      </button>
    </div>
  );
};

export default FridgePage;
