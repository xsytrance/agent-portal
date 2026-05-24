'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';

interface MockIndicatorProps {
  isVisible: boolean;
  reason?: 'budget' | 'safety' | 'offline' | 'dev';
}

export function MockIndicator({ isVisible, reason = 'dev' }: MockIndicatorProps) {
  const getReasonText = () => {
    switch (reason) {
      case 'budget': return 'Budget Saving Mode';
      case 'safety': return 'Safety Fallback';
      case 'offline': return 'Offline Mode';
      case 'dev': return 'Mock Mode';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg text-xs font-medium"
        >
          {reason === 'budget' ? <Sparkles size={14} /> : <AlertCircle size={14} />}
          <span>{getReasonText()}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
