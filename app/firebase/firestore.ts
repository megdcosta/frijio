import { db } from "./firebaseConfig";
import { collection, addDoc, getDoc, setDoc, updateDoc, doc, arrayUnion, deleteDoc } from "firebase/firestore";

// 🧑‍💻 Get User Data (Supports Multiple Fridges)
export const getUser = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

// 🏠 Create a New Fridge (Limit to 5 Fridges)
export const createFridge = async (fridgeName: string, ownerId: string) => {
  const userData = await getUser(ownerId);
  
  if (userData && userData.fridgeIds.length >= 5) {
    throw new Error("You can only have up to 5 fridges.");
  }

  const fridgeRef = await addDoc(collection(db, "fridges"), {
    name: fridgeName,
    ownerId,
    members: [ownerId], // Owner is auto-added
    items: [],
  });

  await assignFridgeToUser(ownerId, fridgeRef.id);
  return fridgeRef.id;
};

// 🏠 Assign a Fridge to a User (Limit to 5 Fridges)
export const assignFridgeToUser = async (userId: string, fridgeId: string) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data();
    if (userData.fridgeIds.length >= 5) {
      throw new Error("You can only join up to 5 fridges.");
    }
    await updateDoc(userRef, {
      fridgeIds: arrayUnion(fridgeId),
    });
  } else {
    await setDoc(userRef, { fridgeIds: [fridgeId] });
  }
};

// 🔑 Join a Fridge by Entering Fridge ID
export const joinFridgeById = async (userId: string, fridgeId: string) => {
  const fridgeRef = doc(db, "fridges", fridgeId);
  const fridgeSnap = await getDoc(fridgeRef);

  if (!fridgeSnap.exists()) {
    throw new Error("Invalid Fridge ID. Please check again.");
  }

  const fridgeData = fridgeSnap.data();
  
  // Prevent duplicates
  if (fridgeData.members.includes(userId)) {
    throw new Error("You are already a member of this fridge.");
  }

  // Add the user as a member
  await updateDoc(fridgeRef, {
    members: arrayUnion(userId),
  });

  // Add the fridge to user's list
  await assignFridgeToUser(userId, fridgeId);
};

// Add this to your firestore.ts
export const deleteItem = async (fridgeId: string, itemId: string) => {
  const itemRef = doc(db, "fridges", fridgeId, "items", itemId);
  await deleteDoc(itemRef);
};