"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-[#F1EFD8] p-4">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold">frij.io</div>
        <nav>
          <ul className="flex space-x-6 font-semibold font-sans">
            <li
              className="cursor-pointer hover:underline"
              onClick={() => router.push("/")}
            >
              Home
            </li>
            <li
              className="cursor-pointer hover:underline"
              onClick={() => router.push("/features")}
            >
              Features
            </li>
            <li
              className="cursor-pointer hover:underline"
              onClick={() => router.push("/about")}
            >
              About
            </li>
            <li
              className="cursor-pointer hover:underline"
              onClick={() => router.push("/contact")}
            >
              Contact
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 py-12">
        <section className="text-center max-w-3xl">
          <h1 className="text-5xl font-bold mb-6 font-playpen">
            Welcome to frij.io
          </h1>
          <p className="text-xl mb-8 font-semibold font-sans">
            Simplify food management and enhance communication in your
            household. Track fridge and pantry items, manage shared grocery
            lists, and split expenses effortlessly.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="border-2 border-[#F1EFD8] px-6 py-2 rounded-full hover:bg-white hover:text-[#5E7A80] transition font-semibold"
          >
            Get Started
          </button>
        </section>
        {/* Features Section */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center font-sans font-semibold">
          {/* Fridge Management */}
          <div className="p-6 bg-green rounded-3xl shadow-md">
            <h3 className="text-2xl font-bold mb-4 font-playpen">
              Fridge Management
            </h3>
            <div className="relative w-full aspect-video mb-4">
              <Image
                src="/images/milk.png"
                alt="Milk in fridge"
                fill
                className="object-contain"
              />
            </div>
            <p>
              Easily add, remove, and search for items in your fridge to reduce
              waste and avoid duplicate purchases.
            </p>
          </div>

          {/* Grocery Lists */}
          <div className="p-6 bg-white rounded-3xl shadow-md text-text">
            <h3 className="text-2xl font-bold mb-4 font-playpen">
              Grocery Lists
            </h3>
            <div className="relative w-full aspect-video mb-4">
              <Image
                src="/images/grocery.png"
                alt="Groceries"
                fill
                className="object-contain"
              />
            </div>
            <p>
              Collaborate with roommates to create and update a shared shopping
              list—with links to local stores for added convenience.
            </p>
          </div>

          {/* Expense Tracking */}
          <div className="p-6 bg-green rounded-3xl shadow-md">
            <h3 className="text-2xl font-bold mb-4 font-playpen">
              Expense Tracking
            </h3>
            <div className="relative w-full aspect-video mb-4">
              <Image
                src="/images/money.png"
                alt="Money"
                fill
                className="object-contain"
              />
            </div>
            <p>
              Seamlessly split costs on shared groceries, keeping everyone in
              the loop on who paid and who owes.
            </p>
          </div>
        </section>

        {/* Team Section */}
        <section className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Meet the Hackers</h2>
          <p className="mb-8">
            Eleazar, Emily, Megan, and Leon built frij.io during an innovative
            hackathon.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p>&copy; {new Date().getFullYear()} frij.io. All rights reserved.</p>
      </footer>
    </div>
  );
}
