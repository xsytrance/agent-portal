import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { resolveFallback, isEventAllowed } from "./degradation";
import { TokenBudget, BudgetConfig } from "./types";
import * as costTiers from "./costTiers";

describe("degradation", () => {
  let mockBudget: TokenBudget;
  let mockConfig: BudgetConfig;

  beforeEach(() => {
    mockBudget = {
      status: "healthy",
      metadata: { alertsTriggered: [] },
    } as any;
    mockConfig = {
      degradationSettings: {
        warningTemplateRate: 0.5,
        warningSkipNonEssential: true,
        criticalAllowEmergency: false,
      },
    } as any;
  });

  afterEach(() => {
    spyOn(Math, "random").mockRestore();
    // restore the module mock if it was spied
    spyOn(costTiers, "classifyEvent").mockRestore();
  });

  describe("resolveFallback", () => {
    it("should return the first allowed fallback event in the chain", () => {
      // For healthy budget, all are allowed.
      // llm:chat_completion chain: ['message:cached', 'message:template', 'template:phrase', 'visual:effect']
      const fallback = resolveFallback("llm:chat_completion", mockBudget, mockConfig);
      expect(fallback).toBe("message:cached");
    });

    it("should skip fallbacks that are not allowed by the budget and return the next allowed one", () => {
      // For exhausted budget, only free events are allowed.
      // 'message:cached' is cheap, 'message:template' is cheap.
      // 'template:phrase' is free.
      mockBudget.status = "exhausted";
      const fallback = resolveFallback("llm:chat_completion", mockBudget, mockConfig);
      expect(fallback).toBe("template:phrase");
    });

    it("should return the default fallback chain if eventType is unknown", () => {
      // unknown event default chain: ['template:phrase', 'visual:effect']
      // Both are free, so it should return the first one ('template:phrase')
      const fallback = resolveFallback("unknown_event", mockBudget, mockConfig);
      expect(fallback).toBe("template:phrase");
    });

    it("should return 'visual:effect' as the ultimate fallback if nothing in the chain is allowed", () => {
      // Make budget status something that rejects all (e.g. unknown status)
      mockBudget.status = "unknown_status" as any;
      const fallback = resolveFallback("llm:chat_completion", mockBudget, mockConfig);
      expect(fallback).toBe("visual:effect");
    });

    it("should respect mocked classifyEvent changing a tier", () => {
      // What if 'message:cached' is classified as expensive, and budget is exhausted?
      spyOn(costTiers, "classifyEvent").mockReturnValue("expensive");
      mockBudget.status = "exhausted";
      const fallback = resolveFallback("llm:chat_completion", mockBudget, mockConfig);
      expect(fallback).toBe("visual:effect"); // visual:effect is hardcoded at the end of resolveFallback
    });
  });

  describe("isEventAllowed", () => {
    it("should allow everything when healthy", () => {
      expect(isEventAllowed("test", "expensive", mockBudget, mockConfig)).toBe(true);
      expect(isEventAllowed("test", "cheap", mockBudget, mockConfig)).toBe(true);
      expect(isEventAllowed("test", "free", mockBudget, mockConfig)).toBe(true);
    });

    it("should handle warning status with Math.random for expensive tiers", () => {
      mockBudget.status = "warning";
      mockConfig.degradationSettings.warningTemplateRate = 0.5;

      // > 0.5 -> true
      spyOn(Math, "random").mockReturnValue(0.6);
      expect(isEventAllowed("test", "expensive", mockBudget, mockConfig)).toBe(true);

      // <= 0.5 -> false
      spyOn(Math, "random").mockReturnValue(0.4);
      expect(isEventAllowed("test", "expensive", mockBudget, mockConfig)).toBe(false);
    });

    it("should allow cheap and free tiers on warning", () => {
      mockBudget.status = "warning";
      expect(isEventAllowed("test", "cheap", mockBudget, mockConfig)).toBe(true);
      expect(isEventAllowed("test", "free", mockBudget, mockConfig)).toBe(true);
    });

    it("should handle critical status", () => {
      mockBudget.status = "critical";

      // expensive rejected if alerts triggered
      mockBudget.metadata.alertsTriggered = ["alert1"];
      mockConfig.degradationSettings.criticalAllowEmergency = true;
      expect(isEventAllowed("test", "expensive", mockBudget, mockConfig)).toBe(false);

      // expensive rejected if criticalAllowEmergency is false
      mockBudget.metadata.alertsTriggered = [];
      mockConfig.degradationSettings.criticalAllowEmergency = false;
      expect(isEventAllowed("test", "expensive", mockBudget, mockConfig)).toBe(false);

      // expensive allowed if no alerts and criticalAllowEmergency is true
      mockBudget.metadata.alertsTriggered = [];
      mockConfig.degradationSettings.criticalAllowEmergency = true;
      expect(isEventAllowed("test", "expensive", mockBudget, mockConfig)).toBe(true);

      // free and cheap allowed
      expect(isEventAllowed("test", "free", mockBudget, mockConfig)).toBe(true);
      expect(isEventAllowed("test", "cheap", mockBudget, mockConfig)).toBe(true);
    });

    it("should handle exhausted status", () => {
      mockBudget.status = "exhausted";
      expect(isEventAllowed("test", "expensive", mockBudget, mockConfig)).toBe(false);
      expect(isEventAllowed("test", "cheap", mockBudget, mockConfig)).toBe(false);
      expect(isEventAllowed("test", "free", mockBudget, mockConfig)).toBe(true);
    });

    it("should reject invalid status", () => {
      mockBudget.status = "invalid" as any;
      expect(isEventAllowed("test", "free", mockBudget, mockConfig)).toBe(false);
    });
  });
});
