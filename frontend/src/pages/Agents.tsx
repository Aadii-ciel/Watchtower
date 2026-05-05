import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Wrench, ShieldAlert, Globe, TrendingUp, CloudRain } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tools?: { name: string; args: string; result?: string; status: 'running' | 'done' }[];
};

const PERSONAS = [
  { id: 'Geopolitical Strategist', icon: Globe, desc: 'Focuses on international relations, conflicts, and global events.' },
  { id: 'Cybersecurity Analyst', icon: ShieldAlert, desc: 'Expert in cyber threats, data breaches, and digital security.' },
  { id: 'Financial Markets Analyst', icon: TrendingUp, desc: 'Analyzes market trends, crypto, and economic shifts.' },
  { id: 'Meteorologist', icon: CloudRain, desc: 'Specializes in severe weather tracking and natural disasters.' },
];

export function Agents() {
  const [activePersona, setActivePersona] = useState(PERSONAS[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const historyForApi = messages.map(m => ({ role: m.role, content: m.content }));
    historyForApi.push({ role: 'user', content: userMsg.content });

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', tools: [] }]);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: activePersona, history: historyForApi }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                setMessages(prev => prev.map(msg => {
                  if (msg.id !== assistantMsgId) return msg;
                  const newMsg = { ...msg };

                  if (data.type === 'message') {
                    newMsg.content += data.content;
                  } else if (data.type === 'tool_start') {
                    if (!newMsg.tools) newMsg.tools = [];
                    newMsg.tools.push({ name: data.content, args: data.data, status: 'running' });
                  } else if (data.type === 'tool_end') {
                    if (newMsg.tools) {
                      const toolIdx = newMsg.tools.findIndex(t => t.name === data.content && t.status === 'running');
                      if (toolIdx !== -1) {
                        newMsg.tools[toolIdx].result = data.data;
                        newMsg.tools[toolIdx].status = 'done';
                      }
                    }
                  } else if (data.type === 'error') {
                     newMsg.content += `\n\n**[System Error: ${data.content}]**`;
                  }
                  return newMsg;
                }));
              } catch (e) {
                console.error("Error parsing SSE:", e, line);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const newMsgs = [...prev];
        const last = newMsgs[newMsgs.length - 1];
        if (last.role === 'assistant') {
          last.content = "Connection error while reaching the agent.";
        }
        return newMsgs;
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar - Personas */}
      <div className="w-64 shrink-0 flex flex-col gap-4">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Select Persona</h3>
        {PERSONAS.map(p => {
          const Icon = p.icon;
          const isActive = activePersona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setActivePersona(p.id)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all duration-200",
                isActive 
                  ? "bg-indigo-500/10 border-indigo-500/30" 
                  : "bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              <div className="flex items-center gap-2 font-medium text-sm text-zinc-900 dark:text-zinc-100">
                <Icon className={cn("w-4 h-4", isActive ? "text-indigo-500" : "text-zinc-500")} />
                {p.id}
              </div>
              <span className="text-xs text-zinc-500 line-clamp-2">{p.desc}</span>
            </button>
          )
        })}
      </div>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl border-zinc-200 dark:border-zinc-800">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              <div className="text-center">
                <Bot className="w-12 h-12 mx-auto mb-4 text-zinc-400 opacity-50" />
                <p>Chat with your {activePersona}</p>
                <p className="text-xs mt-2 opacity-75">The agent can autonomously fetch news, weather, and browse the web.</p>
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto" : "")}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-indigo-500" />
                  </div>
                )}
                
                <div className={cn(
                  "flex flex-col gap-2", 
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  {msg.tools && msg.tools.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800">
                      <Wrench className={cn("w-3 h-3", t.status === 'running' ? "animate-spin text-indigo-500" : "text-emerald-500")} />
                      <span>{t.name}({t.args})</span>
                      {t.status === 'done' && <span className="text-emerald-500 ml-1">✓</span>}
                    </div>
                  ))}
                  
                  {msg.content && (
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                      msg.role === 'user' 
                        ? "bg-indigo-600 text-white rounded-tr-sm" 
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm"
                    )}>
                      {msg.content}
                    </div>
                  )}
                  {msg.role === 'assistant' && !msg.content && (!msg.tools || msg.tools.length === 0 || msg.tools[msg.tools.length-1].status === 'done') && (
                    <div className="flex gap-1 items-center px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-sm h-11">
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                      <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask the ${activePersona} to research something...`}
              disabled={isTyping}
              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
