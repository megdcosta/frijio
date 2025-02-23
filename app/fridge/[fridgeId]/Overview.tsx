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
  const [recommendations, setRecommendations] = useState<
    RecipeRecommendation[]
  >([]);
  const [isRecommending, setIsRecommending] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

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
      await fetchItems();
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

  const handleScanEdit = (
    index: number,
    field: keyof ScannedItem,
    value: string
  ) => {
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
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Fridge Overview</h1>

      <div className="bg-green rounded-full mb-8 shadow-lg py-3">
        {error && <p className="text-red-500 mb-4 px-10">{error}</p>}
        <form
          onSubmit={handleAddItem}
          className="flex flex-wrap gap-4 items-center px-10"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center w-full">
            <label className="block text-white">Item Name</label>
            <input
              type="text"
              placeholder="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-52 p-2 rounded-full border border-text bg-white text-text placeholder-[#796d6d] indent-2"
              required
            />

            <label className="block text-white">Quantity</label>
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-52 p-2 rounded-full border border-text bg-white text-text placeholder-[#796d6d] indent-2"
              required
            />

            <label className="block text-white">Expiry</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-52 p-2 rounded-full border border-text bg-white text-text px-4"
              required
            />

            <button
              type="submit"
              className="w-10 h-10 text-2xl bg-[#d28d82] text-white rounded-full font-bold hover:bg-[#db948a] transition shadow-sm flex items-center justify-center"
            >
              +
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4 text-text">Items List</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-text text-text">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Storage</th>
                <th className="text-left p-2">Expiration</th>
                <th className="text-left p-2">Amount</th>
                <th className="text-left p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4 text-text">
                    No items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-text">
                    <td className="p-2 text-text">{item.item_name || "N/A"}</td>
                    <td className="p-2 text-text">
                      {item.description || "N/A"}
                    </td>
                    <td className="p-2 text-text">{item.type || "N/A"}</td>
                    <td className="p-2 text-text">{item.storage || "N/A"}</td>
                    <td className="p-2 text-text">
                      {item.expiration_date || "N/A"}
                    </td>
                    <td className="p-2 text-text">{item.amount || "N/A"}</td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-text px-3 py-1 rounded"
                      >
                        X
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-bold mb-4 text-text">Scan Receipt</h2>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files?.[0] && setSelectedFile(e.target.files[0])
            }
            className="hidden"
            id="receiptUpload"
          />
          <label
            htmlFor="receiptUpload"
            className="bg-[#d28d82] text-white py-2 px-4 rounded-full cursor-pointer hover:bg-[#db948a] transition"
          >
            {selectedFile ? selectedFile.name : "Select Receipt"}
          </label>

          {selectedFile && (
            <button
              onClick={handleScanReceipt}
              disabled={isProcessing}
              className="bg-green-600 text-white py-2 px-4 rounded-full hover:bg-green-700 transition"
            >
              {isProcessing ? "Processing..." : "Scan"}
            </button>
          )}
        </div>

        {isScanning && scanResult.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-text">
              Detected Items:
            </h3>
            <div className="space-y-2">
              {scanResult.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-100 rounded-full"
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      handleScanEdit(index, "name", e.target.value)
                    }
                    className="flex-1 p-2 bg-transparent text-text rounded-full border border-text px-4"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleScanEdit(index, "quantity", e.target.value)
                    }
                    className="w-20 p-2 bg-transparent text-text rounded-full border border-text text-center"
                    min="1"
                  />
                  <input
                    type="date"
                    value={item.expiryDate}
                    onChange={(e) =>
                      handleScanEdit(index, "expiryDate", e.target.value)
                    }
                    className="p-2 bg-transparent text-text rounded-full border border-text px-4"
                  />
                  <button
                    onClick={() => handleAddScannedItem(item)}
                    className="bg-[#d28d82] text-white px-4 py-2 rounded-full hover:bg-[#db948a]"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-text">Recipe Suggestions</h2>
        <button
          onClick={handleGetRecommendations}
          disabled={isRecommending || items.length === 0}
          className="bg-[#d28d82] text-white py-2 px-4 rounded-full hover:bg-[#db948a] transition"
        >
          {isRecommending ? "Generating..." : "Suggest Recipes"}
        </button>

        {showRecommendations && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text">
                Recommended Recipes
              </h3>
              <button
                onClick={() => setShowRecommendations(false)}
                className="text-text hover:text-[#d28d82]"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {recommendations.map((recipe, index) => (
                <div key={index} className="p-4 bg-white rounded-lg shadow">
                  <h4 className="font-medium mb-2 text-text">
                    {recipe.recipe}
                  </h4>
                  <p className="text-sm mb-2 text-text">
                    <span className="font-semibold">Ingredients:</span>{" "}
                    {recipe.ingredients.join(", ")}
                  </p>
                  <ol className="list-decimal pl-4 text-sm text-text">
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
