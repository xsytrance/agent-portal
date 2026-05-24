'use client';

import React from 'react';
import { useAdminConfig } from '@/app/hooks/useAdminConfig';
import { CreditCard } from 'lucide-react';

export default function BudgetControlsPanel() {
  const { config, setBudgetConfig } = useAdminConfig();
  const budgetConfig = config.budgetConfig || {
    sessionBudget: 2500,
    perMinuteLimit: 50,
    warningThreshold: 80,
    criticalThreshold: 95,
    autoDegradation: true,
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
          <CreditCard size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Token Budget Controls</h2>
          <p className="text-sm text-gray-400">Manage agent token limits and degradation</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
          <div>
            <h3 className="font-medium text-white">Auto Degradation</h3>
            <p className="text-sm text-gray-400">Automatically switch to cheaper/free events when budget is low</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={budgetConfig.autoDegradation}
              onChange={(e) => setBudgetConfig({ ...budgetConfig, autoDegradation: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Session Budget (tokens)</label>
            <input
              type="number"
              value={budgetConfig.sessionBudget}
              onChange={(e) => setBudgetConfig({ ...budgetConfig, sessionBudget: parseInt(e.target.value) || 2500 })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Per Minute Limit</label>
            <input
              type="number"
              value={budgetConfig.perMinuteLimit}
              onChange={(e) => setBudgetConfig({ ...budgetConfig, perMinuteLimit: parseInt(e.target.value) || 50 })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Warning Threshold (%)</label>
            <input
              type="number"
              value={budgetConfig.warningThreshold}
              onChange={(e) => setBudgetConfig({ ...budgetConfig, warningThreshold: parseInt(e.target.value) || 80 })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Critical Threshold (%)</label>
            <input
              type="number"
              value={budgetConfig.criticalThreshold}
              onChange={(e) => setBudgetConfig({ ...budgetConfig, criticalThreshold: parseInt(e.target.value) || 95 })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
