"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { db, storage } from "../../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { deleteItem } from "@/app/firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from "axios";

interface OverviewProps {
  fridgeId: string;
}

interface ScannedItem {
  name: string;
  quantity: number;
  expiryDate: string;
}

interface RecipeRecommendation {
  recipe: string;
  ingredients: string[];
  instructions: string[];
}

export default function Overview({ fridgeId }: OverviewProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [fridgeData, setFridgeData] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState("");

  // Form states for adding a new item
  const [itemName, setItemName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState("");

  // Scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Recommendation states
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Editing states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingType, setEditingType] = useState("");
  const [editingQuantity, setEditingQuantity] = useState("");
  const [editingExpiry, setEditingExpiry] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fridgeId]);

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

  // -----------------------
  // Add New Item
  // -----------------------
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fridgeId || !user) return;

    try {
      const itemsRef = collection(db, "fridges", fridgeId, "items");
      await addDoc(itemsRef, {
        item_name: itemName,
        expiration_date: expiryDate || "",
        amount: quantity || "",
        type: type,
        created_at: serverTimestamp(),
        added_by: user.uid,
      });

      setItemName("");
      setExpiryDate("");
      setQuantity("");
      setType("");
      await fetchItems();
    } catch (err: any) {
      console.error("Firestore Error:", err);
      setError("Failed to add item: " + err.message);
    }
  };

  // -----------------------
  // Delete Item
  // -----------------------
  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteItem(fridgeId, itemId);
      await fetchItems();
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete item");
    }
  };

  // -----------------------
  // Edit Item (toggle/edit)
  // -----------------------
  const startEditItem = (item: any) => {
    setEditingItemId(item.id);
    setEditingName(item.item_name || "");
    setEditingType(item.type || "");
    setEditingQuantity(item.amount || "");
    setEditingExpiry(item.expiration_date || "");
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
    setEditingName("");
    setEditingType("");
    setEditingQuantity("");
    setEditingExpiry("");
  };

  const handleUpdateItem = async (itemId: string) => {
    try {
      const itemRef = doc(db, "fridges", fridgeId, "items", itemId);
      await updateDoc(itemRef, {
        item_name: editingName,
        expiration_date: editingExpiry,
        amount: editingQuantity,
        type: editingType,
      });
      cancelEditItem();
      await fetchItems();
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update item");
    }
  };

  // -----------------------
  // Scan Receipt
  // -----------------------
  const handleScanReceipt = async () => {
    if (!selectedFile || !user) return;
    setIsProcessing(true);
    try {
      const storageRef = ref(storage, `receipts/${user.uid}/${Date.now()}`);
      await uploadBytes(storageRef, selectedFile);
      const imageUrl = await getDownloadURL(storageRef);

      const response = await axios.post("/api/scanReceipt", { imageUrl });

      // Process filtered items from your AI parser
      const items = response.data.items
        .filter((item: string) => item.trim().length > 0)
        .map((item: string) => ({
          name: item,
          quantity: 1,
          expiryDate: new Date(Date.now() + 7 * 86400000)
            .toISOString()
            .split("T")[0],
        }));

      setScanResult(items);
      setIsScanning(true);
    } catch (error) {
      console.error("Scan error:", error);
      setError("Failed to process receipt");
    }
    setIsProcessing(false);
  };

  const handleScanEdit = (index: number, field: keyof ScannedItem, value: string) => {
    const updated = [...scanResult];
    updated[index] = {
      ...updated[index],
      [field]: field === "quantity" ? parseInt(value) || 1 : value,
    };
    setScanResult(updated);
  };

  const handleAddScannedItem = async (item: ScannedItem) => {
    try {
      const itemsRef = collection(db, "fridges", fridgeId, "items");
      await addDoc(itemsRef, {
        item_name: item.name,
        expiration_date: item.expiryDate,
        amount: item.quantity,
        type: "Other",
        created_at: serverTimestamp(),
        added_by: user?.uid,
      });
      await fetchItems();
    } catch (error) {
      console.error("Error adding scanned item:", error);
      setError("Failed to add scanned item");
    }
  };

  // -----------------------
  // Recommendations
  // -----------------------
  const handleGetRecommendations = async () => {
    if (!items.length) return;
    setIsRecommending(true);
    setError("");

    try {
      const ingredients = items
        .map((item) => item.item_name)
        .filter((name) => typeof name === "string" && name.trim().length > 0);

      if (ingredients.length === 0) {
        throw new Error("No valid ingredients found in your fridge");
      }

      const response = await axios.post("/api/recommendRecipes", {
        ingredients: ingredients.slice(0, 10),
      });

      setRecommendations(response.data.recommendations);
      setShowRecommendations(true);
    } catch (error) {
      console.error("Recommendation error:", error);
      setError("Failed to generate recommendations");
    } finally {
      setIsRecommending(false);
    }
  };

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

      {/* ------------------------
       Add New Item Form
      ------------------------ */}
      <div className="mt-6 bg-[#1F2A30] p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Add New Item</h2>
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
            />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="p-2 rounded bg-[#3D4E52] border border-gray-600"
            />
            {/* Type label + select (no "Type" placeholder) */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="p-2 rounded bg-[#3D4E52] border border-gray-600"
            >
              <option value="">Select Type</option>
              <option value="Eggs/Dairy">Eggs/Dairy</option>
              <option value="Fruits">Fruits</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Meat">Meat</option>
              <option value="Leftovers">Leftovers</option>
              <option value="Frozen">Frozen</option>
              <option value="Sauces/Condiments">Sauces/Condiments</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-[#5E7A80] text-[#F1EFD8] py-2 rounded hover:bg-[#4A6065] transition"
          >
            Add Item
          </button>
        </form>
      </div>

      {/* ------------------------
       Fridge Items List
      ------------------------ */}
      <div className="mt-6 bg-[#1F2A30] p-4 rounded text-[#F1EFD8]">
        <h2 className="text-xl font-bold mb-4">Current Items</h2>
        <div className="relative overflow-x-auto max-h-96 overflow-y-auto">
          <table
            className="w-full border-separate"
            style={{ borderSpacing: 0 }}
          >
            {/* Sticky header */}
            <thead className="sticky top-0 bg-[#1F2A30] z-10">
              <tr className="border-b border-gray-600">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Expiration Date</th>
                <th className="text-left p-2">Quantity</th>
                <th className="p-2"></th>
                <th className="p-2"></th>
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
                items.map((item) => {
                  if (editingItemId === item.id) {
                    // Editing mode
                    return (
                      <tr key={item.id} className="border-b border-gray-600">
                        <td className="p-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full bg-transparent border-b border-gray-500"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={editingType}
                            onChange={(e) => setEditingType(e.target.value)}
                            className="w-full bg-transparent border-b border-gray-500"
                          >
                            <option value="">Select Type</option>
                            <option value="Eggs/Dairy">Eggs/Dairy</option>
                            <option value="Fruits">Fruits</option>
                            <option value="Vegetables">Vegetables</option>
                            <option value="Meat">Meat</option>
                            <option value="Leftovers">Leftovers</option>
                            <option value="Frozen">Frozen</option>
                            <option value="Sauces/Condiments">
                              Sauces/Condiments
                            </option>
                            <option value="Other">Other</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={editingExpiry}
                            onChange={(e) => setEditingExpiry(e.target.value)}
                            className="w-full bg-transparent border-b border-gray-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={editingQuantity}
                            onChange={(e) => setEditingQuantity(e.target.value)}
                            className="w-full bg-transparent border-b border-gray-500"
                          />
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => handleUpdateItem(item.id)}
                            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            Update
                          </button>
                        </td>
                        <td className="p-2">
                          <button
                            onClick={cancelEditItem}
                            className="text-gray-300 hover:text-white"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  } else {
                    // Normal display
                    return (
                      <tr key={item.id} className="border-b border-gray-600">
                        <td className="p-2">{item.item_name || "N/A"}</td>
                        <td className="p-2">{item.type || "N/A"}</td>
                        <td className="p-2">{item.expiration_date || "N/A"}</td>
                        <td className="p-2">{item.amount || "N/A"}</td>
                        <td className="p-2">
                          {/* Edit icon */}
                          <button
                            onClick={() => startEditItem(item)}
                            className="text-yellow-400 hover:text-yellow-500 mr-3"
                            title="Edit item"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M15.502 2.443a1.497 1.497 0 00-2.12 0l-1.04 1.04 4.177 4.177 1.04-1.04a1.499 1.499 0 000-2.12l-2.06-2.06zM10.243 6.343l4.177 4.177-6.364 6.364-4.177-4.177 6.364-6.364zM3.414 12.414l4.177 4.177-1.414 1.414-4.177-4.177 1.414-1.414z" />
                            </svg>
                          </button>
                        </td>
                        <td className="p-2">
                          {/* Trash (delete) icon */}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete item"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-2 6a1 1 0 112 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 011 1v6a1 1 0 11-2 0V8a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  }
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------
       Receipt Scanning
      ------------------------ */}
      <div className="mt-6 bg-[#1F2A30] p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Scan Receipt</h2>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
            className="hidden"
            id="receiptUpload"
          />
          <label
            htmlFor="receiptUpload"
            className="bg-[#5E7A80] text-[#F1EFD8] py-2 px-4 rounded cursor-pointer hover:bg-[#4A6065] transition"
          >
            {selectedFile ? selectedFile.name : "Select Receipt Image"}
          </label>

          {selectedFile && (
            <button
              onClick={handleScanReceipt}
              disabled={isProcessing}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
            >
              {isProcessing ? "Processing..." : "Scan Receipt"}
            </button>
          )}
        </div>

        {isScanning && scanResult.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Detected Items:</h3>
            <div className="space-y-2">
              {scanResult.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-[#3D4E52] rounded"
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleScanEdit(index, "name", e.target.value)}
                    className="flex-1 p-1 bg-transparent border-b border-gray-500"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleScanEdit(index, "quantity", e.target.value)}
                    className="w-20 p-1 bg-transparent border-b border-gray-500"
                    min="1"
                  />
                  <input
                    type="date"
                    value={item.expiryDate}
                    onChange={(e) => handleScanEdit(index, "expiryDate", e.target.value)}
                    className="p-1 bg-transparent border-b border-gray-500"
                  />
                  <button
                    onClick={() => handleAddScannedItem(item)}
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------
       Recipe Suggestions
      ------------------------ */}
      <div className="mt-6 bg-[#1F2A30] p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Recipe Suggestions</h2>
        <button
          onClick={handleGetRecommendations}
          disabled={isRecommending || items.length === 0}
          className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition"
        >
          {isRecommending ? "Generating..." : "Suggest Recipes"}
        </button>

        {showRecommendations && (
          <div className="mt-4 p-4 bg-[#3D4E52] rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recommended Recipes</h3>
              <button
                onClick={() => setShowRecommendations(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {recommendations.map((recipe, index) => (
                <div key={index} className="p-4 bg-[#2A363B] rounded">
                  <h4 className="font-medium mb-2">{recipe.recipe}</h4>
                  <p className="text-sm mb-2">
                    <span className="font-semibold">Ingredients:</span>{" "}
                    {recipe.ingredients.join(", ")}
                  </p>
                  <ol className="list-decimal pl-4 text-sm">
                    {recipe.instructions.map((step, stepIndex) => (
                      <li key={stepIndex} className="mb-1">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
