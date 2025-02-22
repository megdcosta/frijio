import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { getUser } from "../firebase/firestore";

export const useRedirect = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't redirect if still checking auth state

    if (!user) {
      router.push("/login"); // Redirect to login page if not authenticated
      return;
    }

    getUser(user.uid).then((userData) => {
      if (userData && userData.fridgeId) {
        router.push(`/fridge/${userData.fridgeId}`); // Redirect to their fridge
      } else {
        router.push("/create-fridge"); // Redirect to create fridge page
      }
    });
  }, [user, loading, router]);
};
