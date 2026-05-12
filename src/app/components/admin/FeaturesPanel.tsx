'use client';

import { useState, useEffect } from 'react';
import { useAgent } from '@/app/context/AgentContext';
import type { FeatureFlags } from '@/app/hooks/useAdminConfig';
import { motion, AnimatePresence } from 'framer-motion';

interface FeaturesPanelProps {
  features: FeatureFlags;
  onChange: (features: FeatureFlags) => void;
}

interface SavedState {
  [key: string]: boolean;
}

export default function FeaturesPanel({ features, onChange }: FeaturesPanelProps) {
  const { activeAgent } = useAgent();
  const primaryColor = activeAgent.primaryColor;
  const [savedFlags, setSavedFlags] = useState<SavedState>({});

  const toggleFeature = (key: keyof FeatureFlags) => {
    const updated = { ...features, [key]: !features[key] };
    onChange(updated);
    setSavedFlags((prev) => ({ ...prev, [key]: true }));
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    Object.keys(savedFlags).forEach((key) => {
      if (savedFlags[key]) {
        timers.push(
          setTimeout(() => {
            setSavedFlags((prev) => ({ ...prev, [key]: false }));
          }, 2000)
        );
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [savedFlags]);

  const featureItems: { key: keyof FeatureFlags; label: string; desc: string }[] = [
    { key: 'floatingEye', label: 'Floating Eye', desc: 'Show the reactive eye avatar' },
    { key: 'cursorTrail', label: 'Cursor Trail', desc: 'Show the particle trail following cursor' },
    { key: 'particleBackground', label: 'Particle Background', desc: 'Show ambient floating particles' },
    { key: 'chatPanel', label: 'Chat Panel', desc: 'Enable the chat interface' },
    { key: 'autonomousActions', label: 'Autonomous Actions', desc: 'Enable the autonomous action loop' },
    { key: 'eyeSpeechBubbles', label: 'Eye Speech Bubbles', desc: 'Show speech bubbles from the eye' },
    { key: 'themeSwitching', label: 'Theme Switching', desc: 'Allow agent selection to change page theme' },
    { key: 'mockChatDemo', label: 'Mock Chat Demo', desc: 'Show pre-loaded mock conversation in chat' },
    { key: 'reducedMotion', label: 'Reduced Motion', desc: 'Respect system reduced-motion preference' },
    { key: 'soundEffects', label: 'Sound Effects', desc: 'Enable UI sound effects (future)' },
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
          Feature Flags
        </h3>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9375rem',
            color: '#64748B',
            lineHeight: 1.55,
          }}
        >
          Toggle site features on or off. Changes apply immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {featureItems.map((feature, index) => (
          <motion.div
            key={feature.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.3 }}
            className="flex items-center gap-4 py-4"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <button
              onClick={() => toggleFeature(feature.key)}
              className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
              style={{
                backgroundColor: features[feature.key] ? primaryColor : '#CBD5E1',
              }}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                animate={{ x: features[feature.key] ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: '#1A1A2E',
                  }}
                >
                  {feature.label}
                </span>
                <AnimatePresence>
                  {savedFlags[feature.key] && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-2 py-0.5"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        backgroundColor: '#22c55e',
                        color: '#fff',
                        borderRadius: 100,
                      }}
                    >
                      Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.8125rem',
                  color: '#64748B',
                }}
              >
                {feature.desc}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
