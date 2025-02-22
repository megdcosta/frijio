"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

interface OverviewProps {
  fridgeId: string;
}

export default function Overview({ fridgeId }: OverviewProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fridgeData, setFridgeData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

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
        const itemsList = snapshot.docs.map(doc => ({
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Fridge Overview</h1>
      {fridgeData ? (
        <div className="mb-4 p-4 rounded shadow bg-white text-black">
          <h2 className="text-xl font-semibold">{fridgeData.name}</h2>
          <p className="text-gray-600">Fridge ID: {fridgeData.id}</p>
        </div>
      ) : (
        <p>Loading fridge data...</p>
      )}

      <div className="bg-[#1F2A30] p-4 rounded text-[#F1EFD8] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Description</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Storage</th>
              <th className="text-left p-2">Expiration Date</th>
              <th className="text-left p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-4">
                  No items found.
                </td>
              </tr>
            ) : (
              items.map(item => (
                <tr key={item.id} className="border-b border-gray-600">
                  <td className="p-2">{item.item_name || "N/A"}</td>
                  <td className="p-2">{item.description || "N/A"}</td>
                  <td className="p-2">{item.type || "N/A"}</td>
                  <td className="p-2">{item.storage || "N/A"}</td>
                  <td className="p-2">{item.expiration_date || "N/A"}</td>
                  <td className="p-2">{item.amount || "N/A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
