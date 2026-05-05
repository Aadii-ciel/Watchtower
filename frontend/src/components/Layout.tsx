import React from 'react';
import { LayoutDashboard, Globe, MapPin, Activity, Settings, Tv, Sun, Moon, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
}

export function Layout({ children, activeTab, setActiveTab, theme, setTheme }: LayoutProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'live', label: 'Live TV', icon: Tv },
    { id: 'global', label: 'Global News', icon: Globe },
    { id: 'local', label: 'Local', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/30 flex flex-col transition-colors duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            <h1 className="text-xl font-bold tracking-wider uppercase text-zinc-900 dark:text-white">Watchtower</h1>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 font-mono uppercase tracking-widest">Global Intel Dash</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                  isActive 
                    ? "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-sm" 
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500")} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Appearance</span>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors relative flex items-center justify-center w-8 h-8 overflow-hidden"
              title="Toggle Theme"
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="dark"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Sun className="w-4 h-4 text-zinc-400 hover:text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="light"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Moon className="w-4 h-4 text-zinc-500 hover:text-zinc-900" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-600 font-mono text-center">
            <p>SYSTEM ONLINE</p>
            <div className="mt-2 w-2 h-2 bg-emerald-500 rounded-full mx-auto animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-zinc-50 dark:bg-[#09090b] transition-colors duration-300">
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center px-8 shrink-0 z-10 sticky top-0 transition-colors duration-300">
          <h2 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 capitalize">
            {tabs.find(t => t.id === activeTab)?.label || 'Overview'}
          </h2>
        </header>
        
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:32px_32px] opacity-40 dark:opacity-20" />
          <div className="relative z-10 mx-auto max-w-7xl h-full">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
}
