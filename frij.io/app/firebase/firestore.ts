import { db } from "./firebaseConfig";
import { collection, addDoc, getDoc, setDoc, doc } from "firebase/firestore";

// 🧑‍💻 Check if user exists in Firestore
export const getUser = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

// 🏠 Create a new fridge (household)
export const createFridge = async (fridgeName: string, ownerId: string) => {
  const fridgeRef = await addDoc(collection(db, "fridges"), {
    name: fridgeName,
    ownerId,
    members: [ownerId], // The owner is automatically a member
    items: [],
  });
  return fridgeRef.id; // Return new fridge ID
};

// 🏠 Assign fridge to user
export const assignFridgeToUser = async (userId: string, fridgeId: string) => {
  await setDoc(doc(db, "users", userId), { fridgeId }, { merge: true });
};
