"use client";

import { deleteItem } from "@/app/firebase/firestore";
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
  serverTimestamp,
} from "firebase/firestore";
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
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Existing form state
  const [itemName, setItemName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

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

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
  
    try {
      await deleteItem(fridgeId, itemId);
      await fetchItems(); // Refresh the list
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete item");
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

      setItemName("");
      setExpiryDate("");
      setQuantity("");
      setPurchaseDate("");
      await fetchItems();
    } catch (err: any) {
      console.error("Firestore Error:", err);
      setError("Failed to add item: " + err.message);
    }
  };

  const handleScanReceipt = async () => {
    if (!selectedFile || !user) return;
  
    setIsProcessing(true);
    try {
      const storageRef = ref(storage, `receipts/${user.uid}/${Date.now()}`);
      await uploadBytes(storageRef, selectedFile);
      const imageUrl = await getDownloadURL(storageRef);
  
      const response = await axios.post("/api/scanReceipt", { imageUrl });
      
      // Process filtered items
      const items = response.data.items
        .filter((item: string) => item.trim().length > 0)
        .map((item: string) => ({
          name: item,
          quantity: 1,
          expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
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
    updated[index] = { ...updated[index], [field]: field === "quantity" ? parseInt(value) || 1 : value };
    setScanResult(updated);
  };

  const handleAddScannedItem = async (item: ScannedItem) => {
    try {
      const itemsRef = collection(db, "fridges", fridgeId, "items");
      await addDoc(itemsRef, {
        item_name: item.name,
        expiration_date: item.expiryDate,
        amount: item.quantity,
        purchase_date: new Date().toISOString().split("T")[0],
        created_at: serverTimestamp(),
        added_by: user?.uid,
      });
      await fetchItems();
    } catch (error) {
      console.error("Error adding scanned item:", error);
      setError("Failed to add scanned item");
    }
  };

  const handleGetRecommendations = async () => {
    if (!items.length) return;
  
    setIsRecommending(true);
    setError("");
  
    try {
      // Get list of item names
      const ingredients = items
        .map(item => item.item_name)
        .filter(name => typeof name === "string" && name.trim().length > 0);
  
      if (ingredients.length === 0) {
        throw new Error("No valid ingredients found in your fridge");
      }
  
      const response = await axios.post("/api/recommendRecipes", {
        ingredients: ingredients.slice(0, 10) // Limit to first 10 items
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
      {/* Existing fridge overview and items table */}
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
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-600">
                  <td className="p-2">{item.item_name || "N/A"}</td>
                  <td className="p-2">{item.description || "N/A"}</td>
                  <td className="p-2">{item.type || "N/A"}</td>
                  <td className="p-2">{item.storage || "N/A"}</td>
                  <td className="p-2">{item.expiration_date || "N/A"}</td>
                  <td className="p-2">{item.amount || "N/A"}</td>
                  <td className="p-2">
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
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
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


      {/* Receipt Scanning Section */}
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
                <div key={index} className="flex items-center gap-2 p-2 bg-[#3D4E52] rounded">
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

      {/* Add this near other buttons */}
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
                      <li key={stepIndex} className="mb-1">{step}</li>
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