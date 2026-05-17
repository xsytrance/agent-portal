import React from 'react';
import { SafetyGuardrails } from '@/app/hooks/useAdminConfig';
import { ShieldAlert, ServerCrash, Clock, Ban } from 'lucide-react';

interface Props {
  config: SafetyGuardrails;
  onChange: (config: SafetyGuardrails) => void;
}

export default function SafetyGuardrailsPanel({ config, onChange }: Props) {
  const updateField = <K extends keyof SafetyGuardrails>(key: K, value: SafetyGuardrails[K]) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-bold mb-2 text-xl text-[#1A1A2E]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Safety Guardrails
        </h3>
        <p className="text-gray-500 text-sm">
          Configure hard limits, provider resilience, and abuse prevention systems.
        </p>
      </div>

      <div className="space-y-6">
        {/* Abuse Prevention */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <Ban className="w-5 h-5 text-red-500" />
            <h4 className="font-bold text-sm">Abuse Prevention & Limits</h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Max LLM Calls / Session</label>
              <input
                type="number" min={1} max={500}
                value={config.maxLLMCallsPerSession}
                onChange={(e) => updateField('maxLLMCallsPerSession', parseInt(e.target.value) || 50)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Max Concurrent Sessions</label>
              <input
                type="number" min={1} max={100}
                value={config.maxConcurrentSessions}
                onChange={(e) => updateField('maxConcurrentSessions', parseInt(e.target.value) || 10)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Max Payload Size (Bytes)</label>
              <input
                type="number" min={1024}
                value={config.maxPayloadSizeBytes}
                onChange={(e) => updateField('maxPayloadSizeBytes', parseInt(e.target.value) || 65536)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Max Session Duration (Min)</label>
              <input
                type="number" min={5}
                value={config.maxSessionDurationMinutes}
                onChange={(e) => updateField('maxSessionDurationMinutes', parseInt(e.target.value) || 120)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center mt-4">
             <input
                type="checkbox"
                id="blockRepeatedPayloads"
                checked={config.blockRepeatedPayloads}
                onChange={(e) => updateField('blockRepeatedPayloads', e.target.checked)}
                className="mr-2 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="blockRepeatedPayloads" className="text-sm font-medium text-gray-700">Block repeated identical payloads</label>
          </div>
        </div>

        {/* Provider Resilience */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <ServerCrash className="w-5 h-5 text-gray-400" />
            <h4 className="font-bold text-sm">Provider Resilience</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Max Errors Before Mock</label>
              <input
                type="number" min={1} max={10}
                value={config.maxProviderErrorsBeforeMock}
                onChange={(e) => updateField('maxProviderErrorsBeforeMock', parseInt(e.target.value) || 3)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Mock Fallback Duration (Min)</label>
              <input
                type="number" min={1} max={60}
                value={config.mockFallbackDurationMinutes}
                onChange={(e) => updateField('mockFallbackDurationMinutes', parseInt(e.target.value) || 10)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h4 className="font-bold text-sm">API Rate Limiting</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Rate Limit Window (Sec)</label>
              <input
                type="number" min={10}
                value={config.rateLimitWindowSeconds}
                onChange={(e) => updateField('rateLimitWindowSeconds', parseInt(e.target.value) || 60)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Max Requests / Window</label>
              <input
                type="number" min={1}
                value={config.maxRequestsPerWindow}
                onChange={(e) => updateField('maxRequestsPerWindow', parseInt(e.target.value) || 100)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
