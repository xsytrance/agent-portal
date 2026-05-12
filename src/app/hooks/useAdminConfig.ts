'use client';

import { useState, useEffect, useCallback } from 'react';
import { agentsData } from '@/app/lib/agents/starterAgents';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  model: string;
  isActive: boolean;
  createdAt: number;
}

export interface AgentConfigData {
  id: string;
  name: string;
  role: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  avatar: string;
  welcomeMessage: string;
  personality: string[];
  isActive: boolean;
  order: number;
}

export interface AutonomousConfig {
  enabled: boolean;
  checkIntervalSeconds: number;
  idleThresholdSeconds: number;
  cooldownSeconds: number;
  actions: {
    eyeSpeech: boolean;
    cardShuffle: boolean;
    themePulse: boolean;
    demoHint: boolean;
    particleBurst: boolean;
  };
}

export interface FeatureFlags {
  floatingEye: boolean;
  cursorTrail: boolean;
  particleBackground: boolean;
  chatPanel: boolean;
  autonomousActions: boolean;
  eyeSpeechBubbles: boolean;
  themeSwitching: boolean;
  mockChatDemo: boolean;
  reducedMotion: boolean;
  soundEffects: boolean;
}

export interface PromptConfig {
  agentId: string;
  systemPrompt: string;
  welcomeMessages: string[];
  personalityDescription: string;
  responseStyle: 'concise' | 'conversational' | 'detailed' | 'playful';
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'autonomous';
  source: string;
  message: string;
}

export interface AdminConfig {
  apiKeys: ApiKey[];
  agentConfigs: AgentConfigData[];
  autonomousConfig: AutonomousConfig;
  featureFlags: FeatureFlags;
  promptConfigs: PromptConfig[];
  logs: LogEntry[];
}

const STORAGE_KEY = 'agent-portal-config';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function getDefaultAgentConfigs(): AgentConfigData[] {
  return agentsData.map((agent, index) => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    description: agent.description,
    primaryColor: agent.primaryColor,
    secondaryColor: agent.secondaryColor,
    glowColor: agent.glowColor,
    avatar: agent.avatar,
    welcomeMessage: agent.welcomeMessage,
    personality: agent.personality,
    isActive: true,
    order: index,
  }));
}

function getDefaultAutonomousConfig(): AutonomousConfig {
  return {
    enabled: true,
    checkIntervalSeconds: 20,
    idleThresholdSeconds: 5,
    cooldownSeconds: 30,
    actions: {
      eyeSpeech: true,
      cardShuffle: true,
      themePulse: true,
      demoHint: false,
      particleBurst: true,
    },
  };
}

function getDefaultFeatureFlags(): FeatureFlags {
  return {
    floatingEye: true,
    cursorTrail: true,
    particleBackground: true,
    chatPanel: true,
    autonomousActions: true,
    eyeSpeechBubbles: true,
    themeSwitching: true,
    mockChatDemo: true,
    reducedMotion: true,
    soundEffects: false,
  };
}

function getDefaultPromptConfigs(): PromptConfig[] {
  return agentsData.map((agent) => ({
    agentId: agent.id,
    systemPrompt: `You are ${agent.name}, ${agent.role.toLowerCase()}. ${agent.description}`,
    welcomeMessages: [agent.welcomeMessage],
    personalityDescription: agent.personality.join(', '),
    responseStyle: 'conversational',
  }));
}

function getDefaultLogs(): LogEntry[] {
  const now = Date.now();
  return [
    {
      id: generateId(),
      timestamp: now - 3600000,
      level: 'info',
      source: 'system',
      message: 'Agent Portal initialized',
    },
    {
      id: generateId(),
      timestamp: now - 3540000,
      level: 'info',
      source: 'system',
      message: 'Active agent set to Professor Nova',
    },
    {
      id: generateId(),
      timestamp: now - 3000000,
      level: 'autonomous',
      source: 'autonomous',
      message: 'Autonomous event: Eye spoke "Did you know I can generate charts?"',
    },
    {
      id: generateId(),
      timestamp: now - 2400000,
      level: 'autonomous',
      source: 'autonomous',
      message: 'Autonomous event: Particle burst triggered',
    },
    {
      id: generateId(),
      timestamp: now - 1800000,
      level: 'info',
      source: 'chat',
      message: 'Visitor opened chat panel',
    },
    {
      id: generateId(),
      timestamp: now - 1200000,
      level: 'warn',
      source: 'system',
      message: 'API key check: No active key configured',
    },
    {
      id: generateId(),
      timestamp: now - 600000,
      level: 'autonomous',
      source: 'autonomous',
      message: 'Autonomous event: Theme pulse activated',
    },
    {
      id: generateId(),
      timestamp: now - 300000,
      level: 'info',
      source: 'eye',
      message: 'Eye cursor tracking enabled',
    },
    {
      id: generateId(),
      timestamp: now - 120000,
      level: 'error',
      source: 'system',
      message: 'Failed to load font resource (non-critical)',
    },
    {
      id: generateId(),
      timestamp: now - 60000,
      level: 'info',
      source: 'chat',
      message: 'Mock demo response generated',
    },
    {
      id: generateId(),
      timestamp: now,
      level: 'autonomous',
      source: 'autonomous',
      message: 'Autonomous loop cycle completed',
    },
  ];
}

function getDefaultConfig(): AdminConfig {
  return {
    apiKeys: [],
    agentConfigs: getDefaultAgentConfigs(),
    autonomousConfig: getDefaultAutonomousConfig(),
    featureFlags: getDefaultFeatureFlags(),
    promptConfigs: getDefaultPromptConfigs(),
    logs: getDefaultLogs(),
  };
}

function loadConfig(): AdminConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...getDefaultConfig(), ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return getDefaultConfig();
}

function saveConfig(config: AdminConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore storage errors
  }
}

export function useAdminConfig() {
  const [config, setConfig] = useState<AdminConfig>(loadConfig);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const setApiKeys = useCallback((keys: ApiKey[]) => {
    setConfig((prev) => ({ ...prev, apiKeys: keys }));
  }, []);

  const setAgentConfigs = useCallback((configs: AgentConfigData[]) => {
    setConfig((prev) => ({ ...prev, agentConfigs: configs }));
  }, []);

  const setAutonomousConfig = useCallback((autonomous: AutonomousConfig) => {
    setConfig((prev) => ({ ...prev, autonomousConfig: autonomous }));
  }, []);

  const setFeatureFlags = useCallback((flags: FeatureFlags) => {
    setConfig((prev) => ({ ...prev, featureFlags: flags }));
  }, []);

  const setPromptConfigs = useCallback((prompts: PromptConfig[]) => {
    setConfig((prev) => ({ ...prev, promptConfigs: prompts }));
  }, []);

  const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newEntry: LogEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    };
    setConfig((prev) => ({
      ...prev,
      logs: [...prev.logs, newEntry],
    }));
  }, []);

  const clearLogs = useCallback(() => {
    setConfig((prev) => ({ ...prev, logs: [] }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(getDefaultConfig());
  }, []);

  return {
    config,
    setApiKeys,
    setAgentConfigs,
    setAutonomousConfig,
    setFeatureFlags,
    setPromptConfigs,
    addLog,
    clearLogs,
    resetToDefaults,
  };
}
