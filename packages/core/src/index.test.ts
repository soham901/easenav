import { describe, expect, it } from "vitest";
import { mockCore } from "./index";

describe("core manager", () => {
  it("returns the mock message", () => {
    expect(mockCore()).toBe("core setup works");
  });
});
