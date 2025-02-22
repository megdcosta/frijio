"use client";

import { useAuth } from "../../hooks/useAuth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, assignFridgeToUser } from "../../firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";

// const getUserExpenses = async (userId: string) => {
//     try {
//         const expensesRef = collection(db, "expenses");

//         // Query to find expenses where the user is either the payer or in the USER_IDS array
//         const q = query(
//             expensesRef,
//             where("PAYER_ID", "==", userId), // You could add more conditions here if needed
//             where("USER_IDS", "array-contains", userId) // Check if the user is in the array
//         );
//         const querySnapshot = await getDocs(q);

//         const expenses = querySnapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data(),
//             }));

//             console.log("Expenses for user:", expenses);
//             return expenses;
//         } catch (error) {
//             console.error("Error getting expenses: ", error);
//         }
//     };

//     // Function to update an expense
//     const updateExpense = async (expenseId: string, newCost: number) => {
//         try {
//         const expenseRef = doc(db, "expenses", expenseId);
//         await updateDoc(expenseRef, {
//             COST: newCost,
//         });
//         console.log("Expense updated");
//         } catch (error) {
//         console.error("Error updating expense: ", error);
//         }
//     };

// // Example usage
// getUserExpenses("user1_id");

// const addExpense = async (itemName: string, cost: number, payerId: string, userIds: string[]) => {
//     try {
//       const expenseRef = collection(db, "expenses"); // Reference to the 'expenses' collection
//       const newExpense = await addDoc(expenseRef, {
//         ITEM_NAME: itemName,
//         COST: cost,
//         PAYER_ID: payerId,
//         USER_IDS: userIds,
//       });
//       console.log("Expense added with ID:", newExpense.id);
//     } catch (error) {
//       console.error("Error adding expense: ", error);
//     }
//   };

//   addExpense("Dinner at Restaurant", 50.0, "user1_id", ["user1_id", "user2_id", "user3_id"]);

const Expense = () => {
  const { user } = useAuth(); // Assuming useAuth gives the logged-in user (with user.uid)

  // State for form inputs
  const [itemName, setItemName] = useState<string>("");
  const [cost, setCost] = useState<number>(0);
  const [payerId, setPayerId] = useState<string>(user?.uid || ""); // Payer ID should be the current user
  const [userIds, setUserIds] = useState<string>(""); // Comma-separated list of user IDs who will split the cost

  // Handle adding a new expense
  const handleAddExpense = async () => {
    if (!itemName.trim()) {
      alert("1");
      return;
    } else if (cost <= 0) {
      alert("2");
      return;
    } else if (!userIds.trim()) {
      alert("3");
      return;
    } else if (!payerId) {
      alert("Please fill in all fields correctly.");
      return;
    }

    const userIdsArray = userIds.split(",").map((id) => id.trim()); // Convert comma-separated list to an array of user IDs

    try {
      const expenseRef = collection(db, "expenses"); // Reference to the 'expenses' collection
      await addDoc(expenseRef, {
        ITEM_NAME: itemName,
        COST: cost,
        PAYER_ID: payerId,
        USER_IDS: userIdsArray,
        // createdAt: Timestamp.now(), // Optional: timestamp for when the expense was added
      });

      // Reset form after submission
      setItemName("");
      setCost(0);
      setUserIds("");
    } catch (error) {
      console.error("Error adding expense: ", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-5 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Add New Expense</h2>

      {/* Form for adding an expense */}
      <div>
        <label htmlFor="itemName" className="block text-gray-700 font-medium">
          Item Name:
        </label>
        <input
          type="text"
          id="itemName"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="w-full p-2 mt-2 border border-gray-300 rounded"
          placeholder="Enter the name of the item"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="cost" className="block text-gray-700 font-medium">
          Cost:
        </label>
        <input
          type="number"
          id="cost"
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
          className="w-full p-2 mt-2 border border-gray-300 rounded"
          placeholder="Enter the cost of the item"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="payerId" className="block text-gray-700 font-medium">
          Payer ID:
        </label>
        <input
          type="text"
          id="payerId"
          value={payerId}
          onChange={(e) => setPayerId(e.target.value)}
          className="w-full p-2 mt-2 border border-gray-300 rounded"
          placeholder="Payer's user ID (automatically set)"
          disabled
        />
      </div>

      <div className="mt-4">
        <label htmlFor="userIds" className="block text-gray-700 font-medium">
          User IDs (comma-separated):
        </label>
        <input
          type="text"
          id="userIds"
          value={userIds}
          onChange={(e) => setUserIds(e.target.value)}
          className="w-full p-2 mt-2 border border-gray-300 rounded"
          placeholder="Enter user IDs splitting the cost"
        />
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          onClick={handleAddExpense}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Add Expense
        </button>
      </div>
    </div>
  );
};

export default Expense;
