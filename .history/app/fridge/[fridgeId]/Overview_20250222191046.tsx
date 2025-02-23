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

  const fetchItems = async () => {
    if (!fridgeId) return;
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

  const handleDelete = async (itemId: string) => {
    if (!fridgeId || !user) return;
    try {
      await deleteDoc(doc(db, "fridges", fridgeId, "items", itemId));
      await fetchItems();
    } catch (err: any) {
      setError("Error deleting item: " + err.message);
    }
  };

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

    fetchFridge();
    fetchItems();
  }, [fridgeId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fridgeId || !user) return;

    try {
      const itemsRef = collection(db, "fridges", fridgeId, "items");
      await addDoc(itemsRef, {
        item_name: itemName,
        expiration_date: expiryDate,
        amount: quantity,
        purchase_date: purchaseDate,
        created_at: serverTimestamp(),
        added_by: user.uid,
      });

      // Clear form fields
      setItemName("");
      setExpiryDate("");
      setQuantity("");
      setPurchaseDate("");

      // Refresh items list
      await fetchItems();
    } catch (err: any) {
      console.error("Firestore Error:", err);
      setError("Failed to add item: " + err.message);
    }
  };

  // Filter items based on the search term
  const filteredItems = items.filter((item) =>
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Search Field */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 rounded border border-gray-400 w-full"
        />
      </div>

      {/* Items Table */}
      <div className="bg-[#1F2A30] p-4 rounded text-[#F1EFD8] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Expiration Date</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-4">
                  No items found.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-600">
                  <td className="p-2">{item.item_name || "N/A"}</td>
                  <td className="p-2">{item.expiration_date || "N/A"}</td>
                  <td className="p-2">{item.amount || "N/A"}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-600 px-2 py-1 rounded text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Form */}
      <div className="mt-6 bg-[#1F2A30] p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Add New Item</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="p-2 rounded bg-[#3D4E52] border border-gray-600"
              required
            />
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="p-2 rounded bg-[#3D4E52] border border-gray-600"
              required
            />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="p-2 rounded bg-[#3D4E52] border border-gray-600"
              required
            />
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="p-2 rounded bg-[#3D4E52] border border-gray-600"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#5E7A80] text-[#F1EFD8] py-2 rounded hover:bg-[#4A6065] transition"
          >
            Add Item
          </button>
        </form>
      </div>
    </div>
  );
}
