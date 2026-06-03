"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/navigation";

// Floating Molecule Particles Canvas
function MolecularCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const colors = ["rgba(99, 102, 241, 0.4)", "rgba(16, 185, 129, 0.4)", "rgba(45, 212, 191, 0.4)"];

    // Initialize particles
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Attract to mouse
        if (mouse.x > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            p.x += dx * 0.005;
            p.y += dy * 0.005;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

// Main Landing Page
export default function Home() {
  const [logs, setLogs] = useState<string[]>([]);
  const [sessionUser, setSessionUser] = useState<{ name: string; role: string } | null>(null);

  // Load simulated system ticks & auth check
  useEffect(() => {
    const defaultLogs = [
      "🔄 Initializing AasaMedChem precision system...",
      "⚖️ Base conversions verified: 1 kg -> 1000g, 1 L -> 1000mL.",
      "🛡️ Middleware active: Roles [ADMIN, SELLER] mapped.",
      "📈 PostgreSQL Decimal(20,8) precision pipeline online.",
    ];
    setLogs(defaultLogs);

    // Simulated log feed ticker
    const timer = setInterval(() => {
      const liveTicks = [
        "🧪 Calculated item conversion for Chemical Compound USP.",
        "✅ DB Transaction approved for Order #7712.",
        "📊 Logged metric check: Purity level at 99.98%.",
        "🔑 Encryption handshake complete for user session.",
        "📦 Inventory level update: Sodium Chloride stock deducted.",
      ];
      setLogs((prev) => [liveTicks[Math.floor(Math.random() * liveTicks.length)], ...prev.slice(0, 3)]);
    }, 4500);

    // Fetch local user session if possible
    fetch("/api/orders")
      .then((res) => {
        if (res.ok) {
          // If we can read orders, they are logged in.
          // Let's check session through generic call
          return fetch("/api/products");
        }
      })
      .then(() => {
        // Simple client side state to handle link routing
      })
      .catch(() => {});

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Interactive Background */}
      <MolecularCanvas />
      
      {/* Ambient glowing blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[150px] pointer-events-none" />

      {/* Glass Floating Navigation Header */}
      <nav className="relative z-10 mx-auto max-w-7xl px-6 py-5 flex justify-between items-center border-b border-slate-900 bg-slate-950/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 font-extrabold text-lg text-white shadow-lg shadow-indigo-500/20">
            A
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-emerald-100 bg-clip-text text-transparent">
            AasaMedChem
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#features"
            className="hidden md:inline-block text-sm font-semibold text-slate-400 hover:text-white transition"
          >
            Features
          </a>
          <a
            href="/login"
            className="rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-200 transition"
          >
            Access Portal
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Col */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-300">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
            Vercel & Neon Verified Deployment
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            Precision Inventory &{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Chemical Logistics
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
            A robust web terminal built for AasaMedChem. Automates physical weights/volumes conversions, validates stock constraints atomically in database transactions, and manages admin approvals for seller quotation requests.
          </p>

          <div className="pt-4 flex flex-wrap gap-4">
            <a
              href="/login"
              className="flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/35 hover:from-indigo-500 hover:to-violet-500 hover:scale-[1.02] active:scale-[0.98] transition duration-200"
            >
              Sign In to System
            </a>
            <a
              href="#features"
              className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm px-8 py-4 text-base font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white transition duration-200"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Right Col: Chemical Monitor Mock Console */}
        <div className="lg:col-span-5">
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur shadow-2xl overflow-hidden hover:border-slate-700/60 transition duration-300">
            {/* Glossy highlight line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Terminal Monitor v2.1</span>
            </div>

            {/* Core Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Active Compounds</span>
                <strong className="text-white text-lg font-bold">14 Active</strong>
              </div>
              <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3">
                <span className="block text-[10px] text-slate-500 uppercase font-semibold">Purity Target</span>
                <strong className="text-emerald-400 text-lg font-mono font-bold">99.98%</strong>
              </div>
            </div>

            {/* Simulated Live Logs */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Live Stream Logs</span>
              <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 font-mono text-[10px] text-slate-300 min-h-[140px] flex flex-col justify-start gap-2.5">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 items-start opacity-90 border-l border-indigo-500/20 pl-2">
                    <span className="text-indigo-400 font-bold shrink-0">&gt;</span>
                    <span className="leading-normal">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-20 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-extrabold text-white">Full-Stack Capability Architecture</h2>
          <p className="text-slate-400 text-sm">Engineered specifically to fulfill chemical material management criteria with speed and precision.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur hover:bg-slate-900/50 hover:border-indigo-500/30 transition duration-300 shadow-md">
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-xl mb-6 shadow-sm group-hover:scale-110 transition duration-300">
              ⚖️
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Dual Dimensions & Conversions</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Accept orders in kilograms or grams, liters or milliliters. The system converts metrics into base units automatically, preventing stock configuration mismatch.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur hover:bg-slate-900/50 hover:border-emerald-500/30 transition duration-300 shadow-md">
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 font-bold text-xl mb-6 shadow-sm group-hover:scale-110 transition duration-300">
              📈
            </div>
            <h3 className="text-lg font-bold text-white mb-2">8-Decimal Precision Math</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Designed with PostgreSQL Decimal data points. Arithmetic operations use strict precision decimals to avoid floats math inaccuracies.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur hover:bg-slate-900/50 hover:border-teal-500/30 transition duration-300 shadow-md">
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 font-bold text-xl mb-6 shadow-sm group-hover:scale-110 transition duration-300">
              🛡️
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Role-Based Order Handlers</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Provides segregated views. Admins add and modify compounds, while Sellers dynamically estimate pricing and request quotation orders.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-10 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} AasaMedChem Logistics Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/login" className="hover:text-white transition">Sign In</a>
            <span>•</span>
            <a href="#features" className="hover:text-white transition">Documentation</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
