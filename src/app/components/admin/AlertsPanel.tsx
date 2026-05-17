import React from 'react';
import { AlertConfig } from '@/app/hooks/useAdminConfig';
import { BellRing, Activity, ShieldAlert } from 'lucide-react';

interface Props {
  config: AlertConfig;
  onChange: (config: AlertConfig) => void;
}

export default function AlertsPanel({ config, onChange }: Props) {
  const updateField = <K extends keyof AlertConfig>(key: K, value: AlertConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="font-bold mb-2 text-xl text-[#1A1A2E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Alert System
          </h3>
          <p className="text-gray-500 text-sm">
            Configure how and when administrators are notified about system thresholds, errors, or anomalies.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateField('enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
        </label>
      </div>

      <div className={`space-y-6 ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>

        {/* Delivery Methods */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <BellRing className="w-5 h-5 text-blue-500" />
            <h4 className="font-bold text-sm">Delivery Configuration</h4>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Webhook URL (Optional)</label>
            <input
              type="text"
              placeholder="https://hooks.slack.com/services/..."
              value={config.webhookUrl || ''}
              onChange={(e) => updateField('webhookUrl', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Alert Cooldown (Seconds)</label>
            <input
              type="number" min={0}
              value={config.alertCooldownSeconds}
              onChange={(e) => updateField('alertCooldownSeconds', parseInt(e.target.value) || 300)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500">Prevents alert spam from repeated events.</span>
          </div>
        </div>

        {/* Anomaly Detection */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
               <Activity className="w-5 h-5 text-purple-500" />
               <h4 className="font-bold text-sm">Anomaly Detection</h4>
            </div>
            <input
                type="checkbox"
                checked={config.unusualActivityEnabled}
                onChange={(e) => updateField('unusualActivityEnabled', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Sensitivity (Sigma)</label>
              <input
                type="number" step={0.1} min={1} max={5}
                value={config.unusualActivityThresholdSigma}
                onChange={(e) => updateField('unusualActivityThresholdSigma', parseFloat(e.target.value) || 3.0)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Baseline Window (Min)</label>
              <input
                type="number" min={10} max={1440}
                value={config.activityBaselineWindowMinutes}
                onChange={(e) => updateField('activityBaselineWindowMinutes', parseInt(e.target.value) || 60)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* System Thresholds */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h4 className="font-bold text-sm">System Thresholds</h4>
          </div>

          <div className="flex items-center mt-2">
             <input
                type="checkbox"
                id="rateLimitWarningEnabled"
                checked={config.rateLimitWarningEnabled}
                onChange={(e) => updateField('rateLimitWarningEnabled', e.target.checked)}
                className="mr-2 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="rateLimitWarningEnabled" className="text-sm font-medium text-gray-700">Alert on Rate Limit Exceeded</label>
          </div>

          <div className="mt-4">
             <label className="block text-sm font-semibold mb-1 text-gray-700">Provider Errors Threshold</label>
              <input
                type="number" min={1} max={10}
                value={config.providerErrorAlertThreshold}
                onChange={(e) => updateField('providerErrorAlertThreshold', parseInt(e.target.value) || 3)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500">Alert when consecutive LLM provider errors exceed this count.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
