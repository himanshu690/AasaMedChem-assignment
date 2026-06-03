import React from "react";

export default function ChemicalLoader({
  size = "md",
  text = "Loading...",
}: {
  size?: "sm" | "md" | "lg";
  text?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  const textClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-4">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Beaker Flask SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 120"
          className="w-full h-full fill-none stroke-indigo-500 stroke-[5] stroke-linecap-round"
        >
          {/* Flask rim & neck */}
          <path d="M 38 10 H 62" />
          <path d="M 43 10 V 35 L 20 85 A 10 10 0 0 0 30 100 H 70 A 10 10 0 0 0 80 85 L 57 35 V 10" />

          {/* Bubbling elements inside the flask */}
          <circle cx="48" cy="70" r="3" className="animate-chem-bubble-1 fill-emerald-400 stroke-none" />
          <circle cx="38" cy="80" r="2.5" className="animate-chem-bubble-2 fill-teal-400 stroke-none" />
          <circle cx="62" cy="75" r="3.5" className="animate-chem-bubble-3 fill-indigo-400 stroke-none" />
          <circle cx="52" cy="85" r="2" className="animate-chem-bubble-4 fill-sky-400 stroke-none" />

          {/* Wave liquid background */}
          <path
            d="M 23 83 C 35 78, 45 88, 55 83 C 65 78, 70 85, 77 83 V 98 H 23 Z"
            className="fill-indigo-500/20 stroke-none"
          />
        </svg>
      </div>

      {text && (
        <span className={`${textClasses[size]} font-semibold text-slate-400 animate-pulse tracking-wider`}>
          {text}
        </span>
      )}
    </div>
  );
}
