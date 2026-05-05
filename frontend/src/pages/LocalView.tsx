import { useState } from 'react';
import { MapPin, BrainCircuit, RefreshCw, Thermometer, Wind, Droplets } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useConfig, useWeather, useLocalNews, generateLocalBrief } from '../hooks/useApi';

export function LocalView() {
  const { data: config } = useConfig();
  const city = config?.Location?.City || 'New York';
  const country = config?.Location?.Country || '';
  
  const { data: weather, isLoading: weatherLoading } = useWeather(undefined, undefined, city);
  const { data: localNews, isLoading: newsLoading } = useLocalNews(city, country);
  
  const [brief, setBrief] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBrief = async () => {
    if (!localNews || !weather) return;
    setIsGenerating(true);
    try {
      const result = await generateLocalBrief({
        city,
        news: localNews,
        conditions: weather.conditions,
        forecast: weather.forecast || [],
        force_refresh: true
      });
      setBrief(result.Summary || result.summary || "No brief was returned.");
    } catch (error) {
      console.error(error);
      setBrief("Failed to generate local brief.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column */}
      <div className="space-y-6 flex flex-col h-full">
        {/* Local Weather Detailed */}
        <Card className="shrink-0" delay={0.1}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <CardTitle>Local Conditions: {city}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {weatherLoading ? (
              <div className="animate-pulse h-24 bg-zinc-200 dark:bg-zinc-800/50 rounded-lg"></div>
            ) : weather?.conditions ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-5xl font-light text-zinc-900 dark:text-white mb-2">{weather.conditions.TempC}°C</div>
                    <div className="text-lg text-zinc-600 dark:text-zinc-400 capitalize">{weather.conditions.Description}</div>
                    <div className="text-sm text-zinc-500 mt-1">Feels like {weather.conditions.FeelsLikeC}°C</div>
                  </div>
                  {weather.conditions.Icon && (
                    <div className="text-6xl opacity-80">{weather.conditions.Icon}</div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                    <Thermometer className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                    <div>
                      <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">UV Index</span>
                      <span className="text-sm text-zinc-800 dark:text-zinc-200">{weather.conditions.UVIndex}</span>
                    </div>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                    <Wind className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <div>
                      <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Wind</span>
                      <span className="text-sm text-zinc-800 dark:text-zinc-200">{weather.conditions.WindSpeedKmh} km/h</span>
                    </div>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                    <Droplets className="w-4 h-4 text-blue-400 dark:text-blue-300" />
                    <div>
                      <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Humidity</span>
                      <span className="text-sm text-zinc-800 dark:text-zinc-200">{weather.conditions.Humidity}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-zinc-500">Weather unavailable.</p>
            )}
          </CardContent>
        </Card>

        {/* Local Intel Brief */}
        <Card className="flex-1 min-h-[300px]" delay={0.2}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <CardTitle>Local Situation Report</CardTitle>
            </div>
            <button 
              onClick={handleGenerateBrief}
              disabled={isGenerating || !localNews || !weather}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-500/10 hover:bg-purple-200 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 rounded-md transition-colors text-xs font-medium disabled:opacity-50"
            >
               <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Analyzing...' : 'Generate Sitrep'}
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
                  <p className="text-sm text-center max-w-xs">Run an AI analysis of local weather, news, and conditions to generate a detailed situation report.</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Local News */}
      <Card delay={0.3}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <CardTitle>Local Intelligence Feed</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {newsLoading ? (
             <div className="p-6">Loading news...</div>
          ) : localNews?.length > 0 ? (
             <div className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
               {localNews.map((item: any, i: number) => (
                  <div key={i} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase block mb-1">
                      {item.Source || 'LOCAL SOURCE'}
                    </span>
                    <a href={item.URL} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors">
                      {item.Title}
                    </a>
                    {item.Category && (
                      <p className="text-xs text-zinc-500 mt-2 line-clamp-2 uppercase">
                        {item.Category}
                      </p>
                    )}
                  </div>
               ))}
             </div>
          ) : (
             <div className="p-8 text-center text-zinc-500">
               No local intelligence available.
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
