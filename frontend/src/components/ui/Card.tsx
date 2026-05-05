import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export function Card({ className, children, delay = 0 }: { className?: string, children: React.ReactNode, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut", delay }}
      className={cn("bg-white dark:bg-[#121214] border border-zinc-100 dark:border-zinc-800/60 rounded-2xl shadow-sm dark:shadow-none flex flex-col transition-all duration-300", className)}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("px-6 py-5 flex flex-row items-center justify-between transition-colors duration-300", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string, children: React.ReactNode }) {
  return <h3 className={cn("text-[13px] font-semibold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase", className)}>{children}</h3>;
}

export function CardContent({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("px-6 pb-6 flex-1 overflow-auto", className)}>{children}</div>;
}
