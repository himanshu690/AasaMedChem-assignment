"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ChemicalLoader from "@/components/ChemicalLoader";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
      } else if (result?.ok) {
        if (email.toLowerCase() === "admin@example.com") {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard/seller");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  const fillCredentials = (role: "admin" | "seller") => {
    if (role === "admin") {
      setEmail("admin@example.com");
      setPassword("password123");
    } else {
      setEmail("seller@example.com");
      setPassword("password123");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-8 backdrop-blur-xl shadow-2xl shadow-indigo-500/10">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
            A
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
            AasaMedChem Portal
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Inventory & Order Management System
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-950/50 border border-red-500/30 p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="relative block w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-3 text-white placeholder-slate-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-3 text-white placeholder-slate-400 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition duration-200 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? (
                <ChemicalLoader size="sm" text="" />
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-800 pt-6">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quick Fill Demo Accounts
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => fillCredentials("admin")}
              className="flex flex-col items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 hover:bg-emerald-950/40 transition text-left"
            >
              <span className="text-xs font-bold text-emerald-400">Admin Account</span>
              <span className="text-[10px] text-slate-400 mt-1">Full control</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("seller")}
              className="flex flex-col items-center justify-center rounded-lg border border-blue-500/30 bg-blue-950/20 p-3 hover:bg-blue-950/40 transition text-left"
            >
              <span className="text-xs font-bold text-blue-400">Seller Account</span>
              <span className="text-[10px] text-slate-400 mt-1">Browse & Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}