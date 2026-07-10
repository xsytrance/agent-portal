export interface Agent {
  id: string;
  name: string;
  role: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  description: string;
  personality: string[];
  avatar: string;
  welcomeMessage: string;
  idleMessages: string[];
  chatResponses: string[];
  /** Persona sent to the LLM as the system prompt (emotion protocol is appended server-side) */
  systemPrompt?: string;
  /** Sampling temperature for this persona (chaotic agents run hotter) */
  temperature?: number;
}

export interface ProviderConfig {
  providerId: string;
  providerName: string;
  baseUrl: string;
  model: string;
  keyRef: string;
  enabled: boolean;
}

export interface BackendAgentMapping {
  frontendAgentId: string;
  backendAgentId: string;
  providerId: string;
  model: string;
  systemPrompt: string;
}
