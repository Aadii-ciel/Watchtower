import { Globe, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useGlobalNews, useConfig } from '../hooks/useApi';
import { cn } from '../lib/utils';
import { FundingBadge } from '../components/ui/FundingBadge';

export function GlobalNews() {
  const { data: news, isLoading } = useGlobalNews();
  const { data: config } = useConfig();

  const getThreatColor = (level: number) => {
    switch (level) {
      case 4: return 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-200 dark:border-rose-500/20'; // Critical
      case 3: return 'bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-200 dark:border-orange-500/20'; // High
      case 2: return 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-200 dark:border-yellow-500/20'; // Medium
      case 1: return 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-200 dark:border-blue-500/20'; // Low
      default: return 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/20'; // Info/None
    }
  };

  const getThreatLabel = (level: number) => {
    switch (level) {
      case 4: return 'CRITICAL';
      case 3: return 'HIGH';
      case 2: return 'MEDIUM';
      case 1: return 'LOW';
      default: return 'INFO';
    }
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2" delay={0.1}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <CardTitle>Global Intelligence Feed</CardTitle>
            </div>
            <div className="text-xs text-zinc-500 font-mono">
              SOURCES: {config?.feeds?.global?.length || 0} ACTIVE
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="animate-pulse flex flex-col gap-2">
                     <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                     <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
                   </div>
                 ))}
              </div>
            ) : news?.length > 0 ? (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                {news.map((item: any, i: number) => (
                  <div key={i} className="p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                         <span className={cn("px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border", getThreatColor(item.ThreatLevel))}>
                           {getThreatLabel(item.ThreatLevel)}
                         </span>
                         <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400/80 uppercase tracking-wide">
                           {item.Source}
                         </span>
                         <FundingBadge source={item.Source} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-600 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(item.Published || new Date()).toLocaleDateString()}
                      </div>
                    </div>
                    <a href={item.URL} target="_blank" rel="noopener noreferrer" className="block mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      <h4 className="text-base font-medium text-zinc-800 dark:text-zinc-200 leading-snug flex items-center gap-2">
                        {item.Title}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 dark:text-zinc-500" />
                      </h4>
                    </a>
                    {item.Category && (
                      <p className="text-sm text-zinc-500 mt-2 line-clamp-2 leading-relaxed capitalize">
                        Category: {item.Category}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500">
                No global news available.
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Potentially Add Country Risk Index here later */}
        <Card className="h-fit" delay={0.2}>
          <CardHeader>
             <div className="flex items-center gap-2">
               <AlertTriangle className="w-4 h-4 text-orange-500 dark:text-orange-400" />
               <CardTitle>System Status</CardTitle>
             </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Data Pipeline</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-zinc-800 dark:text-zinc-200 text-sm">Operational</span>
                </div>
             </div>
             <div className="p-4 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">LLM Provider</p>
                <div className="text-zinc-800 dark:text-zinc-200 text-sm capitalize">{config?.LLMProvider || 'Unknown'}</div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
