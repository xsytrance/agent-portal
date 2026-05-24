'use client';

import React from 'react';
import { useAdminConfig } from '@/app/hooks/useAdminConfig';
import { Bell } from 'lucide-react';

export function AlertsPanel() {
  const { config, updateConfig } = useAdminConfig();

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
          <Bell size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">System Alerts</h2>
          <p className="text-sm text-gray-400">Configure alert delivery and thresholds</p>
        </div>
      </div>

      <div className="space-y-6">
         <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
          <div>
            <h3 className="font-medium text-white">Email Alerts</h3>
            <p className="text-sm text-gray-400">Receive critical budget and safety alerts via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={config.alerts?.emailAlertsEnabled ?? false}
              onChange={(e) => updateConfig('alerts', { emailAlertsEnabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

         <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
          <div>
            <h3 className="font-medium text-white">Webhook Alerts</h3>
            <p className="text-sm text-gray-400">Forward alerts to an external webhook (e.g., Slack, Discord)</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={config.alerts?.webhookAlertsEnabled ?? false}
              onChange={(e) => updateConfig('alerts', { webhookAlertsEnabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Alert Email Address</label>
              <input
                type="email"
                placeholder="admin@example.com"
                value={config.alerts?.alertEmail ?? ''}
                onChange={(e) => updateConfig('alerts', { alertEmail: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Alert Webhook URL</label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={config.alerts?.alertWebhookUrl ?? ''}
                onChange={(e) => updateConfig('alerts', { alertWebhookUrl: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
        </div>
      </div>
    </div>
  );
}
