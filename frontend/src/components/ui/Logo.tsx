"use client";

import Link from "next/link";

interface LogoProps {
  href?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "light";
  className?: string;
}

export default function Logo({ 
  href = "/", 
  size = "md", 
  variant = "default",
  className = "" 
}: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl", 
    xl: "text-4xl",
    "2xl": "text-[50px]",
  };

  const textColor = variant === "light" ? "text-white" : "text-black dark:text-white";

  const content = (
    <div className={`relative inline-block font-['Google_Sans_Flex'] font-light tracking-wide ${sizeClasses[size]} ${textColor} ${className}`}>
      {/* Highlight/Underline effect */}
      <div 
        className="absolute bottom-[0.2em] left-0 w-full h-[0.24em] bg-[#D60000] opacity-80 -z-0 -skew-x-[20deg]"
      />
      
      {/* Text content */}
      <span className="relative z-10">
        ins<span className="font-extrabold">y</span>dr
      </span>
    </div>
  );

  if (href) {
    return (
      <Link 
        href={href} 
        className="inline-block hover:opacity-90 transition-opacity duration-200"
      >
        {content}
      </Link>
    );
  }

  return content;
}
