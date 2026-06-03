import { auth } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  let dashboardUrl = "/login";
  if (session?.user) {
    dashboardUrl = session.user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/seller";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.08),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.05),transparent_40%)]" />

      <main className="relative z-10 flex max-w-4xl flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-500 shadow-xl shadow-indigo-500/20 text-white font-extrabold text-2xl">
          A
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-white via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
          AasaMedChem
        </h1>
        <p className="mt-2 text-lg font-medium text-emerald-400 tracking-widest uppercase">
          Inventory & Logistics Portal
        </p>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
          A high-precision, real-time chemical inventory tracking and quotation ordering platform. Built to support dual weight/volume dimensions, instant unit conversion (g, kg, L, mL, item), and automated stock level controls.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          {session?.user ? (
            <Link
              href={dashboardUrl}
              className="flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition duration-200"
            >
              Go to Dashboard ({session.user.name})
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition duration-200"
              >
                Sign In to System
              </Link>
              <a
                href="#features"
                className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/50 px-8 py-4 text-base font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition duration-200"
              >
                Learn More
              </a>
            </>
          )}
        </div>
      </main>

      <section id="features" className="relative z-10 mx-auto mt-24 max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-lg mb-4">
              ⚖️
            </div>
            <h3 className="text-lg font-bold text-white">Dual Dimensions</h3>
            <p className="mt-2 text-sm text-slate-400">
              Track materials in weights (grams, kilograms) or volumes (milliliters, liters), plus standard items, automatically handled through robust conversion algorithms.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-lg mb-4">
              📈
            </div>
            <h3 className="text-lg font-bold text-white">High Decimal Precision</h3>
            <p className="mt-2 text-sm text-slate-400">
              Database fields and computations designed for high-precision science (up to 8 decimal places using PostgreSQL Decimal types).
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 font-bold text-lg mb-4">
              🛡️
            </div>
            <h3 className="text-lg font-bold text-white">Role-Based Access</h3>
            <p className="mt-2 text-sm text-slate-400">
              Admin CRUD and Order Approval dashboards paired with Seller Browse, Conversion Estimator, and Order creation portals.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-20 py-8 text-center text-xs text-slate-500 border-t border-slate-900 w-full max-w-5xl">
        &copy; {new Date().getFullYear()} AasaMedChem Logistics Inc. All rights reserved.
      </footer>
    </div>
  );
}
