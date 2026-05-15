export class CooldownManager {
  private cooldowns: Map<string, number> = new Map();

  // Set a cooldown for a specific action/event type
  public setCooldown(key: string, durationMs: number): void {
    this.cooldowns.set(key, Date.now() + durationMs);
  }

  // Check if an action is currently on cooldown
  public isOnCooldown(key: string): boolean {
    const expiresAt = this.cooldowns.get(key);
    if (!expiresAt) return false;

    if (Date.now() > expiresAt) {
      this.cooldowns.delete(key);
      return false;
    }

    return true;
  }

  public clearCooldown(key: string): void {
    this.cooldowns.delete(key);
  }

  public clearAll(): void {
    this.cooldowns.clear();
  }
}
