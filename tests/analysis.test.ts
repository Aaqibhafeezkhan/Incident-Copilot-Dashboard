import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeIncident } from "../lib/analysis";
import { incidents } from "../lib/demo-data";

describe("analyzeIncident", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
  it("returns evidence-grounded fallback analysis without a provider key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const result = await analyzeIncident(incidents[0]);
    expect(result.provider).toBe("Rules-based demo");
    expect(result.summary).toContain("INC-2481");
    expect(result.evidence.some((item) => item.includes("Incident description"))).toBe(true);
    expect(result.recommendedActions.length).toBeGreaterThan(0);
    expect(result.missingInformation.length).toBeGreaterThan(0);
  });
  it("labels the suspected cause as a hypothesis", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    expect((await analyzeIncident(incidents[0])).suspectedRootCause.toLowerCase()).toContain("hypothesis");
  });
  it("falls back safely when the provider request fails", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_BASE_URL", "https://provider.invalid/v1");
    vi.stubEnv("OPENAI_TIMEOUT_MS", "1000");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    const result = await analyzeIncident(incidents[0]);
    expect(result.provider).toBe("Rules-based demo");
    expect(result.recommendedActions.length).toBeGreaterThan(0);
  });
});
