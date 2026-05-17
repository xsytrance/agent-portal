import React from 'react';
import { BudgetConfig } from '@/app/lib/budget/types';
import { Banknote, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  config: BudgetConfig;
  onChange: (config: BudgetConfig) => void;
}

export default function BudgetControlsPanel({ config, onChange }: Props) {
  const updateField = <K extends keyof BudgetConfig>(key: K, value: BudgetConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const updateDegradationField = <K extends keyof BudgetConfig['degradationSettings']>(
    key: K,
    value: BudgetConfig['degradationSettings'][K]
  ) => {
    onChange({
      ...config,
      degradationSettings: {
        ...config.degradationSettings,
        [key]: value,
      },
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-bold mb-2 text-xl text-[#1A1A2E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Budget Controls
        </h3>
        <p className="text-gray-500 text-sm">
          Set caps on LLM requests to control costs and define how the agent gracefully degrades when limits are reached.
        </p>
      </div>

      <div className="space-y-6">
        {/* Session Token Budgets */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <Banknote className="w-5 h-5 text-gray-400" />
            <h4 className="font-bold text-sm">Session Budgets</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-semibold mb-1 text-gray-700">Default Session Budget</label>
               <input
                 type="number"
                 value={config.defaultSessionBudget}
                 onChange={(e) => updateField('defaultSessionBudget', parseInt(e.target.value) || 0)}
                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
               />
               <span className="text-xs text-gray-500">Max tokens per session</span>
             </div>
             <div>
               <label className="block text-sm font-semibold mb-1 text-gray-700">Production Mode Budget</label>
               <input
                 type="number"
                 value={config.productionModeBudget}
                 onChange={(e) => updateField('productionModeBudget', parseInt(e.target.value) || 0)}
                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
               />
               <span className="text-xs text-gray-500">Used if runtime is &apos;production&apos;</span>
             </div>
          </div>
        </div>

        {/* Status Thresholds */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h4 className="font-bold text-sm">Status Thresholds</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div>
               <label className="block text-sm font-semibold mb-1 text-gray-700">Warning Threshold</label>
               <div className="flex items-center">
                 <input
                   type="number"
                   step="0.05"
                   min="0" max="1"
                   value={config.warningThreshold}
                   onChange={(e) => updateField('warningThreshold', parseFloat(e.target.value) || 0)}
                   className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                 />
               </div>
             </div>
             <div>
               <label className="block text-sm font-semibold mb-1 text-gray-700">Critical Threshold</label>
               <input
                 type="number"
                 step="0.05"
                 min="0" max="1"
                 value={config.criticalThreshold}
                 onChange={(e) => updateField('criticalThreshold', parseFloat(e.target.value) || 0)}
                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
               />
             </div>
             <div>
               <label className="block text-sm font-semibold mb-1 text-gray-700">Exhausted Threshold</label>
               <input
                 type="number"
                 step="0.05"
                 min="0" max="1"
                 value={config.exhaustedThreshold}
                 onChange={(e) => updateField('exhaustedThreshold', parseFloat(e.target.value) || 0)}
                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
               />
             </div>
          </div>
        </div>

        {/* Degradation Settings */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-gray-400" />
            <h4 className="font-bold text-sm">Graceful Degradation</h4>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
             <label className="text-sm font-medium text-gray-700">Use only templates in Critical</label>
             <input
                type="checkbox"
                checked={config.degradationSettings.criticalUseOnlyTemplates}
                onChange={(e) => updateDegradationField('criticalUseOnlyTemplates', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
             />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
             <label className="text-sm font-medium text-gray-700">Allow 1 emergency call in Critical</label>
             <input
                type="checkbox"
                checked={config.degradationSettings.criticalAllowEmergency}
                onChange={(e) => updateDegradationField('criticalAllowEmergency', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
             />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
             <label className="text-sm font-medium text-gray-700">Fallback to mock responses on Exhausted</label>
             <input
                type="checkbox"
                checked={config.degradationSettings.exhaustedUseMock}
                onChange={(e) => updateDegradationField('exhaustedUseMock', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
             />
          </div>
        </div>
      </div>
    </div>
  );
}
