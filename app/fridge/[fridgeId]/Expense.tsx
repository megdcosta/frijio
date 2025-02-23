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
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Expense Tracking</h1>

      {/* Add Expense Form */}
      <div className="bg-green rounded-full mb-8 shadow-lg py-3">
        {error && <p className="text-red-500 mb-4 px-10">{error}</p>}
        <form
          onSubmit={handleAddExpense}
          className="flex flex-wrap gap-4 items-center px-10"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <label className="block text-white">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-52 p-2 rounded-full border border-text bg-white text-text placeholder-[#796d6d] indent-2"
              placeholder="Enter item name"
            />

            <label className="block text-white">Cost</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-52 p-2 rounded-full border border-text bg-white text-text placeholder-[#796d6d] indent-2"
              placeholder="Enter amount"
              step="0.01"
            />

            <label className="block text-white">Split Between</label>
            <input
              type="text"
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              className="w-52 p-2 rounded-full border border-text bg-white text-text placeholder-[#796d6d] indent-2"
              placeholder="user1, user2"
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

      {/* Expenses List */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        {loading ? (
          <p className="text-text">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="text-text">No expenses recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-text text-text">
                  <th className="text-left p-2">Item</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Paid By</th>
                  <th className="text-left p-2">Split Between</th>
                  <th className="text-left p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-text">
                    <td className="p-2 text-text">{expense.item_name}</td>
                    <td className="p-2 text-text">
                      ${expense.cost.toFixed(2)}
                    </td>
                    <td className="p-2 text-text">
                      {expense.payer_id === user?.uid
                        ? "You"
                        : expense.payer_id}
                    </td>
                    <td className="p-2 text-text">
                      {expense.user_ids.join(", ")}
                    </td>
                    <td className="p-2 text-text">
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
