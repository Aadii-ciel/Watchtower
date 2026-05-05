import { useState } from 'react';
import { Cloud, BrainCircuit, Activity, LineChart, TrendingUp, RefreshCw, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { 
  useWeather, 
  useConfig, 
  useCryptoMarkets, 
  useStockMarkets, 
  useCommodityMarkets, 
  usePolymarket,
  useGlobalNews,
  generateGlobalBrief
} from '../hooks/useApi';

export function Overview() {
  const { data: config } = useConfig();
  const { data: weather, isLoading: weatherLoading } = useWeather(undefined, undefined, config?.Location?.City || 'New York');
  
  const { data: crypto } = useCryptoMarkets();
  const { data: stocks } = useStockMarkets();
  const { data: commodities } = useCommodityMarkets();
  
  const { data: polymarket } = usePolymarket();
  const { data: globalNews } = useGlobalNews();
  
  const [brief, setBrief] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBrief = async () => {
    if (!globalNews) return;
    setIsGenerating(true);
    try {
      const result = await generateGlobalBrief(globalNews, true);
      setBrief(result.Summary || result.summary || "No brief was returned.");
    } catch (error) {
      console.error(error);
      setBrief("Failed to generate brief.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Top Left: Weather Panel */}
      <Card delay={0.1}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <CardTitle>Local Conditions ({weather?.conditions?.City || 'Loading...'})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {weatherLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
            </div>
          ) : weather?.conditions ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-end gap-4">
                <span className="text-5xl font-light text-zinc-900 dark:text-white">{weather.conditions.TempC}°C</span>
                <span className="text-lg text-zinc-500 dark:text-zinc-400 mb-1">{weather.conditions.Description}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">Humidity</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{weather.conditions.Humidity}%</span>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">Wind</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{weather.conditions.WindSpeedKmh} km/h</span>
                </div>
              </div>
            </div>
          ) : (
            <span className="text-zinc-500">Weather data unavailable</span>
          )}
        </CardContent>
      </Card>

      {/* Top Right: Intel Brief Panel */}
      <Card delay={0.2}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <CardTitle>Global AI Intel Brief</CardTitle>
          </div>
          <button 
            onClick={handleGenerateBrief}
            disabled={isGenerating || !globalNews}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-500/10 hover:bg-purple-200 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 rounded-md transition-colors text-xs font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Refresh Brief'}
          </button>
        </CardHeader>
        <CardContent className="overflow-auto relative">
          {brief ? (
            <div className="prose prose-sm max-w-none text-zinc-700 dark:text-zinc-300">
              {brief.split('\n').map((line, i) => (
                <p key={i} className="leading-relaxed mb-2">{line}</p>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 gap-4">
              <BrainCircuit className="w-12 h-12 opacity-20" />
              <p className="text-sm">No intel brief generated yet.</p>
              <button 
                onClick={handleGenerateBrief}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300 rounded-lg transition-colors text-sm"
              >
                Generate Brief Now
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Left: Markets Panel */}
      <Card delay={0.3}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <CardTitle>Global Markets</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Crypto */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> Digital Assets
            </h4>
            <div className="space-y-2">
              {crypto?.slice(0, 3)?.map((item: any) => (
                <div key={item.Symbol} className="flex justify-between items-center text-sm p-2 bg-zinc-100 dark:bg-zinc-800/30 rounded">
                  <span className="font-medium text-zinc-800 dark:text-zinc-300">{item.Symbol}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-900 dark:text-white">${parseFloat(item.PriceUSD).toLocaleString()}</span>
                    <span className={parseFloat(item.Change24h) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                      {parseFloat(item.Change24h) > 0 ? '+' : ''}{parseFloat(item.Change24h).toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Stocks */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
              <LineChart className="w-3 h-3" /> Indices
            </h4>
            <div className="grid grid-cols-2 gap-2">
               {stocks?.map((item: any) => (
                <div key={item.Symbol} className="p-3 bg-zinc-100 dark:bg-zinc-800/30 rounded flex flex-col gap-1">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.Symbol}</span>
                  <span className="text-sm text-zinc-900 dark:text-white">${parseFloat(item.Price).toLocaleString()}</span>
                  <span className={cn("text-xs font-medium", parseFloat(item.ChangePct) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {parseFloat(item.ChangePct) > 0 ? '+' : ''}{parseFloat(item.ChangePct).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Commodities */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Commodities
            </h4>
            <div className="grid grid-cols-2 gap-2">
               {commodities?.map((item: any) => (
                <div key={item.Symbol} className="p-3 bg-zinc-100 dark:bg-zinc-800/30 rounded flex flex-col gap-1">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.Symbol}</span>
                  <span className="text-sm text-zinc-900 dark:text-white">${parseFloat(item.Price).toLocaleString()}</span>
                  <span className={cn("text-xs font-medium", parseFloat(item.ChangePct) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {parseFloat(item.ChangePct) > 0 ? '+' : ''}{parseFloat(item.ChangePct).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Right: Prediction Markets Panel */}
      <Card delay={0.4}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-orange-500 dark:text-orange-400" />
            <CardTitle>Prediction Markets</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
             {polymarket?.length > 0 ? polymarket.slice(0, 5).map((market: any, idx: number) => (
               <div key={idx} className="p-3 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-lg">
                 <p className="text-sm text-zinc-700 dark:text-zinc-200 mb-3">{market.Title}</p>
                 <div className="flex gap-2">
                    <div className="flex-1 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-transparent p-2 rounded text-center">
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Yes</span>
                      <span className="block text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {Math.round(market.Probability * 100)}%
                      </span>
                    </div>
                 </div>
               </div>
             )) : (
               <p className="text-sm text-zinc-500">No active prediction markets.</p>
             )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
