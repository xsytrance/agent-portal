export const CUSTOMER_MODELS = [
  {
    id: 'openai/gpt-4o-mini',
    label: 'ChatGPT Fast',
    family: 'OpenAI / ChatGPT',
    description: 'Fast general-purpose responses',
  },
  {
    id: 'openai/gpt-4o',
    label: 'ChatGPT Pro',
    family: 'OpenAI / ChatGPT',
    description: 'Stronger reasoning and writing',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    label: 'Claude',
    family: 'Claude',
    description: 'Helpful writing and analysis',
  },
  {
    id: 'google/gemini-1.5-flash',
    label: 'Gemini Flash',
    family: 'Gemini',
    description: 'Fast lightweight model',
  },
] as const;

export type CustomerModelId = typeof CUSTOMER_MODELS[number]['id'];

export function getCustomerModels(allowedModels: string[] = CUSTOMER_MODELS.map((model) => model.id)) {
  return CUSTOMER_MODELS.filter((model) => allowedModels.includes(model.id));
}
