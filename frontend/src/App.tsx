import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { GlobalNews } from './pages/GlobalNews';
import { LocalView } from './pages/LocalView';
import { Settings } from './pages/Settings';
import { LiveTV } from './pages/LiveTV';
import { Agents } from './pages/Agents';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} setTheme={setTheme}>
      <div className="animate-in fade-in duration-500 h-full">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'agents' && <Agents />}
        {activeTab === 'live' && <LiveTV />}
        {activeTab === 'global' && <GlobalNews />}
        {activeTab === 'local' && <LocalView />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </Layout>
  );
}

export default App;
