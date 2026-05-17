import React from 'react';
import { GlobalPresenceConfig } from '@/app/hooks/useAdminConfig';
import { Settings, PlayCircle, ShieldCheck } from 'lucide-react';

interface Props {
  config: GlobalPresenceConfig;
  onChange: (config: GlobalPresenceConfig) => void;
}

export default function PresenceSettingsPanel({ config, onChange }: Props) {
  const updateField = <K extends keyof GlobalPresenceConfig>(key: K, value: GlobalPresenceConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-bold mb-2 text-xl text-[#1A1A2E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Presence Settings
        </h3>
        <p className="text-gray-500 text-sm">
          Master controls for the Agent&apos;s autonomous behavior presence layer and global rate limitings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Main Master Switch */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <PlayCircle className="w-5 h-5 text-gray-400" />
              <label className="font-semibold text-sm">Master Presence Switch</label>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.presenceEnabled}
                onChange={(e) => updateField('presenceEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
            </label>
          </div>
          <p className="text-xs text-gray-500 ml-8">Turn off to completely disable the entire Behavior Director pipeline.</p>
        </div>

        {/* Runtime Controls */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="w-5 h-5 text-gray-400" />
            <h4 className="font-bold text-sm">Runtime Configuration</h4>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Runtime Mode Override</label>
            <select
              value={config.runtimeModeOverride}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e) => updateField('runtimeModeOverride', e.target.value as any)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="auto">Auto-detect (Recommended)</option>
              <option value="mock">Force Mock</option>
              <option value="development">Force Development</option>
              <option value="production">Force Production</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Log Level</label>
            <select
              value={config.logLevel}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange={(e) => updateField('logLevel', e.target.value as any)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="debug">Debug (Verbose)</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error Only</option>
            </select>
          </div>

          <div className="flex items-center mt-2">
             <input
                type="checkbox"
                id="showMockIndicator"
                checked={config.showMockIndicator}
                onChange={(e) => updateField('showMockIndicator', e.target.checked)}
                className="mr-2 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showMockIndicator" className="text-sm font-medium text-gray-700">Show Mock Indicator in UI</label>
          </div>
        </div>

        {/* Global Limits */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-gray-400" />
            <h4 className="font-bold text-sm">Global Ceilings</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-semibold mb-1 text-gray-700">Global Action Rate Limit</label>
               <input
                 type="number"
                 min={1} max={600}
                 value={config.globalActionRateLimit}
                 onChange={(e) => updateField('globalActionRateLimit', parseInt(e.target.value) || 120)}
                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
               />
               <span className="text-xs text-gray-500">Actions per minute</span>
             </div>

             <div>
               <label className="block text-sm font-semibold mb-1 text-gray-700">Global Event Rate Limit</label>
               <input
                 type="number"
                 min={1} max={300}
                 value={config.globalEventRateLimit}
                 onChange={(e) => updateField('globalEventRateLimit', parseInt(e.target.value) || 30)}
                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
               />
               <span className="text-xs text-gray-500">Autonomous events / min</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
