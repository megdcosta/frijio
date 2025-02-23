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
  updateDoc,
  deleteDoc,
  serverTimestamp,
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

  // ----------------- Form State ----------------- //
  const [itemName, setItemName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [itemType, setItemType] = useState("");

  // ----------------- Editing State ----------------- //
  const [editingItem, setEditingItem] = useState<any>(null);

  // ----------------- Search State ----------------- //
  const [searchTerm, setSearchTerm] = useState("");

  // ----------------- Effects ----------------- //

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Fetch fridge info and items
  useEffect(() => {
    if (!fridgeId) return;

    const fetchFridgeData = async () => {
      try {
        const fridgeRef = doc(db, "fridges", fridgeId);
        const fridgeSnap = await getDoc(fridgeRef);

        if (!fridgeSnap.exists()) {
          setError("Fridge not found.");
          return;
        }
        setFridgeData({ id: fridgeSnap.id, ...fridgeSnap.data() });

        await refreshItems();
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchFridgeData();
  }, [fridgeId]);

  // ----------------- Helper Methods ----------------- //

  const refreshItems = async () => {
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

  // ----------------- CRUD Operations ----------------- //

  // 1) Add item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fridgeId || !user) return;
    setError("");

    try {
      const itemsRef = collection(db, "fridges", fridgeId, "items");
      await addDoc(itemsRef, {
        item_name: itemName,
        expiration_date: expiryDate, // optional
        amount: quantity, // optional
        type: itemType,
        created_at: serverTimestamp(),
        added_by: user.uid,
      });

      setItemName("");
      setExpiryDate("");
      setQuantity("");
      setItemType("");

      await refreshItems();
    } catch (err: any) {
      setError("Failed to add item: " + err.message);
    }
  };

  // 2) Begin edit
  const handleEdit = (item: any) => {
    setEditingItem(item);
    setItemName(item.item_name || "");
    setExpiryDate(item.expiration_date || "");
    setQuantity(item.amount || "");
    setItemType(item.type || "");
  };

  // 3) Cancel edit
  const handleCancelEdit = () => {
    setEditingItem(null);
    setItemName("");
    setExpiryDate("");
    setQuantity("");
    setItemType("");
  };

  // 4) Save changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !fridgeId) return;

    try {
      const itemRef = doc(db, "fridges", fridgeId, "items", editingItem.id);
      await updateDoc(itemRef, {
        item_name: itemName,
        expiration_date: expiryDate,
        amount: quantity,
        type: itemType,
      });

      setEditingItem(null);
      setItemName("");
      setExpiryDate("");
      setQuantity("");
      setItemType("");

      await refreshItems();
    } catch (err: any) {
      setError("Failed to update item: " + err.message);
    }
  };

  // 5) Delete item
  const handleDelete = async (itemId: string) => {
    if (!fridgeId || !user) return;
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await deleteDoc(doc(db, "fridges", fridgeId, "items", itemId));
      await refreshItems();
    } catch (err: any) {
      setError("Error deleting item: " + err.message);
    }
  };

  // ----------------- Search & Sort ----------------- //

  const filteredItems = items.filter((item) =>
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedItems = filteredItems.sort((a, b) => {
    const dateA = new Date(a.expiration_date || "");
    const dateB = new Date(b.expiration_date || "");
    return dateA.getTime() - dateB.getTime();
  });

  // ----------------- Rendering ----------------- //

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

      {/* --- Add / Edit Form (moved to top) --- */}
      <div className="bg-[#1F2A30] p-4 rounded-lg mb-6">
        <h2 className="text-xl font-bold mb-4">
          {editingItem ? "Edit Item" : "Add New Item"}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form
          onSubmit={editingItem ? handleSaveEdit : handleAddItem}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Item Name (required) */}
            <input
              type="text"
              placeholder="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="p-2 rounded bg-[#3D4E52] border border-gray-600 text-white"
              required
            />

            {/* Quantity (optional) */}
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="p-2 rounded bg-[#3D4E52] border border-gray-600 text-white"
            />

            {/* Type (required) */}
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              className="p-2 rounded bg-[#3D4E52] border border-gray-600 text-white max-h-48 overflow-y-auto"
              required
            >
              <option value="">-- Select Type --</option>
              <option value="Eggs/Dairy">Eggs/Dairy</option>
              <option value="Fruit">Fruit</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Meat">Meat</option>
              <option value="Leftovers">Leftovers</option>
              <option value="Frozen">Frozen</option>
              <option value="Sauces/Condiments">Sauces/Condiments</option>
              <option value="Other">Other</option>
            </select>

            {/* Expiration Date (optional) */}
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="p-2 rounded bg-[#3D4E52] border border-gray-600 text-white"
            />
          </div>

          {/* Submit/Cancel Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-[#5E7A80] text-[#F1EFD8] py-2 px-6 rounded hover:bg-[#4A6065] transition"
            >
              {editingItem ? "Save" : "Add"}
            </button>

            {editingItem && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- Search Field --- */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 rounded border border-gray-400 w-full text-black placeholder-gray-600"
        />
      </div>

      {/* --- Items Table --- */}
      <div className="bg-[#1F2A30] p-4 rounded text-[#F1EFD8] overflow-x-auto">
        {/* Limit height so only ~15 items are visible before scrolling */}
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Expiration Date</th>
                {/* Renamed column from "Amount" to "Quantity" */}
                <th className="text-left p-2">Quantity</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    No items found.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-600">
                    <td className="p-2">{item.item_name || "N/A"}</td>
                    <td className="p-2">{item.type || "N/A"}</td>
                    <td className="p-2">{item.expiration_date || "N/A"}</td>
                    <td className="p-2">{item.amount || "N/A"}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="bg-blue-600 px-2 py-1 rounded text-white"
                      >
                        Edit
                      </button>
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
      </div>
    </div>
  );
}
