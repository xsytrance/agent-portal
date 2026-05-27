import { describe, it, expect } from 'bun:test';
import { estimateCost, MODEL_PRICING } from './utils';

describe('estimateCost', () => {
  it('should use default model and ratio when only tokens are provided', () => {
    // default pricing: input 0.50, output 1.50 per 1M
    // default ratio: 0.4 input, 0.6 output
    // tokens: 1,000,000
    // input tokens: 400,000, output tokens: 600,000
    // input cost = (400,000 / 1M) * 0.50 = 0.4 * 0.50 = 0.20
    // output cost = (600,000 / 1M) * 1.50 = 0.6 * 1.50 = 0.90
    // total = 1.10
    const cost = estimateCost(1_000_000);
    expect(cost).toBeCloseTo(1.10, 4);
  });

  it('should use specified model pricing', () => {
    // gpt-4o-mini pricing: input 0.15, output 0.60 per 1M
    // ratio: 0.4 input, 0.6 output
    // tokens: 1,000,000
    // input cost = 0.4 * 0.15 = 0.06
    // output cost = 0.6 * 0.60 = 0.36
    // total = 0.42
    const cost = estimateCost(1_000_000, 'gpt-4o-mini');
    expect(cost).toBeCloseTo(0.42, 4);
  });

  it('should fallback to default pricing for unknown model', () => {
    const defaultCost = estimateCost(1_000_000, 'default');
    const unknownCost = estimateCost(1_000_000, 'unknown-model-xyz');
    expect(unknownCost).toBe(defaultCost);
  });

  it('should handle custom input ratio', () => {
    // ratio: 0.8 input, 0.2 output
    // default pricing: input 0.50, output 1.50
    // tokens: 1,000,000
    // input cost = 0.8 * 0.50 = 0.40
    // output cost = 0.2 * 1.50 = 0.30
    // total = 0.70
    const cost = estimateCost(1_000_000, 'default', 0.8);
    expect(cost).toBeCloseTo(0.70, 4);
  });

  it('should handle 0 input ratio (all output)', () => {
    // ratio: 0 input, 1 output
    // default pricing: input 0.50, output 1.50
    // tokens: 1,000,000
    // input cost = 0
    // output cost = 1.0 * 1.50 = 1.50
    // total = 1.50
    const cost = estimateCost(1_000_000, 'default', 0.0);
    expect(cost).toBeCloseTo(1.50, 4);
  });

  it('should handle 1 input ratio (all input)', () => {
    // ratio: 1 input, 0 output
    // default pricing: input 0.50, output 1.50
    // tokens: 1,000,000
    // input cost = 1.0 * 0.50 = 0.50
    // output cost = 0
    // total = 0.50
    const cost = estimateCost(1_000_000, 'default', 1.0);
    expect(cost).toBeCloseTo(0.50, 4);
  });

  it('should handle 0 estimated tokens', () => {
    const cost = estimateCost(0);
    expect(cost).toBe(0);
  });

  it('should handle fractional tokens correctly', () => {
    // gpt-4o pricing: input 2.50, output 10.00
    // ratio: 0.5 input, 0.5 output
    // tokens: 50
    // input cost = (25 / 1M) * 2.50 = 0.0000625
    // output cost = (25 / 1M) * 10.00 = 0.00025
    // total = 0.0003125
    const cost = estimateCost(50, 'gpt-4o', 0.5);
    expect(cost).toBeCloseTo(0.0003125, 7);
  });
});
