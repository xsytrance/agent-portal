'use client';

import React from 'react';
import { useAdminConfig } from '@/app/hooks/useAdminConfig';
import { Shield } from 'lucide-react';

export function SafetyGuardrailsPanel() {
  const { config, updateConfig } = useAdminConfig();

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-500/20 text-red-400 rounded-lg">
          <Shield size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Safety Guardrails</h2>
          <p className="text-sm text-gray-400">Hard stops and boundaries</p>
        </div>
      </div>

      <div className="space-y-6">
         <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
          <div>
            <h3 className="font-medium text-white">Mock Indicator</h3>
            <p className="text-sm text-gray-400">Show visual badge when responses are simulated</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={config.safety?.showMockIndicator ?? true}
              onChange={(e) => updateConfig('safety', { showMockIndicator: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Session Duration (min)</label>
            <input
              type="number"
              value={config.safety?.maxSessionDurationMinutes ?? 60}
              onChange={(e) => updateConfig('safety', { maxSessionDurationMinutes: parseInt(e.target.value) })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Idle Timeout (min)</label>
            <input
              type="number"
              value={config.safety?.idleTimeoutMinutes ?? 30}
              onChange={(e) => updateConfig('safety', { idleTimeoutMinutes: parseInt(e.target.value) })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Error Retries</label>
              <input
                type="number"
                value={config.safety?.maxProviderErrors ?? 5}
                onChange={(e) => updateConfig('safety', { maxProviderErrors: parseInt(e.target.value) })}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>
        </div>
      </div>
    </div>
  );
}
