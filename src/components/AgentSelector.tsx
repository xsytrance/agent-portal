import { useAgent } from '@/context/AgentContext';
import { motion } from 'framer-motion';

export default function AgentSelector() {
  const { agents, activeAgent, selectAgent, setChatOpen, setAgentMessage } = useAgent();

  const handleSelect = (agent: typeof agents[0]) => {
    selectAgent(agent);
    setAgentMessage(agent.welcomeMessage);
    setTimeout(() => setChatOpen(true), 800);
    setTimeout(() => setAgentMessage(null), 5000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {agents.map((agent, index) => {
        const isSelected = activeAgent.id === agent.id;

        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: 0.7,
              delay: index * 0.15,
              ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
            }}
            whileHover={{ y: -8 }}
            onClick={() => handleSelect(agent)}
            className="relative cursor-pointer rounded-3xl transition-all duration-400 overflow-hidden"
            style={{
              background: 'rgba(255, 249, 240, 0.15)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: isSelected
                ? `2px solid ${agent.primaryColor}`
                : `1px solid rgba(255,255,255,0.2)`,
              borderTop: `3px solid ${agent.primaryColor}`,
              boxShadow: isSelected
                ? `0 12px 40px ${agent.glowColor}26, 0 0 30px ${agent.glowColor}33`
                : 'none',
              transform: isSelected ? 'scale(1.02)' : undefined,
            }}
          >
            {/* Selection ring */}
            {isSelected && (
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  border: `2px solid ${agent.primaryColor}`,
                  animation: 'ringPulse 2s ease-in-out infinite',
                }}
              />
            )}

            <div className="p-6 md:p-8 flex flex-col items-center text-center">
              {/* Avatar */}
              <motion.div
                className="relative mb-5"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-[120px] h-[120px] rounded-full object-cover"
                  style={{
                    border: `3px solid ${agent.primaryColor}`,
                    boxShadow: `0 0 30px ${agent.glowColor}40`,
                  }}
                />
                {/* Holographic ring */}
                <div
                  className="absolute inset-[-8px] rounded-full pointer-events-none"
                  style={{
                    border: `2px solid ${agent.primaryColor}40`,
                    animation: isSelected ? 'ringPulse 2s ease-in-out infinite' : 'none',
                  }}
                />
              </motion.div>

              {/* Name */}
              <h3
                className="font-bold mb-1"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
                  color: agent.primaryColor,
                }}
              >
                {agent.name}
              </h3>

              {/* Role badge */}
              <span
                className="inline-block mb-4 px-3.5 py-1.5 rounded-full"
                style={{
                  backgroundColor: `${agent.primaryColor}26`,
                  color: agent.primaryColor,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                {agent.role.toUpperCase()}
              </span>

              {/* Description */}
              <p
                className="mb-5"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                  color: '#64748B',
                  lineHeight: 1.55,
                }}
              >
                {agent.description}
              </p>

              {/* Personality chips */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {agent.personality.map((trait) => (
                  <span
                    key={trait}
                    className="px-3.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${agent.primaryColor}1A`,
                      color: agent.primaryColor,
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                    }}
                  >
                    {trait}
                  </span>
                ))}
              </div>

              {/* Selected badge */}
              {isSelected && (
                <span
                  className="px-4 py-1.5 rounded-full"
                  style={{
                    backgroundColor: agent.primaryColor,
                    color: 'white',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                  }}
                >
                  SELECTED
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
