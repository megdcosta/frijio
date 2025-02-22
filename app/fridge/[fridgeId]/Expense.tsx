"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

interface ExpenseProps {
  fridgeId: string;
}

interface ExpenseData {
  id: string;
  item_name: string;
  cost: number;
  payer_id: string;
  user_ids: string[];
  created_at: any;
  fridge_id: string;
}

export default function Expenses({ fridgeId }: ExpenseProps) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form state
  const [itemName, setItemName] = useState("");
  const [cost, setCost] = useState("");
  const [userIds, setUserIds] = useState("");

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const expensesRef = collection(db, "expenses");
      const q = query(expensesRef, where("fridge_id", "==", fridgeId));

      const snapshot = await getDocs(q);
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ExpenseData[];

      setExpenses(expensesData);
    } catch (err: any) {
      setError("Failed to load expenses: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fridgeId) {
      fetchExpenses();
    }
  }, [fridgeId]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user || !fridgeId) return;

    // Validation
    if (!itemName.trim()) {
      setError("Item name is required");
      return;
    }
    if (!cost || Number(cost) <= 0) {
      setError("Valid cost amount is required");
      return;
    }
    if (!userIds.trim()) {
      setError("At least one user ID is required");
      return;
    }

    try {
      const userIdsArray = userIds.split(",").map((id) => id.trim());
      const expensesRef = collection(db, "expenses");

      await addDoc(expensesRef, {
        item_name: itemName,
        cost: Number(cost),
        payer_id: user.uid,
        user_ids: userIdsArray,
        fridge_id: fridgeId,
        created_at: serverTimestamp(),
      });

      // Reset form
      setItemName("");
      setCost("");
      setUserIds("");

      // Refresh list
      await fetchExpenses();
    } catch (err: any) {
      console.error("Expense error:", err);
      setError("Failed to add expense: " + err.message);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "N/A";
    return new Date(timestamp.toDate()).toLocaleDateString();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Expense Tracking</h1>

      {/* Add Expense Form */}
      <div className="bg-[#1F2A30] p-4 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4 text-[#F1EFD8]">
          Add New Expense
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#F1EFD8] mb-2">Item Name</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full p-2 rounded bg-[#3D4E52] border border-gray-600 text-[#F1EFD8]"
                placeholder="Enter item name"
              />
            </div>

            <div>
              <label className="block text-[#F1EFD8] mb-2">Cost ($)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full p-2 rounded bg-[#3D4E52] border border-gray-600 text-[#F1EFD8]"
                placeholder="Enter amount"
                step="0.01"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[#F1EFD8] mb-2">
                Split Between User IDs (comma-separated)
              </label>
              <input
                type="text"
                value={userIds}
                onChange={(e) => setUserIds(e.target.value)}
                className="w-full p-2 rounded bg-[#3D4E52] border border-gray-600 text-[#F1EFD8]"
                placeholder="e.g., user1, user2, user3"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#5E7A80] text-[#F1EFD8] py-2 rounded hover:bg-[#4A6065] transition"
          >
            Add Expense
          </button>
        </form>
      </div>

      {/* Expenses List */}
      <div className="bg-[#1F2A30] p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-[#F1EFD8]">
          Expense History
        </h2>

        {loading ? (
          <p className="text-[#F1EFD8]">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="text-[#F1EFD8]">No expenses recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600 text-[#F1EFD8]">
                  <th className="text-left p-2">Item</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Paid By</th>
                  <th className="text-left p-2">Split Between</th>
                  <th className="text-left p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-600">
                    <td className="p-2 text-[#F1EFD8]">{expense.item_name}</td>
                    <td className="p-2 text-[#F1EFD8]">
                      ${expense.cost.toFixed(2)}
                    </td>
                    <td className="p-2 text-[#F1EFD8]">
                      {expense.payer_id === user?.uid
                        ? "You"
                        : expense.payer_id}
                    </td>
                    <td className="p-2 text-[#F1EFD8]">
                      {expense.user_ids.join(", ")}
                    </td>
                    <td className="p-2 text-[#F1EFD8]">
                      {formatDate(expense.created_at)}
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
