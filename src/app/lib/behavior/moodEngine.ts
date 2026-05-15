import { InternalMood, MoodState } from './behaviorTypes';

export class MoodEngine {
  private mood: MoodState;

  constructor(baseMood: InternalMood = 'neutral') {
    this.mood = {
      current: baseMood,
      intensity: 0.5,
      baseMood: baseMood,
      lastChanged: Date.now()
    };
  }

  public getMood(): MoodState {
    return { ...this.mood };
  }

  public setMood(newMood: InternalMood, intensity: number = 0.5): void {
    this.mood.current = newMood;
    this.mood.intensity = Math.min(1, Math.max(0, intensity));
    this.mood.lastChanged = Date.now();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  public evaluateMood(events: any[]): InternalMood {
    // Phase 2a Logic: Decay back to base mood over time
    const timeSinceChange = Date.now() - this.mood.lastChanged;

    // If it's been more than 30 seconds, start decaying to base mood
    if (timeSinceChange > 30000 && this.mood.current !== this.mood.baseMood) {
       this.mood.intensity -= 0.1;
       if (this.mood.intensity <= 0.2) {
           this.mood.current = this.mood.baseMood;
           this.mood.intensity = 0.5;
       }
    }

    return this.mood.current;
  }
}
