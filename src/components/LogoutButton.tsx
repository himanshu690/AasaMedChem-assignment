"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() =>
        signOut({
          callbackUrl: "/login",
        })
      }
      className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-2 text-sm font-semibold text-slate-300 transition duration-150 hover:bg-red-950/20 hover:border-red-500/40 hover:text-red-400 focus:outline-none"
    >
      <span>Sign Out</span>
      <span className="text-xs">🚪</span>
    </button>
  );
}