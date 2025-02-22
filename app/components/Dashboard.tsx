"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { logout } from "../firebase/auth";
import Overview from "./Overview";
import GroceryList from "./GroceryList";
import Expenses from "./Expenses";

export default function Dashboard({ fridge }: { fridge: any }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Local state to track which tab is active
  const [activeTab, setActiveTab] = useState<"overview" | "grocery" | "expenses">("overview");

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) return <p>Loading...</p>;
  if (!fridge) return <p>No fridge found.</p>;

  return (
    <div className="min-h-screen bg-[#3D4E52] text-[#F1EFD8] px-12 py-6 mx-auto w-full max-w-[1200px]">
      {/* Header */}
      <header className="flex justify-between items-center w-full mb-6">
        <h1 className="text-3xl font-bold">frij.io</h1>
        
        <button 
          onClick={logout} 
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div className="flex gap-12">
        {/* Fridge Image Section */}
        <div className="w-[320px] flex-shrink-0">
          <img
            src="/tempfridge.png"
            alt="Fridge"
            width="320"
            height="550"
            className="rounded-lg"
          />
        </div>

        {/* Right Section - Content */}
        <div className="flex-1">
          {/* Fridge Info */}
          <div className="bg-white text-black p-4 rounded-lg shadow-lg text-center mb-6">
            <h2 className="text-2xl font-bold">{fridge.name}</h2>
            <p className="text-lg text-gray-600">Fridge ID: {fridge.id}</p>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-4 mb-6">
            <button
              className={`bg-[#1F2A30] px-4 py-2 rounded ${activeTab === "overview" ? "bg-[#263238]" : ""}`}
              onClick={() => {
                console.log("Clicked Fridge Overview");
                setActiveTab("overview");
              }}
            >
              Fridge Overview
            </button>

            <button
              className={`bg-[#1F2A30] px-4 py-2 rounded ${activeTab === "grocery" ? "bg-[#263238]" : ""}`}
              onClick={() => {
                console.log("Clicked Grocery List");
                setActiveTab("grocery");
              }}
            >
              Grocery List
            </button>

            <button
              className={`bg-[#1F2A30] px-4 py-2 rounded ${activeTab === "expenses" ? "bg-[#263238]" : ""}`}
              onClick={() => {
                console.log("Clicked Expenses");
                setActiveTab("expenses");
              }}
            >
              Expenses
            </button>
          </nav>

          {/* Conditionally Render the Active Component */}
          <div className="mt-4">
            {activeTab === "overview" && <Overview fridgeId={fridge.id} />}
            {activeTab === "grocery" && <GroceryList fridgeId={fridge.id} />}
            {activeTab === "expenses" && <Expenses fridgeId={fridge.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
