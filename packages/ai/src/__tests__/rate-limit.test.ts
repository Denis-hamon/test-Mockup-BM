import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter } from "../rate-limit/limiter";
import type { RateLimiter } from "../rate-limit/limiter";

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("createRateLimiter({ maxRequests: 3, windowMs: 1000 }) allows 3 calls", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 1000 });
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(true);
    expect(limiter.check("user1").allowed).toBe(true);
  });

  it("4th call within window is rejected (returns { allowed: false })", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 1000 });
    limiter.check("user1");
    limiter.check("user1");
    limiter.check("user1");
    const result = limiter.check("user1");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("after window expires, calls are allowed again", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 1000 });
    limiter.check("user1");
    limiter.check("user1");
    limiter.check("user1");
    expect(limiter.check("user1").allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1001);

    expect(limiter.check("user1").allowed).toBe(true);
  });

  it("different user IDs have independent limits", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000 });
    limiter.check("user1");
    limiter.check("user1");
    expect(limiter.check("user1").allowed).toBe(false);

    // user2 should still be allowed
    expect(limiter.check("user2").allowed).toBe(true);
    expect(limiter.check("user2").allowed).toBe(true);
    expect(limiter.check("user2").allowed).toBe(false);
  });

  it("returns a RateLimiter with check method", () => {
    const limiter: RateLimiter = createRateLimiter({ maxRequests: 20, windowMs: 60_000 });
    expect(typeof limiter.check).toBe("function");
  });
});
