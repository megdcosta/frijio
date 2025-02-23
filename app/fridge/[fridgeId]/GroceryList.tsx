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
  updateDoc,
} from "firebase/firestore";

interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  addedBy: string;
  isChecked: boolean;
}

interface GroceryListProps {
  fridgeId: string;
}

export default function GroceryList({ fridgeId }: GroceryListProps) {
  // State to store the id of the checked item
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  // Handle checkbox state change
  const handleCheckboxChange = async (itemId: string, currentState: boolean) => {
    // Update local state
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !currentState, // Toggle the current checkbox state
    }));
    try {
      // Update the Firestore document
      const itemRef = doc(db, "groceryItems", itemId);
      await updateDoc(itemRef, {
        isChecked: !currentState ? true : false, // 1 (true) for checked, 0 (false) for unchecked
      });
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

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
        isChecked: doc.data().isChecked,
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

  useEffect(() => {
    // Initialize the state with the current `isChecked` values from Firestore
    const initialCheckedItems = items.reduce((acc, item) => {
      acc[item.id] = item.isChecked;
      return acc;
    }, {} as { [key: string]: boolean });

    setCheckedItems(initialCheckedItems);
  }, [items]);

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
    <div className="p-4 max-w-4xl mx-auto ">
      <h1 className="text-2xl font-bold mb-6">Grocery List</h1>

      {/* Add Item Form */}
      <div className="bg-green rounded-full mb-8">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleAddItem} className="space-y-4 flex flex-wrap gap-4 items-center px-10">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <label className="block text-white mb-2 w-fit">Item Name</label>
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="w-full p-2 rounded-full border border-text bg-white text-text placeholder-[#796d6d] indent-2"
              placeholder="Enter item name"
              required
            />
            <label className="block text-white mb-2">Quantity</label>
            <input
            type="text"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            className="w-full p-2 rounded-full border border-text bg-white text-text placeholder-[#796d6d] indent-2"
            placeholder="Enter quantity"
            />
            <button
              type="submit"
              className="w-24 h-8 text-2xl bg-[#d28d82] text-white rounded-full font-bold hover:bg-[#db948a] transition shadow-sm flex items-center justify-center "
              >
              +
            </button>
          </div>
        </form>
      </div>

      {/* Grocery Items List */}
      <div className="bg-white p-4 rounded-lg">
        {loading ? (
          <p className="text-text">Loading items...</p>
        ) : items.length === 0 ? (
          <p className="text-text">No items in your grocery list</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-text text-text">
                  <th className="text-left p-2"></th>
                  <th className="text-left p-2">Item</th>
                  <th className="text-left p-2">Quantity</th>
                  <th className="text-left p-2">Added By</th>
                  <th className="text-left p-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-text">
                    <td className="p-2">
                      <label className="relative inline-block">
                        <input
                          type="checkbox"
                          checked={checkedItems[item.id] || false} // Only check if the item is checked
                          onChange={() => handleCheckboxChange(item.id, checkedItems[item.id])} // Toggle check state
                          className="hidden"
                        />
                        {/* Custom circular checkbox */}
                        <span
                          className={`w-6 h-6 border-2 rounded-full transition-colors duration-300 bg-transparent border-text flex items-center justify-center`}
                        >
                          {/* Inner circle (white circle when checked) */}
                          {checkedItems[item.id] && (
                            <span className="w-3 h-3 bg-text rounded-full"></span>
                          )}
                        </span>
                      </label>
                    </td>
                    <td className="p-2 text-text">{item.name}</td>
                    <td className="p-2 text-text">
                      {item.quantity || "-"}
                    </td>
                    <td className="p-2 text-text">
                      {item.addedBy === user?.uid ? "You" : item.addedBy}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-text px-3 py-1 rounded"
                      >
                        X
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
