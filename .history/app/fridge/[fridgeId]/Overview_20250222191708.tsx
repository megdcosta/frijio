"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

interface OverviewProps {
  fridgeId: string;
}

export default function Overview({ fridgeId }: OverviewProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fridgeData, setFridgeData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  // Form state
  const [itemName, setItemName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!fridgeId) return;

    const fetchFridge = async () => {
      try {
        const fridgeRef = doc(db, "fridges", fridgeId);
        const fridgeSnap = await getDoc(fridgeRef);
        if (fridgeSnap.exists()) {
          setFridgeData({ id: fridgeSnap.id, ...fridgeSnap.data() });
        } else {
          setError("Fridge not found.");
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    const fetchItems = async () => {
      try {
        const itemsRef = collection(db, "fridges", fridgeId, "items");
        const snapshot = await getDocs(itemsRef);
        const itemsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemsList);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchFridge();
    fetchItems();
  }, [fridgeId]);

  // Example table sorting, editing, etc. removed for brevity
  // Focus is on styling search field and tabs

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      {/* Tabs */}
      <nav className="flex space-x-4 mb-6">
        <button className="bg-[#1F2A30] text-white px-4 py-2 rounded border border-white">
          Fridge Overview
        </button>
        <button className="bg-[#1F2A30] text-white px-4 py-2 rounded border border-white">
          Grocery List
        </button>
        <button className="bg-[#1F2A30] text-white px-4 py-2 rounded border border-white">
          Expenses
        </button>
      </nav>

      {fridgeData ? (
        <div className="mb-4 p-4 rounded shadow bg-white text-black">
          <h2 className="text-xl font-semibold">{fridgeData.name}</h2>
          <p className="text-gray-600">Fridge ID: {fridgeData.id}</p>
        </div>
      ) : (
        <p>Loading fridge data...</p>
      )}

      {/* Search Field */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="
            p-2 rounded border border-gray-400 w-full 
            text-black 
            placeholder-gray-600  /* so placeholder is also more visible */
          "
        />
      </div>

      {/* ... rest of your table and form ... */}
    </div>
  );
}
