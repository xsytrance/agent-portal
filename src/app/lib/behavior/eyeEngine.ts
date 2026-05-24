import { MoodDimension } from './types';

export interface EyeConfig {
  xScale: number;
  yScale: number;
  blinkRate: number;
  squint: number;
  darting: boolean;
}

export class EyeBehaviorEngine {
  public getEyeConfig(mood: MoodDimension): EyeConfig {
    switch (mood) {
      case 'curious':
        return { xScale: 1.2, yScale: 1.2, blinkRate: 1.5, squint: 0, darting: true };
      case 'excited':
        return { xScale: 1.3, yScale: 1.3, blinkRate: 2.0, squint: 0, darting: true };
      case 'thoughtful':
        return { xScale: 1.0, yScale: 0.8, blinkRate: 0.5, squint: 0.5, darting: false };
      case 'mischievous':
        return { xScale: 0.9, yScale: 1.1, blinkRate: 1.0, squint: 0.8, darting: true };
      case 'calm':
        return { xScale: 1.0, yScale: 1.0, blinkRate: 0.3, squint: 0, darting: false };
      case 'focused':
        return { xScale: 0.8, yScale: 0.8, blinkRate: 0.2, squint: 0.3, darting: false };
      case 'sleepy':
        return { xScale: 1.0, yScale: 0.3, blinkRate: 0.1, squint: 0.9, darting: false };
      case 'surprised':
        return { xScale: 1.5, yScale: 1.5, blinkRate: 0.5, squint: 0, darting: false };
      default:
        return { xScale: 1.0, yScale: 1.0, blinkRate: 1.0, squint: 0, darting: false };
    }
  }
}
