import { useState } from 'react';
import { Tv, Radio } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { FundingBadge } from '../components/ui/FundingBadge';

// We use the YouTube embed URL with a live_stream parameter for channels that have 24/7 streams.
// Format: https://www.youtube.com/embed/live_stream?channel=CHANNEL_ID
const CHANNELS = [
  // GLOBAL & EUROPE
  { id: 'sky', name: 'Sky News', region: 'Europe', channelId: 'UCoMdktPbSTixAyNGwb-PUkQ', color: 'bg-rose-500' },
  { id: 'dw', name: 'DW News', region: 'Europe', channelId: 'UCknLrEdhRCp1aegoMqRaCZg', color: 'bg-blue-600' },
  { id: 'france24', name: 'France 24', region: 'Europe', channelId: 'UCCXP6icHcUMYAuzoZBtEXcg', color: 'bg-indigo-500' },
  
  // AMERICAS
  { id: 'abc', name: 'ABC News', region: 'Americas', channelId: 'UCBi2mrWuNuyYy4gbM6fU18Q', color: 'bg-blue-500' },
  { id: 'nbc', name: 'NBC News', region: 'Americas', channelId: 'UCeY0bbntWzzVIaj2z3QigXg', color: 'bg-purple-500' },
  { id: 'globalnews', name: 'Global News Canada', region: 'Americas', channelId: 'UChLtXXpo4Ge1ReTEboVvTDg', color: 'bg-red-600' },

  // ASIA & PACIFIC
  { id: 'cna', name: 'CNA (Channel News Asia)', region: 'Asia', channelId: 'UC83jt4dlz1Gjl58fzQrrKZg', color: 'bg-rose-600' },
  { id: 'abcau', name: 'ABC News Australia', region: 'Asia', channelId: 'UCvsye7V9psc-APX6wV1twLg', color: 'bg-zinc-500' },

  // INDIA
  { id: 'indiatoday', name: 'India Today', region: 'India', channelId: 'UCYPvAwZP8pZhSMW8qsGHEHQ', color: 'bg-rose-500' },
  { id: 'ndtv', name: 'NDTV 24x7', region: 'India', channelId: 'UCZFMm1mMw0F81Z37aaEzTUA', color: 'bg-orange-500' },
  { id: 'wion', name: 'WION', region: 'India', channelId: 'UC_gUM8rL-LrgXIGhW59vdAQ', color: 'bg-blue-400' },
  { id: 'republic', name: 'Republic TV', region: 'India', channelId: 'UCwwdKJseZWzSEZzgk94S5_A', color: 'bg-red-600' },
  { id: 'aajtak', name: 'Aaj Tak', region: 'India', channelId: 'UCt4t-jeY85JegMlZ-E5UWtA', color: 'bg-red-500' },

  // MIDDLE EAST
  { id: 'aljazeera', name: 'Al Jazeera English', region: 'Middle East', channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg', color: 'bg-amber-500' },
];

const REGIONS = ['All', 'Americas', 'Europe', 'Middle East', 'Asia', 'India'];

export function LiveTV() {
  const [activeRegion, setActiveRegion] = useState('All');
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);

  const filteredChannels = activeRegion === 'All' 
    ? CHANNELS 
    : CHANNELS.filter(c => c.region === activeRegion);

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Header and Region Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg border border-rose-200 dark:border-rose-500/20">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">Live Global News</h2>
            <p className="text-sm text-zinc-500">24/7 continuous broadcast streams</p>
          </div>
        </div>

        <div className="flex bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800/50 overflow-x-auto custom-scrollbar">
          {REGIONS.map(region => (
            <button
              key={region}
              onClick={() => {
                setActiveRegion(region);
                const firstInRegion = CHANNELS.find(c => region === 'All' || c.region === region);
                if (firstInRegion) setActiveChannel(firstInRegion);
              }}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all",
                activeRegion === region 
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" 
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
              )}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Main Stage (Video Player) */}
        <Card className="lg:col-span-3 flex flex-col bg-zinc-100/50 dark:bg-black/40 border-zinc-200 dark:border-zinc-800/80 overflow-hidden backdrop-blur-sm" delay={0.1}>
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-white/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{activeChannel.name}</h3>
              <FundingBadge source={activeChannel.name} className="ml-1" />
            </div>
            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-500 uppercase px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded">
              {activeChannel.region}
            </span>
          </div>
          <CardContent className="p-0 flex-1 relative bg-black aspect-video lg:aspect-auto">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/live_stream?channel=${activeChannel.channelId}&autoplay=1&mute=1&modestbranding=1&rel=0`}
              title={`${activeChannel.name} Live Stream`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </CardContent>
        </Card>

        {/* Channel Grid (Sidebar) */}
        <Card className="flex flex-col overflow-hidden bg-white/50 dark:bg-zinc-900/20 backdrop-blur-sm" delay={0.2}>
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40">
            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-300 flex items-center gap-2">
              <Tv className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              Available Channels
            </h3>
          </div>
          <CardContent className="p-2 overflow-y-auto custom-scrollbar flex-1">
            <div className="flex flex-col gap-1.5">
              {filteredChannels.map(channel => (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all",
                    activeChannel.id === channel.id
                      ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                      : "bg-transparent border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", channel.color)} />
                  <div className="flex-1 overflow-hidden">
                    <p className={cn(
                      "text-sm truncate transition-colors",
                      activeChannel.id === channel.id ? "text-zinc-900 dark:text-white font-medium" : "text-zinc-600 dark:text-zinc-400"
                    )}>
                      {channel.name}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
                      {channel.region}
                    </p>
                  </div>
                  {activeChannel.id === channel.id && (
                     <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
