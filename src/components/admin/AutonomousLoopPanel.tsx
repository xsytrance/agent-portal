import { useAgent } from '@/context/AgentContext';
import type { AutonomousConfig } from '@/hooks/useAdminConfig';
import { motion, AnimatePresence } from 'framer-motion';

interface AutonomousLoopPanelProps {
  config: AutonomousConfig;
  onChange: (config: AutonomousConfig) => void;
}

export default function AutonomousLoopPanel({ config, onChange }: AutonomousLoopPanelProps) {
  const { activeAgent } = useAgent();
  const primaryColor = activeAgent.primaryColor;

  const updateField = <K extends keyof AutonomousConfig>(key: K, value: AutonomousConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const toggleAction = (actionKey: keyof AutonomousConfig['actions']) => {
    onChange({
      ...config,
      actions: { ...config.actions, [actionKey]: !config.actions[actionKey] },
    });
  };

  const actionItems = [
    { key: 'eyeSpeech' as const, name: 'Eye Speech', desc: 'Agent speaks through the floating eye bubble' },
    { key: 'cardShuffle' as const, name: 'Card Shuffle', desc: 'Feature cards subtly reorder or highlight' },
    { key: 'themePulse' as const, name: 'Theme Pulse', desc: 'Brief glow/particle brightness intensification' },
    { key: 'demoHint' as const, name: 'Demo Hint', desc: 'Pulsing badge appears on chat panel' },
    { key: 'particleBurst' as const, name: 'Particle Burst', desc: 'Particles scatter from center point' },
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
          Autonomous Behavior
        </h3>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9375rem',
            color: '#64748B',
            lineHeight: 1.55,
          }}
        >
          Control how the agent acts on its own when visitors are idle.
        </p>
      </div>

      {/* Master Toggle */}
      <div
        className="flex items-center justify-between p-5 mb-6"
        style={{ backgroundColor: '#F1F5F9', borderRadius: 16 }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#1A1A2E',
              marginBottom: 4,
            }}
          >
            Enable Autonomous Actions
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.8125rem',
              color: '#64748B',
            }}
          >
            When enabled, the agent will periodically perform staged actions while visitors browse.
          </div>
        </div>
        <button
          onClick={() => updateField('enabled', !config.enabled)}
          className="relative w-14 h-8 rounded-full transition-colors flex-shrink-0"
          style={{
            backgroundColor: config.enabled ? primaryColor : '#CBD5E1',
          }}
        >
          <motion.div
            className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow"
            animate={{ x: config.enabled ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      <AnimatePresence>
        {config.enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {/* Timing Settings */}
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            >
              {[
                {
                  label: 'Check Interval (seconds)',
                  key: 'checkIntervalSeconds' as const,
                  min: 5,
                  max: 120,
                  step: 5,
                  help: 'How often the system checks for idle time.',
                },
                {
                  label: 'Idle Threshold (seconds)',
                  key: 'idleThresholdSeconds' as const,
                  min: 1,
                  max: 30,
                  step: 1,
                  help: 'Seconds of no interaction before user is considered idle.',
                },
                {
                  label: 'Action Cooldown (seconds)',
                  key: 'cooldownSeconds' as const,
                  min: 5,
                  max: 300,
                  step: 5,
                  help: 'Minimum time between any two autonomous events.',
                },
              ].map((field) => (
                <div key={field.key}>
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
                    {field.label.toUpperCase()}
                  </label>
                  <input
                    type="number"
                    value={config[field.key]}
                    onChange={(e) => updateField(field.key, parseInt(e.target.value) || field.min)}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    className="w-24 px-3 py-2.5 text-white outline-none"
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
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.8125rem',
                      color: '#64748B',
                      lineHeight: 1.55,
                    }}
                  >
                    {field.help}
                  </p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="mb-6" style={{ borderTop: '1px solid #F1F5F9' }} />

            {/* Action Toggles */}
            <h4
              className="font-semibold mb-4"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#1A1A2E',
              }}
            >
              ENABLED ACTIONS
            </h4>
            <div className="space-y-0">
              {actionItems.map((action) => (
                <div
                  key={action.key}
                  className="flex items-center gap-4 py-3"
                  style={{ borderBottom: '1px solid #F1F5F9' }}
                >
                  <button
                    onClick={() => toggleAction(action.key)}
                    className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                    style={{
                      backgroundColor: config.actions[action.key] ? primaryColor : '#CBD5E1',
                    }}
                  >
                    <motion.div
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                      animate={{ x: config.actions[action.key] ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: '#1A1A2E',
                      }}
                    >
                      {action.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.8125rem',
                        color: '#64748B',
                      }}
                    >
                      {action.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Countdown Status */}
            <div
              className="mt-6 p-4 flex items-center gap-3"
              style={{
                backgroundColor: primaryColor + '10',
                borderRadius: 12,
                border: `1px solid ${primaryColor}30`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: config.enabled ? '#22c55e' : '#CBD5E1',
                  boxShadow: config.enabled ? '0 0 8px #22c55e' : 'none',
                }}
              />
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: config.enabled ? '#22c55e' : '#64748B',
                }}
              >
                {config.enabled ? 'ACTIVE' : 'PAUSED'}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.8125rem',
                  color: '#64748B',
                }}
              >
                Next event in {config.checkIntervalSeconds}s (checking every {config.checkIntervalSeconds}s)
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
