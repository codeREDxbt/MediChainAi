"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">MediChainAI</h1>
        <p className="text-xl text-gray-300">Select your portal</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[200px]"
        >
          Admin Terminal
        </button>
        <button
          onClick={() => router.push("/patient/dashboard")}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[200px]"
        >
          Patient Dashboard
        </button>
      </div>
    </div>
  );
}
