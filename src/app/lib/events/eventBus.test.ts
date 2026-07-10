import { expect, test, describe, spyOn, afterEach, mock } from "bun:test";
import { eventBus } from "./eventBus";

describe("AgentEventBus", () => {
  let consoleSpy: ReturnType<typeof spyOn> | undefined;

  afterEach(() => {
    eventBus.clear();
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
  });

  test("publish should continue calling subsequent listeners if one throws", () => {
    consoleSpy = spyOn(console, "error").mockImplementation(() => {});
    const listener1 = mock(() => { throw new Error("Listener 1 failed"); });
    const listener2 = mock(() => {});

    eventBus.subscribe("test-event", listener1);
    eventBus.subscribe("test-event", listener2);

    eventBus.publish("test-event", { data: 123 });

    expect(listener1).toHaveBeenCalledWith({ data: 123 });
    expect(listener2).toHaveBeenCalledWith({ data: 123 });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
