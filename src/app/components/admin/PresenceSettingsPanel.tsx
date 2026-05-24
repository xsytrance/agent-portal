'use client';

import React from 'react';
import { useAdminConfig } from '@/app/hooks/useAdminConfig';
import { Settings } from 'lucide-react';

export default function PresenceSettingsPanel() {
  const { config, setPresenceConfig } = useAdminConfig();
  const presenceConfig = config.presenceConfig || {
    masterToggle: true,
    runtimeMode: 'development',
    globalActionRateLimit: 5,
    silenceMode: true,
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
          <Settings size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Presence Settings</h2>
          <p className="text-sm text-gray-400">Master controls for agent presence</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
          <div>
            <h3 className="font-medium text-white">Master Toggle</h3>
            <p className="text-sm text-gray-400">Enable or disable presence layer entirely</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={presenceConfig.masterToggle}
              onChange={(e) => setPresenceConfig({ ...presenceConfig, masterToggle: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
          <div>
            <h3 className="font-medium text-white">Silence Mode</h3>
            <p className="text-sm text-gray-400">Enable silence visual expressions</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={presenceConfig.silenceMode}
              onChange={(e) => setPresenceConfig({ ...presenceConfig, silenceMode: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Runtime Mode</label>
            <select
              value={presenceConfig.runtimeMode}
              onChange={(e) => setPresenceConfig({ ...presenceConfig, runtimeMode: e.target.value as 'mock' | 'development' | 'production' })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="mock">Mock</option>
              <option value="development">Development</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Global Action Rate Limit (per min)</label>
            <input
              type="number"
              value={presenceConfig.globalActionRateLimit}
              onChange={(e) => setPresenceConfig({ ...presenceConfig, globalActionRateLimit: parseInt(e.target.value) || 5 })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
