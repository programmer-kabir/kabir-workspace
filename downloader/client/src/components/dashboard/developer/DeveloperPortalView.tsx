import React, { useState } from 'react';
import {
  Code2,
  Key,
  BarChart3,
  Terminal,
  Radio,
  FileCode,
  Sparkles
} from 'lucide-react';
import { ApiKeyManagement } from './ApiKeyManagement';
import { ApiAnalytics } from './ApiAnalytics';
import { ApiRequestLogs } from './ApiRequestLogs';
import { WebhookManagement } from './WebhookManagement';
import { ApiDocumentation } from './ApiDocumentation';
import { useAuth } from '../../../context/AuthContext';

export const DeveloperPortalView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'keys' | 'analytics' | 'logs' | 'webhooks' | 'docs'>('keys');

  const tabs = [
    { id: 'keys', label: 'API Keys', icon: Key },
    { id: 'analytics', label: 'Usage Analytics', icon: BarChart3 },
    { id: 'logs', label: 'Request Logs', icon: Terminal },
    { id: 'webhooks', label: 'Webhooks', icon: Radio },
    { id: 'docs', label: 'API Documentation', icon: FileCode }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60 border border-indigo-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Developer Platform</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
              {user?.plan || 'Free'} Tier Access
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Code2 className="w-7 h-7 text-indigo-400" />
            <span>Developer API & Webhooks</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Programmatically query media extraction, dispatch background download jobs, and manage Webhooks.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('docs')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span>Interactive Docs</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab View Rendering */}
      <div>
        {activeTab === 'keys' && <ApiKeyManagement />}
        {activeTab === 'analytics' && <ApiAnalytics />}
        {activeTab === 'logs' && <ApiRequestLogs />}
        {activeTab === 'webhooks' && <WebhookManagement />}
        {activeTab === 'docs' && <ApiDocumentation />}
      </div>

    </div>
  );
};
