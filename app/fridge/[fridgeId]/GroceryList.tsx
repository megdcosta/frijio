"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  addedBy: string;
  createdAt: any;
}

interface GroceryListProps {
  fridgeId: string;
}

export default function GroceryList({ fridgeId }: GroceryListProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const itemsRef = collection(db, "fridges", fridgeId, "groceryItems");
      const snapshot = await getDocs(itemsRef);
      const itemsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        quantity: doc.data().quantity,
        addedBy: doc.data().addedBy,
        createdAt: doc.data().createdAt,
      }));
      setItems(itemsData);
    } catch (err: any) {
      setError("Failed to load grocery items: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fridgeId) {
      fetchItems();
    }
  }, [fridgeId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user || !fridgeId) return;
    if (!newItem.trim()) {
      setError("Item name is required");
      return;
    }

    try {
      const itemsRef = collection(db, "fridges", fridgeId, "groceryItems");
      await addDoc(itemsRef, {
        name: newItem.trim(),
        quantity: newQuantity.trim(),
        addedBy: user.uid,
        createdAt: serverTimestamp(),
      });

      setNewItem("");
      setNewQuantity("");
      await fetchItems();
    } catch (err: any) {
      setError("Failed to add item: " + err.message);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, "fridges", fridgeId, "groceryItems", itemId));
      await fetchItems();
    } catch (err: any) {
      setError("Failed to delete item: " + err.message);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "N/A";
    return new Date(timestamp.toDate()).toLocaleDateString();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Grocery List</h1>

      {/* Add Item Form */}
      <div className="bg-[#1F2A30] p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4 text-[#F1EFD8]">Add New Item</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#F1EFD8] mb-2">Item Name</label>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                className="w-full p-2 rounded bg-[#3D4E52] border border-gray-600 text-[#F1EFD8]"
                placeholder="Enter item name"
                required
              />
            </div>

            <div>
              <label className="block text-[#F1EFD8] mb-2">Quantity</label>
              <input
                type="text"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                className="w-full p-2 rounded bg-[#3D4E52] border border-gray-600 text-[#F1EFD8]"
                placeholder="Enter quantity"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#5E7A80] text-[#F1EFD8] py-2 rounded hover:bg-[#4A6065] transition"
          >
            Add Item
          </button>
        </form>
      </div>

      {/* Grocery Items List */}
      <div className="bg-[#1F2A30] p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-[#F1EFD8]">Current List</h2>

        {loading ? (
          <p className="text-[#F1EFD8]">Loading items...</p>
        ) : items.length === 0 ? (
          <p className="text-[#F1EFD8]">No items in your grocery list</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600 text-[#F1EFD8]">
                  <th className="text-left p-2">Item</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Added By</th>
                  <th className="text-left p-2">Date Added</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-600">
                    <td className="p-2 text-[#F1EFD8]">{item.name}</td>
                    <td className="p-2 text-[#F1EFD8]">
                      {item.quantity || "-"}
                    </td>
                    <td className="p-2 text-[#F1EFD8]">
                      {item.addedBy === user?.uid ? "You" : item.addedBy}
                    </td>
                    <td className="p-2 text-[#F1EFD8]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
