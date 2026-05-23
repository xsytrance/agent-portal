import { test, expect, describe, setSystemTime, mock, afterEach } from "bun:test";
import { OpenRouterProvider } from "./openRouterProvider";
import { ProviderConfig } from "./providerAdapter";
import { ChatRequest } from "./providerTypes";

describe("OpenRouterProvider Rate Limiting", () => {
  const config: ProviderConfig = {
    providerId: "openrouter",
    providerName: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "test-model",
    keyRef: "OPENROUTER_API_KEY",
    enabled: true,
  };

  const request: ChatRequest = {
    message: "Hello",
    agentId: "test-agent",
  };

  afterEach(() => {
    setSystemTime(); // Reset system time after each test
  });

  test("should allow requests within the rate limit", async () => {
    // Mock fetch to simulate successful responses and avoid actual network calls
    globalThis.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({
      choices: [{ message: { content: "Mocked response" } }],
      model: "test-model",
    }), { status: 200 }))) as unknown as typeof fetch;

    // Create a new instance per test to isolate state
    const provider = new OpenRouterProvider(config, "sk-or-test-key");

    // We can only make 20 requests per minute
    for (let i = 0; i < 20; i++) {
      const response = await provider.chat(request);
      expect(response.content).toBe("Mocked response");
    }
  });

  test("should throw an error when the rate limit is exceeded", async () => {
    globalThis.fetch = mock(() => Promise.resolve(new Response(JSON.stringify({
      choices: [{ message: { content: "Mocked response" } }],
      model: "test-model",
    }), { status: 200 }))) as unknown as typeof fetch;

    const provider = new OpenRouterProvider(config, "sk-or-test-key");

    // Freeze time so we stay within the same 1-minute window
    const startTime = Date.now();
    setSystemTime(startTime);

    // Make 20 allowed requests
    for (let i = 0; i < 20; i++) {
      await provider.chat(request);
    }

    // The 21st request should throw an error
    let threwError = false;
    try {
      await provider.chat(request);
    } catch (e: unknown) {
      threwError = true;
      expect((e as Error).message).toBe("Rate limit exceeded: Please try again later.");
    }
    expect(threwError).toBe(true);

    // Advance time by 61 seconds to clear the rate limit
    setSystemTime(startTime + 61000);

    // The 22nd request should now succeed
    const response = await provider.chat(request);
    expect(response.content).toBe("Mocked response");
  });
});
