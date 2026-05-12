'use client';

import { useState } from 'react';
import { useAgent } from '@/app/context/AgentContext';
import type { AgentConfigData } from '@/app/hooks/useAdminConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, X, GripVertical } from 'lucide-react';

interface AgentConfigPanelProps {
  agentConfigs: AgentConfigData[];
  onChange: (configs: AgentConfigData[]) => void;
}

export default function AgentConfigPanel({ agentConfigs, onChange }: AgentConfigPanelProps) {
  const { activeAgent } = useAgent();
  const [editAgent, setEditAgent] = useState<AgentConfigData | null>(null);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWelcome, setFormWelcome] = useState('');
  const [formPrimaryColor, setFormPrimaryColor] = useState('');
  const [formSecondaryColor, setFormSecondaryColor] = useState('');
  const [formGlowColor, setFormGlowColor] = useState('');
  const [formTags, setFormTags] = useState('');
  const [showColors, setShowColors] = useState(false);

  const primaryColor = activeAgent.primaryColor;

  const openEdit = (agent: AgentConfigData) => {
    setEditAgent(agent);
    setFormName(agent.name);
    setFormRole(agent.role);
    setFormDescription(agent.description);
    setFormWelcome(agent.welcomeMessage);
    setFormPrimaryColor(agent.primaryColor);
    setFormSecondaryColor(agent.secondaryColor);
    setFormGlowColor(agent.glowColor);
    setFormTags(agent.personality.join(', '));
    setShowColors(false);
  };

  const handleSave = () => {
    if (!editAgent) return;
    const tags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);
    const updated = agentConfigs.map((a) =>
      a.id === editAgent.id
        ? {
            ...a,
            name: formName.trim() || a.name,
            role: formRole.trim() || a.role,
            description: formDescription.trim() || a.description,
            welcomeMessage: formWelcome.trim() || a.welcomeMessage,
            primaryColor: formPrimaryColor || a.primaryColor,
            secondaryColor: formSecondaryColor || a.secondaryColor,
            glowColor: formGlowColor || a.glowColor,
            personality: tags.length > 0 ? tags : a.personality,
          }
        : a
    );
    onChange(updated);
    setEditAgent(null);
  };

  const toggleActive = (id: string) => {
    const updated = agentConfigs.map((a) =>
      a.id === id ? { ...a, isActive: !a.isActive } : a
    );
    onChange(updated);
  };

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
          Agent Configuration
        </h3>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9375rem',
            color: '#64748B',
            lineHeight: 1.55,
          }}
        >
          Choose which agents are available and customize their personalities.
        </p>
      </div>

      {/* Active Agents */}
      <div className="space-y-3">
        {agentConfigs.map((agent) => (
          <motion.div
            key={agent.id}
            layout
            className="flex items-center gap-4 px-4 py-3.5"
            style={{
              backgroundColor: '#fff',
              border: '1px solid #F1F5F9',
              borderRadius: 12,
            }}
          >
            {/* Toggle */}
            <button
              onClick={() => toggleActive(agent.id)}
              className="relative w-11 h-6 rounded-full transition-colors"
              style={{
                backgroundColor: agent.isActive ? primaryColor : '#CBD5E1',
              }}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                animate={{ x: agent.isActive ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>

            {/* Avatar */}
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-10 h-10 rounded-xl object-cover"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4
                  className="font-semibold truncate"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1rem',
                    color: '#1A1A2E',
                  }}
                >
                  {agent.name}
                </h4>
                {agent.isActive && (
                  <span
                    className="px-2 py-0.5 flex-shrink-0"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      backgroundColor: primaryColor + '26',
                      color: primaryColor,
                      borderRadius: 100,
                    }}
                  >
                    On
                  </span>
                )}
              </div>
              <p
                className="truncate"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  color: '#64748B',
                }}
              >
                {agent.role}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEdit(agent)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#CBD5E1' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
              >
                <Pencil size={16} />
              </button>
              <button
                className="p-2 rounded-lg cursor-grab"
                style={{ color: '#CBD5E1' }}
              >
                <GripVertical size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editAgent && (
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
              className="w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: '#fff', borderRadius: 20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="font-bold"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
                    color: '#1A1A2E',
                  }}
                >
                  Edit {editAgent.name}
                </h3>
                <button
                  onClick={() => setEditAgent(null)}
                  className="p-2 rounded-lg"
                  style={{ color: '#CBD5E1' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
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
                    NAME
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    maxLength={30}
                    className="w-full px-4 py-3 text-white outline-none"
                    style={{
                      backgroundColor: 'rgba(26, 26, 46, 0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 16,
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
                    ROLE
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    maxLength={50}
                    placeholder="e.g., Inventor & Researcher"
                    className="w-full px-4 py-3 text-white outline-none"
                    style={{
                      backgroundColor: 'rgba(26, 26, 46, 0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 16,
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
                    DESCRIPTION
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full px-4 py-3 text-white outline-none resize-none"
                    style={{
                      backgroundColor: 'rgba(26, 26, 46, 0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 16,
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
                    WELCOME MESSAGE
                  </label>
                  <input
                    type="text"
                    value={formWelcome}
                    onChange={(e) => setFormWelcome(e.target.value)}
                    maxLength={150}
                    className="w-full px-4 py-3 text-white outline-none"
                    style={{
                      backgroundColor: 'rgba(26, 26, 46, 0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 16,
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
                    PERSONALITY TAGS (comma-separated, max 5)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="Curious, Analytical, Energetic"
                    className="w-full px-4 py-3 text-white outline-none"
                    style={{
                      backgroundColor: 'rgba(26, 26, 46, 0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 16,
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

                {/* Collapsible Color Section */}
                <div>
                  <button
                    onClick={() => setShowColors(!showColors)}
                    className="w-full flex items-center justify-between py-2"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#1A1A2E',
                    }}
                  >
                    <span>VISUAL IDENTITY (COLORS)</span>
                    <motion.span
                      animate={{ rotate: showColors ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {showColors && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4 pt-2 pb-1">
                          {[
                            { label: 'PRIMARY COLOR', value: formPrimaryColor, setter: setFormPrimaryColor },
                            { label: 'SECONDARY COLOR', value: formSecondaryColor, setter: setFormSecondaryColor },
                            { label: 'GLOW COLOR', value: formGlowColor, setter: setFormGlowColor },
                          ].map((colorField) => (
                            <div key={colorField.label} className="flex items-center gap-3">
                              <input
                                type="color"
                                value={colorField.value}
                                onChange={(e) => colorField.setter(e.target.value)}
                                className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                                style={{ padding: 0 }}
                              />
                              <span
                                style={{
                                  fontFamily: "'Space Mono', monospace",
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                  letterSpacing: '0.08em',
                                  color: '#64748B',
                                }}
                              >
                                {colorField.value.toUpperCase()}
                              </span>
                              <span
                                className="ml-auto"
                                style={{
                                  fontFamily: "'Space Mono', monospace",
                                  fontSize: '0.6875rem',
                                  color: '#CBD5E1',
                                }}
                              >
                                {colorField.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setEditAgent(null)}
                  className="flex-1 py-3 rounded-full transition-all"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#64748B',
                    backgroundColor: 'transparent',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 rounded-full text-white transition-all hover:brightness-110 hover:scale-105"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    backgroundColor: primaryColor,
                  }}
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
