'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '@/app/context/AgentContext';
import { useAdminConfig } from '@/app/hooks/useAdminConfig';
import {
  Key,
  Bot,
  Zap,
  Sparkles,
  FileText,
  List,
  ArrowLeft,
  Settings,
  CreditCard,
} from 'lucide-react';

import PresenceSettingsPanel from '@/app/components/admin/PresenceSettingsPanel';
import BudgetControlsPanel from '@/app/components/admin/BudgetControlsPanel';
import ApiKeysPanel from '@/app/components/admin/ApiKeysPanel';
import AgentConfigPanel from '@/app/components/admin/AgentConfigPanel';
import AutonomousLoopPanel from '@/app/components/admin/AutonomousLoopPanel';
import FeaturesPanel from '@/app/components/admin/FeaturesPanel';
import PromptsPanel from '@/app/components/admin/PromptsPanel';
import LogsPanel from '@/app/components/admin/LogsPanel';

type PanelKey = 'apikeys' | 'agents' | 'autonomous' | 'features' | 'prompts' | 'logs' | 'presence' | 'budget';

interface SidebarItem {
  key: PanelKey;
  label: string;
  icon: typeof Key;
  section: 'configuration' | 'system';
}

const sidebarItems: SidebarItem[] = [
  { key: 'apikeys', label: 'API Keys', icon: Key, section: 'configuration' },
  { key: 'agents', label: 'Agent Config', icon: Bot, section: 'configuration' },
  { key: 'autonomous', label: 'Autonomous Loop', icon: Zap, section: 'configuration' },
  { key: 'presence', label: 'Presence Settings', icon: Settings, section: 'configuration' },
  { key: 'budget', label: 'Budget Controls', icon: CreditCard, section: 'configuration' },
  { key: 'features', label: 'Features', icon: Sparkles, section: 'configuration' },
  { key: 'prompts', label: 'Prompts', icon: FileText, section: 'system' },
  { key: 'logs', label: 'Logs', icon: List, section: 'system' },
];

const easeOut = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Admin() {
  const { activeAgent } = useAgent();
  const {
    config,
    setApiKeys,
    setAgentConfigs,
    setAutonomousConfig,
    setFeatureFlags,
    setPromptConfigs,
    clearLogs,
  } = useAdminConfig();

  const [activePanel, setActivePanel] = useState<PanelKey>('apikeys');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const primaryColor = activeAgent.primaryColor;

  const renderPanel = useCallback(() => {
    switch (activePanel) {
      case 'apikeys':
        return <ApiKeysPanel apiKeys={config.apiKeys} onChange={setApiKeys} />;
      case 'agents':
        return <AgentConfigPanel agentConfigs={config.agentConfigs} onChange={setAgentConfigs} />;
      case 'autonomous':
        return (
          <AutonomousLoopPanel
            config={config.autonomousConfig}
            onChange={setAutonomousConfig}
          />
        );
      case 'presence':
        return <PresenceSettingsPanel />;
      case 'budget':
        return <BudgetControlsPanel />;
      case 'features':
        return <FeaturesPanel features={config.featureFlags} onChange={setFeatureFlags} />;
      case 'prompts':
        return <PromptsPanel promptConfigs={config.promptConfigs} onChange={setPromptConfigs} />;
      case 'logs':
        return <LogsPanel logs={config.logs} onClear={clearLogs} />;
      default:
        return null;
    }
  }, [
    activePanel,
    config,
    setApiKeys,
    setAgentConfigs,
    setAutonomousConfig,
    setFeatureFlags,
    setPromptConfigs,
    clearLogs,
  ]);

  const configTabs = sidebarItems.filter((s) => s.section === 'configuration');
  const systemTabs = sidebarItems.filter((s) => s.section === 'system');

  return (
    <div
      className="min-h-[100dvh] pt-16"
      style={{ backgroundColor: '#FFF9F0' }}
    >
      <div
        className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 transition-colors"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#64748B',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
            >
              <ArrowLeft size={14} />
              Back to Site
            </Link>
          </div>
          <h1
            className="font-bold"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
              fontWeight: 700,
              color: '#1A1A2E',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Admin Panel
          </h1>
          <p
            className="mt-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9375rem',
              color: '#64748B',
              lineHeight: 1.55,
            }}
          >
            Control room for agent configuration
          </p>
        </motion.div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Tab Bar */}
          <div className="lg:hidden overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-1 min-w-max">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActivePanel(item.key)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all whitespace-nowrap"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      backgroundColor: activePanel === item.key ? primaryColor : '#F1F5F9',
                      color: activePanel === item.key ? '#fff' : '#64748B',
                    }}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.1 }}
            className="hidden lg:block w-[260px] flex-shrink-0"
          >
            <nav className="py-6">
              {/* Config Section */}
              <div className="mb-2 px-4">
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#64748B',
                    textTransform: 'uppercase',
                  }}
                >
                  Configuration
                </span>
              </div>
              <div className="space-y-0.5 mb-6">
                {configTabs.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activePanel === item.key;
                  return (
                    <motion.button
                      key={item.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + index * 0.05, duration: 0.3 }}
                      onClick={() => setActivePanel(item.key)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] transition-all"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                        backgroundColor: isActive ? 'rgba(255, 107, 53, 0.12)' : 'transparent',
                        color: isActive ? '#FF6B35' : '#64748B',
                        borderLeft: isActive ? '3px solid #FF6B35' : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 107, 53, 0.06)';
                          e.currentTarget.style.color = '#1A1A2E';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#64748B';
                        }
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="mx-4 mb-6" style={{ borderTop: '1px solid #F1F5F9' }} />

              {/* System Section */}
              <div className="mb-2 px-4">
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: '#64748B',
                    textTransform: 'uppercase',
                  }}
                >
                  System
                </span>
              </div>
              <div className="space-y-0.5">
                {systemTabs.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activePanel === item.key;
                  return (
                    <motion.button
                      key={item.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.05, duration: 0.3 }}
                      onClick={() => setActivePanel(item.key)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] transition-all"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.9375rem',
                        fontWeight: 500,
                        backgroundColor: isActive ? 'rgba(255, 107, 53, 0.12)' : 'transparent',
                        color: isActive ? '#FF6B35' : '#64748B',
                        borderLeft: isActive ? '3px solid #FF6B35' : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 107, 53, 0.06)';
                          e.currentTarget.style.color = '#1A1A2E';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#64748B';
                        }
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Reset Button */}
              <div className="mt-8 px-4">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-2.5 px-4 rounded-[10px] transition-all"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#64748B',
                    border: '1px solid #CBD5E1',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.borderColor = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748B';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                >
                  Reset to Defaults
                </button>
              </div>
            </nav>
          </motion.aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut, delay: 0.15 }}
              className="p-6 sm:p-8"
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderPanel()}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Mobile Reset Button */}
            <div className="lg:hidden mt-6">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 rounded-[10px] transition-all"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#64748B',
                  border: '1px solid #CBD5E1',
                  backgroundColor: 'transparent',
                }}
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirm Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-sm p-8"
              style={{ backgroundColor: '#fff', borderRadius: 20 }}
            >
              <h3
                className="font-bold mb-3"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
                  color: '#1A1A2E',
                }}
              >
                Reset to Defaults
              </h3>
              <p
                className="mb-6"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                  color: '#64748B',
                  lineHeight: 1.55,
                }}
              >
                This will reset all settings to factory defaults. Your API keys and custom agents will be lost. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-full transition-all"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#64748B',
                    backgroundColor: 'transparent',
                    border: '1px solid #CBD5E1',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="flex-1 py-3 rounded-full text-white transition-all hover:brightness-110"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    backgroundColor: '#ef4444',
                  }}
                >
                  Reset All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
