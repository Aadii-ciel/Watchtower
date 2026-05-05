import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, Factory, Landmark, Users } from 'lucide-react';
import { useFundingIntel } from '../../hooks/useApi';
import { cn } from '../../lib/utils';

interface FundingBadgeProps {
  source: string;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export function FundingBadge({ source, className, align = 'left' }: FundingBadgeProps) {
  const { data, isLoading, error } = useFundingIntel(source);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (isLoading) {
    return <div className={cn("w-3.5 h-3.5 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-full", className)} />;
  }

  // If no data and an error occurred (e.g. unknown source and no AI configured)
  if (!data || error) {
    return (
      <div className={cn("relative inline-flex items-center", className)} title="Funding intel unavailable">
        <ShieldAlert className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600" />
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('state') || t.includes('public')) return <Landmark className="w-3 h-3" />;
    if (t.includes('corporate') || t.includes('commercial')) return <Factory className="w-3 h-3" />;
    return <Users className="w-3 h-3" />;
  };

  const alignClass = align === 'center' 
    ? 'left-1/2 -translate-x-1/2 origin-top' 
    : align === 'right' 
      ? 'right-0 origin-top-right' 
      : 'left-0 origin-top-left';

  return (
    <div className={cn("relative inline-flex items-center z-10", className)} ref={popoverRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "transition-colors p-0.5 rounded",
          isOpen ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        )}
        title="View Funding Intel"
      >
        <ShieldCheck className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className={cn("absolute top-full mt-2 w-72 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl p-4 text-left z-50 transform transition-all animate-in fade-in zoom-in-95", alignClass)}>
          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                {data.source}
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              </h4>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mt-0.5">Sponsor Truth Intel</p>
            </div>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-md text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
              {getTypeIcon(data.type)}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Ownership</p>
              <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">{data.owner}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{data.type}</p>
            </div>

            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Funding Profile</p>
              <div className="space-y-1.5 mt-2">
                {data.funding_sources && data.funding_sources.length > 0 ? (
                  data.funding_sources.map((src: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-700 dark:text-zinc-300">{src.name}</span>
                        <span className="text-zinc-900 dark:text-white font-medium">{src.percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full" 
                          style={{ width: `${src.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 italic">No structured funding breakdown available.</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Bias / Lean</p>
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 inline-block px-2 py-0.5 rounded">
                {data.bias}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 mt-3 relative">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic border-l-2 border-zinc-200 dark:border-zinc-700 pl-2">
                "{data.description}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
