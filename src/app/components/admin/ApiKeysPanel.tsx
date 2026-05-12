'use client';

import { useState } from 'react';
import { useAgent } from '@/app/context/AgentContext';
import type { ApiKey } from '@/app/hooks/useAdminConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Plus, Eye, EyeOff, X } from 'lucide-react';

interface ApiKeysPanelProps {
  apiKeys: ApiKey[];
  onChange: (keys: ApiKey[]) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function maskKey(key: string): string {
  if (key.length <= 12) return '••••••••••••';
  return '••••••••' + key.slice(-8);
}

export default function ApiKeysPanel({ apiKeys, onChange }: ApiKeysPanelProps) {
  const { activeAgent } = useAgent();
  const [showModal, setShowModal] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [formName, setFormName] = useState('');
  const [formKey, setFormKey] = useState('');
  const [formModel, setFormModel] = useState('');
  const [showKeyValue, setShowKeyValue] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const primaryColor = activeAgent.primaryColor;

  const openAdd = () => {
    setEditingKey(null);
    setFormName('');
    setFormKey('');
    setFormModel('');
    setShowKeyValue(false);
    setShowModal(true);
  };

  const openEdit = (key: ApiKey) => {
    setEditingKey(key);
    setFormName(key.name);
    setFormKey(key.key);
    setFormModel(key.model);
    setShowKeyValue(false);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formKey.trim() || !formModel.trim()) return;
    if (editingKey) {
      const updated = apiKeys.map((k) =>
        k.id === editingKey.id
          ? { ...k, name: formName.trim(), key: formKey.trim(), model: formModel.trim() }
          : k
      );
      onChange(updated);
    } else {
      const newKey: ApiKey = {
        id: generateId(),
        name: formName.trim(),
        key: formKey.trim(),
        model: formModel.trim(),
        isActive: apiKeys.length === 0,
        createdAt: Date.now(),
      };
      onChange([...apiKeys, newKey]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const updated = apiKeys.filter((k) => k.id !== id);
    onChange(updated);
    setDeleteConfirm(null);
  };

  const setActiveKey = (id: string) => {
    const updated = apiKeys.map((k) => ({ ...k, isActive: k.id === id }));
    onChange(updated);
  };

  return (
    <div>
      {/* Title */}
      <div className="mb-6">
        <h3
          className="font-bold mb-2"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
            color: '#1A1A2E',
          }}
        >
          API Keys
        </h3>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9375rem',
            color: '#64748B',
            lineHeight: 1.55,
          }}
        >
          Manage your API keys. The active key is used for all agent responses.
        </p>
      </div>

      {/* Active Key Selector */}
      {apiKeys.length > 0 && (
        <div className="mb-6">
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
            ACTIVE API KEY
          </label>
          <select
            value={apiKeys.find((k) => k.isActive)?.id || ''}
            onChange={(e) => setActiveKey(e.target.value)}
            className="w-full px-4 py-3 text-white outline-none transition-all"
            style={{
              backgroundColor: 'rgba(26, 26, 46, 0.6)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 16,
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9375rem',
            }}
          >
            {apiKeys.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} — {maskKey(k.key)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Key List */}
      <div className="mb-6">
        {apiKeys.map((key) => (
          <motion.div
            key={key.id}
            layout
            className="flex items-center gap-4 mb-3 px-4 py-3"
            style={{
              backgroundColor: '#F1F5F9',
              borderRadius: 12,
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="font-semibold"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9375rem',
                    color: '#1A1A2E',
                  }}
                >
                  {key.name}
                </span>
                {key.isActive && (
                  <span
                    className="px-3 py-1 text-xs font-bold"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '0.6875rem',
                      backgroundColor: primaryColor,
                      color: '#fff',
                      borderRadius: 100,
                    }}
                  >
                    Active
                  </span>
                )}
              </div>
              <div
                className="flex items-center gap-3"
              >
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.8125rem',
                    color: '#64748B',
                  }}
                >
                  {maskKey(key.key)}
                </span>
                <span
                  className="px-2 py-0.5"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    backgroundColor: primaryColor + '1A',
                    color: primaryColor,
                    borderRadius: 100,
                  }}
                >
                  {key.model}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => openEdit(key)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#CBD5E1' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteConfirm(key.id)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: '#CBD5E1' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="p-6 max-w-sm w-full mx-4"
              style={{ backgroundColor: '#fff', borderRadius: 20 }}
            >
              <h4
                className="font-bold mb-3"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '1.125rem',
                  color: '#1A1A2E',
                }}
              >
                Delete API Key
              </h4>
              <p
                className="mb-6"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                  color: '#64748B',
                  lineHeight: 1.55,
                }}
              >
                Are you sure you want to delete this key? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-full transition-all"
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
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 rounded-full text-white transition-all hover:brightness-110"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    backgroundColor: '#ef4444',
                  }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Key Button */}
      <button
        onClick={openAdd}
        className="w-full py-3 px-4 flex items-center justify-center gap-2 transition-all hover:brightness-105"
        style={{
          border: '2px dashed #CBD5E1',
          borderRadius: 16,
          backgroundColor: 'transparent',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#64748B',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = primaryColor;
          e.currentTarget.style.color = primaryColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#CBD5E1';
          e.currentTarget.style.color = '#64748B';
        }}
      >
        <Plus size={16} />
        Add New Key
      </button>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
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
              className="w-full max-w-md p-8"
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
                  {editingKey ? 'Edit API Key' : 'Add API Key'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
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
                    KEY NAME
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Production Key"
                    className="w-full px-4 py-3 text-white outline-none transition-all"
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
                    API KEY
                  </label>
                  <div className="relative">
                    <input
                      type={showKeyValue ? 'text' : 'password'}
                      value={formKey}
                      onChange={(e) => setFormKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="w-full px-4 py-3 pr-12 text-white outline-none transition-all"
                      style={{
                        backgroundColor: 'rgba(26, 26, 46, 0.6)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 16,
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
                    <button
                      onClick={() => setShowKeyValue(!showKeyValue)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                      style={{ color: '#CBD5E1' }}
                      type="button"
                    >
                      {showKeyValue ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                    MODEL NAME
                  </label>
                  <input
                    type="text"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="openai/gpt-4o"
                    className="w-full px-4 py-3 text-white outline-none transition-all"
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
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.8125rem',
                      color: '#64748B',
                      lineHeight: 1.55,
                    }}
                  >
                    Enter the OpenRouter model identifier.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowModal(false)}
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
                  {editingKey ? 'Save Changes' : 'Save Key'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
