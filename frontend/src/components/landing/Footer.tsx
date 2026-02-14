"use client";

import Logo from '@/src/components/ui/Logo';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Footer() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      } 
    }
  };

  const letterVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { 
        type: "spring" as const, 
        damping: 12, 
        stiffness: 100 
      } 
    }
  };

  return (
    <footer className="bg-background border-t border-border pt-20 pb-10 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-24 gap-12">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-['Google_Sans_Flex'] font-medium tracking-tight text-foreground">
              Experience the future <br /> of work.
            </h2>
          </div>
          
          <div className="flex gap-16 md:gap-24">
            <div className="flex flex-col gap-4">
              <Link href="/features" className="text-foreground text-sm hover:text-primary transition-colors">Features</Link>
              <Link href="/use-cases" className="text-foreground text-sm hover:text-primary transition-colors">Use Cases</Link>
              <Link href="/pricing" className="text-foreground text-sm hover:text-primary transition-colors">Pricing</Link>
              <Link href="/changelog" className="text-foreground text-sm hover:text-primary transition-colors">Changelog</Link>
            </div>
            <div className="flex flex-col gap-4">
              <Link href="https://docs.insydr.ai" target="_blank" className="text-foreground text-sm hover:text-primary transition-colors">Documentation</Link>
              <Link href="/api" className="text-foreground text-sm hover:text-primary transition-colors">API Reference</Link>
              <Link href="/blog" className="text-foreground text-sm hover:text-primary transition-colors">Blog</Link>
              <Link href="/community" className="text-foreground text-sm hover:text-primary transition-colors">Community</Link>
            </div>
          </div>
        </div>

        {/* Middle Section - Giant Text */}
        <div className="w-full flex justify-center mb-12 select-none px-4 overflow-hidden">
          <div className="relative inline-block group cursor-default">
            {/* Highlight/Underline effect */}
            <motion.div 
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 0.9 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "circOut", delay: 0.6 }}
              className="absolute bottom-[0.1em] left-[-0.1em] w-[calc(100%+0.2em)] h-[0.5em] bg-[#D60000] -z-0 -skew-x-[20deg] origin-left group-hover:scale-x-110 group-hover:opacity-100 transition-transform duration-500"
            />
            {/* Text content */}
            <motion.h1 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              className="relative z-10 text-[20vw] md:text-[14vw] leading-[0.8] font-['Google_Sans_Flex'] font-light tracking-tighter text-foreground text-center"
            >
              {"ins".split("").map((letter, i) => (
                <motion.span key={i} variants={letterVariants} className="inline-block">{letter}</motion.span>
              ))}
              <motion.span variants={letterVariants} className="inline-block font-extrabold">y</motion.span>
              {"dr".split("").map((letter, i) => (
                <motion.span key={i} variants={letterVariants} className="inline-block">{letter}</motion.span>
              ))}
            </motion.h1>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 pt-8 border-t border-border/40">
          <div className="flex flex-col gap-2">
             <Logo size="md" variant="default" />
             <p className="text-muted-foreground text-xs mt-2">
               &copy; {new Date().getFullYear()} Insydr AI Inc.
             </p>
          </div>

          <div className="flex gap-6 text-sm text-foreground/60">
             <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
             <Link href="/careers" className="hover:text-foreground transition-colors">Careers</Link>
             <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
             <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
