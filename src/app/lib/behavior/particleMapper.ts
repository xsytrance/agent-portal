import { MoodDimension } from './types';

export interface ParticleConfig {
  speedMultiplier: number;
  dispersion: number;
  colorShiftTarget: string | null;
  sizeMultiplier: number;
  pattern: 'ambient' | 'orbit' | 'erratic' | 'wave' | 'burst';
}

export class ParticleMoodMapper {
  public mapMoodToParticles(mood: MoodDimension): ParticleConfig {
    switch (mood) {
      case 'curious':
        return { speedMultiplier: 1.2, dispersion: 0.8, colorShiftTarget: null, sizeMultiplier: 1.0, pattern: 'orbit' };
      case 'excited':
        return { speedMultiplier: 2.0, dispersion: 1.5, colorShiftTarget: '#FFD700', sizeMultiplier: 1.2, pattern: 'burst' };
      case 'thoughtful':
        return { speedMultiplier: 0.5, dispersion: 0.5, colorShiftTarget: '#88CCFF', sizeMultiplier: 0.8, pattern: 'orbit' };
      case 'mischievous':
        return { speedMultiplier: 1.5, dispersion: 2.0, colorShiftTarget: '#FF55AA', sizeMultiplier: 0.9, pattern: 'erratic' };
      case 'calm':
        return { speedMultiplier: 0.3, dispersion: 1.0, colorShiftTarget: '#AACCFF', sizeMultiplier: 1.0, pattern: 'wave' };
      case 'focused':
        return { speedMultiplier: 0.8, dispersion: 0.2, colorShiftTarget: null, sizeMultiplier: 0.7, pattern: 'ambient' };
      case 'sleepy':
        return { speedMultiplier: 0.1, dispersion: 0.1, colorShiftTarget: '#444466', sizeMultiplier: 0.5, pattern: 'ambient' };
      case 'surprised':
        return { speedMultiplier: 3.0, dispersion: 2.5, colorShiftTarget: '#FFFFFF', sizeMultiplier: 1.5, pattern: 'burst' };
      default:
        return { speedMultiplier: 1.0, dispersion: 1.0, colorShiftTarget: null, sizeMultiplier: 1.0, pattern: 'ambient' };
    }
  }
}
