'use client';

import { useState } from 'react';
import { useAgent } from '@/app/context/AgentContext';
import type { PromptConfig } from '@/app/hooks/useAdminConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';

interface PromptsPanelProps {
  promptConfigs: PromptConfig[];
  onChange: (configs: PromptConfig[]) => void;
}

type TabKey = 'system' | 'greeting' | 'idle' | 'demo';

export default function PromptsPanel({ promptConfigs, onChange }: PromptsPanelProps) {
  const { agents } = useAgent();
  const { activeAgent } = useAgent();
  const primaryColor = activeAgent.primaryColor;
  const [activeTab, setActiveTab] = useState<TabKey>('system');
  const [activeAgentId, setActiveAgentId] = useState(agents[0]?.id || 'nova');
  const [savedToast, setSavedToast] = useState(false);
  const [newIdleMessage, setNewIdleMessage] = useState('');
  const [newDemoResponse, setNewDemoResponse] = useState('');

  const configIndex = promptConfigs.findIndex((p) => p.agentId === activeAgentId);
  const config = promptConfigs[configIndex] || promptConfigs[0];

  const updateConfig = (updates: Partial<PromptConfig>) => {
    const updated = promptConfigs.map((p, i) =>
      i === configIndex ? { ...p, ...updates } : p
    );
    onChange(updated);
  };

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const addIdleMessage = () => {
    const trimmed = newIdleMessage.trim();
    if (!trimmed || config.welcomeMessages.length >= 20) return;
    updateConfig({ welcomeMessages: [...config.welcomeMessages, trimmed] });
    setNewIdleMessage('');
  };

  const removeIdleMessage = (index: number) => {
    updateConfig({
      welcomeMessages: config.welcomeMessages.filter((_, i) => i !== index),
    });
  };

  const addDemoResponse = () => {
    const trimmed = newDemoResponse.trim();
    if (!trimmed) return;
    // Store demo responses as additional messages
    updateConfig({ welcomeMessages: [...config.welcomeMessages, `[demo] ${trimmed}`] });
    setNewDemoResponse('');
  };

  const removeDemoResponse = (index: number) => {
    updateConfig({
      welcomeMessages: config.welcomeMessages.filter((_, i) => i !== index),
    });
  };

  const demoResponses = config.welcomeMessages.filter((m) => m.startsWith('[demo] '));
  const idleMessages = config.welcomeMessages.filter((m) => !m.startsWith('[demo] '));

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'system', label: 'System Prompt' },
    { key: 'greeting', label: 'Greeting' },
    { key: 'idle', label: 'Idle Messages' },
    { key: 'demo', label: 'Demo Responses' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h3
          className="font-bold mb-2"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
            color: '#1A1A2E',
          }}
        >
          Prompts & Personality
        </h3>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9375rem',
            color: '#64748B',
            lineHeight: 1.55,
          }}
        >
          Edit how your agents speak and behave.
        </p>
      </div>

      {/* Agent Selector */}
      <div className="flex gap-2 mb-6">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setActiveAgentId(agent.id)}
            className="px-4 py-2 rounded-full transition-all"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: activeAgentId === agent.id ? agent.primaryColor : '#F1F5F9',
              color: activeAgentId === agent.id ? '#fff' : '#64748B',
            }}
          >
            {agent.name}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1" style={{ backgroundColor: '#F1F5F9', borderRadius: 12 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg transition-all"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: activeTab === tab.key ? '#fff' : 'transparent',
              color: activeTab === tab.key ? '#1A1A2E' : '#64748B',
              boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeAgentId}-${activeTab}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'system' && (
            <div>
              <label
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#1A1A2E',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                SYSTEM PROMPT
              </label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
                maxLength={2000}
                rows={8}
                className="w-full px-4 py-3 text-white outline-none resize-none"
                style={{
                  backgroundColor: 'rgba(26, 26, 46, 0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.875rem',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.boxShadow = `0 0 12px ${primaryColor}4D`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <div className="text-right mt-1">
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6875rem',
                    color: '#64748B',
                  }}
                >
                  {config.systemPrompt.length} / 2000
                </span>
              </div>
            </div>
          )}

          {activeTab === 'greeting' && (
            <div>
              <label
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#1A1A2E',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                GREETING MESSAGE
              </label>
              <textarea
                value={idleMessages[0] || ''}
                onChange={(e) => {
                  const msgs = [...idleMessages];
                  msgs[0] = e.target.value;
                  updateConfig({ welcomeMessages: [...msgs, ...demoResponses] });
                }}
                maxLength={500}
                rows={4}
                placeholder={`Hello! I'm ${agents.find((a) => a.id === activeAgentId)?.name || 'the agent'}. How can I help you today?`}
                className="w-full px-4 py-3 text-white outline-none resize-none"
                style={{
                  backgroundColor: 'rgba(26, 26, 46, 0.6)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.boxShadow = `0 0 12px ${primaryColor}4D`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          )}

          {activeTab === 'idle' && (
            <div>
              <label
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#1A1A2E',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                IDLE MESSAGES
              </label>
              <p
                className="mb-4"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.8125rem',
                  color: '#64748B',
                  lineHeight: 1.55,
                }}
              >
                Messages the agent speaks when idle. One is chosen randomly. Max 20.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {idleMessages.map((msg, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1.5"
                    style={{
                      backgroundColor: '#F1F5F9',
                      borderRadius: 8,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.8125rem',
                      color: '#1A1A2E',
                    }}
                  >
                    {msg.length > 40 ? msg.substring(0, 40) + '...' : msg}
                    <button
                      onClick={() => removeIdleMessage(index)}
                      className="ml-1 p-0.5 rounded"
                      style={{ color: '#CBD5E1' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newIdleMessage}
                  onChange={(e) => setNewIdleMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addIdleMessage()}
                  placeholder="Type a message and press Enter"
                  className="flex-1 px-4 py-2.5 text-white outline-none"
                  style={{
                    backgroundColor: 'rgba(26, 26, 46, 0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = primaryColor;
                    e.currentTarget.style.boxShadow = `0 0 12px ${primaryColor}4D`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={addIdleMessage}
                  className="p-2.5 rounded-xl text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'demo' && (
            <div>
              <label
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#1A1A2E',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                DEMO RESPONSES
              </label>
              <p
                className="mb-4"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.8125rem',
                  color: '#64748B',
                  lineHeight: 1.55,
                }}
              >
                Mock responses shown in the demo chat panel.
              </p>
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {demoResponses.length === 0 && (
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.875rem',
                      color: '#CBD5E1',
                      fontStyle: 'italic',
                    }}
                  >
                    No demo responses yet. Add some below.
                  </p>
                )}
                {demoResponses.map((msg, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 px-3 py-2.5"
                    style={{
                      backgroundColor: '#F1F5F9',
                      borderRadius: 8,
                    }}
                  >
                    <span
                      className="flex-1"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.8125rem',
                        color: '#1A1A2E',
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.replace('[demo] ', '')}
                    </span>
                    <button
                      onClick={() => {
                        const allIndex = config.welcomeMessages.indexOf(msg);
                        if (allIndex !== -1) removeDemoResponse(allIndex);
                      }}
                      className="p-0.5 rounded flex-shrink-0"
                      style={{ color: '#CBD5E1' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDemoResponse}
                  onChange={(e) => setNewDemoResponse(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDemoResponse()}
                  placeholder="Type a mock response..."
                  className="flex-1 px-4 py-2.5 text-white outline-none"
                  style={{
                    backgroundColor: 'rgba(26, 26, 46, 0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = primaryColor;
                    e.currentTarget.style.boxShadow = `0 0 12px ${primaryColor}4D`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  onClick={addDemoResponse}
                  className="p-2.5 rounded-xl text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Save Button */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-full text-white transition-all hover:brightness-110 hover:scale-105"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            backgroundColor: primaryColor,
          }}
        >
          {savedToast ? (
            <span className="flex items-center gap-2">
              <Check size={14} />
              Saved!
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
        <button
          onClick={() => {
            const defaultConfig = promptConfigs[configIndex];
            if (defaultConfig) {
              updateConfig({
                systemPrompt: `You are ${agents.find((a) => a.id === activeAgentId)?.name || 'the agent'}.`,
                welcomeMessages: [],
                personalityDescription: '',
                responseStyle: 'conversational',
              });
            }
          }}
          className="px-4 py-3 rounded-full transition-all"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#64748B',
            backgroundColor: 'transparent',
          }}
        >
          Reset
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 right-4 z-50 px-4 py-3 flex items-center gap-2"
            style={{
              backgroundColor: 'rgba(255, 249, 240, 0.95)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#22c55e' }}
            />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#1A1A2E',
              }}
            >
              Prompts updated for {agents.find((a) => a.id === activeAgentId)?.name}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
