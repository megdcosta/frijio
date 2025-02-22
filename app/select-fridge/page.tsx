"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { createFridge, joinFridgeById, getUser } from "../firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export default function SelectFridgePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fridgeName, setFridgeName] = useState("");
  const [fridgeId, setFridgeId] = useState("");
  const [userFridges, setUserFridges] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // For dropdown visibility
  const [selectedFridge, setSelectedFridge] = useState<any>(null); // For storing selected fridge

  useEffect(() => {
    if (!user) return;

    const fetchFridges = async () => {
      const userData = await getUser(user.uid);
      if (userData && userData.fridgeIds) {
        const userFridgeData = await Promise.all(
          userData.fridgeIds.map(async (fridgeId: string) => {
            const fridgeRef = doc(db, "fridges", fridgeId);
            const fridgeSnap = await getDoc(fridgeRef);
            return fridgeSnap.exists() ? { id: fridgeSnap.id, ...fridgeSnap.data() } : null;
          })
        );
        setUserFridges(userFridgeData.filter(Boolean));
      }
    };

    fetchFridges();
  }, [user]);

  const handleCreateFridge = async () => {
    setError("");
    if (!user || fridgeName.trim() === "") return;
    try {
      const fridgeId = await createFridge(fridgeName, user.uid);
      router.push(`/fridge/${fridgeId}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJoinFridge = async () => {
    setError("");
    if (!user || fridgeId.trim() === "") {
      setError("Please enter a valid Fridge ID.");
      return;
    }
    try {
      await joinFridgeById(user.uid, fridgeId);
      router.push(`/fridge/${fridgeId}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectFridge = (fridge: any) => {
    setSelectedFridge(fridge); // Set the selected fridge
    setIsDropdownOpen(false); // Close the dropdown
    router.push(`/fridge/${fridge.id}`); // Navigate to the selected fridge
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      {error && <p className="text-red-500">{error}</p>}
      {/* If the user has fridges, allow them to select from a list */}
      {userFridges.length > 0 && (
        <div className="px-20 mb-6 w-full max-w-md">

          {/* Dropdown Button */}
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="p-2 border border-white w-sm max-w-md text-white px-4 py-2 rounded-xl w-full font-semibold font-sans"
          >
            {selectedFridge ? selectedFridge.name : "Select Your Fridge"}
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              <ul className="py-1">
                {userFridges.map((fridge) => (
                  <li
                    key={fridge.id}
                    className="cursor-pointer p-2 hover:bg-gray-200 rounded"
                    onClick={() => handleSelectFridge(fridge)}
                  >
                    {fridge.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Option to Join a Fridge by Entering an ID */}
      <div className="bg-white py-16 px-24 rounded-[35px] shadow-sm mb-6 w-full max-w-xl grid place-items-center">
      <h1 className="text-3xl font-bold mb-4 font-playpen text-text">Add a Fridge</h1>

          <input
            type="text"
            placeholder="Enter Fridge ID"
            value={fridgeId}
            onChange={(e) => setFridgeId(e.target.value)}
            className="w-full p-2 border border-text rounded-full mb-2 text-center bg-transparent text-text placeholder-[#796d6d]"
          />
          <button
            onClick={handleJoinFridge}
            className="bg-text text-white px-4 py-2 rounded-full w-full font-semibold font-sans"
          >
            Join Fridge
          </button>
        {/* </div> */}

        {/* Option to Create a New Fridge */}
          <p className="text-sm m-4 font-sans font-semibold text-text">OR</p>
          <input
            type="text"
            placeholder="Fridge Name"
            value={fridgeName}
            onChange={(e) => setFridgeName(e.target.value)}
            className="w-full p-2 border border-text rounded-full mb-2 text-center bg-transparent text-text placeholder-[#796d6d]"
          />
          <button
            onClick={handleCreateFridge}
            className="bg-text text-white px-4 py-2 rounded-full w-full font-semibold font-sans"
          >
            Create New Fridge
          </button>
        {/* </div> */}
      </div>
    </div>
  );
}
