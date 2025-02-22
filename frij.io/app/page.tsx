import AuthForm from "../app/components/AuthForm";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Welcome to Frij.io</h1>
      <AuthForm />
    </div>
  );
}
