import { incidents, knowledge, type Incident } from "./demo-data";

export type CopilotAnalysis = {
  summary: string;
  suspectedRootCause: string;
  confidence: number;
  impactAssessment: string;
  recommendedActions: { priority: "now" | "next" | "later"; title: string; detail: string }[];
  evidence: string[];
  missingInformation: string[];
  relatedIncidents: string[];
  provider: "OpenAI-compatible" | "Rules-based demo";
};

function fallbackAnalysis(incident: Incident): CopilotAnalysis {
  const article = knowledge.find((item) => item.service === incident.service);
  const related = incidents.filter((item) => item.id !== incident.id && (item.service === incident.service || item.description.toLowerCase().split(" ").some((word) => word.length > 5 && item.description.toLowerCase().includes(word)))).slice(0, 2);
  const payment = incident.service === "Payment Gateway";
  const database = incident.service === "Order Management";
  const cause = payment
    ? "A processor-routing or gateway configuration change is a plausible trigger because the reported failures began after a deployment and are concentrated on one transaction route. This is a hypothesis, not a confirmed root cause."
    : database
      ? "Connection pool saturation is a plausible contributor to the latency increase. The available incident description does not establish whether this is caused by a connection leak, slow queries, locks, or a traffic increase."
      : "The incident description points to a service-specific degradation, but the available evidence is insufficient to identify a confirmed root cause.";
  return {
    summary: `${incident.id} is a ${incident.severity} ${incident.status.toLowerCase()} incident affecting ${incident.service}. ${incident.impact}`,
    suspectedRootCause: cause,
    confidence: payment || database ? 0.62 : 0.38,
    impactAssessment: incident.impact + " Validate current customer and transaction impact against live telemetry before communicating scope.",
    recommendedActions: [
      { priority: "now", title: "Confirm blast radius", detail: "Break down error rate, latency and affected requests by region, customer cohort and dependency. Record the query window and baseline." },
      { priority: "now", title: payment ? "Compare processor routing" : database ? "Inspect connection pool and database health" : "Review recent changes and dependencies", detail: payment ? "Compare current routing weights, processor response codes and the last known-good configuration. Avoid broad retries until idempotency and processor health are verified." : database ? "Inspect active/idle connections, wait events, slow queries and connection acquisition time. Check for leaks before changing pool limits." : "Correlate deployment/configuration changes with incident start time and inspect dependency health and recent error traces." },
      { priority: "next", title: "Apply a reversible mitigation", detail: "Use a small, controlled change with an explicit rollback path. Monitor the primary symptom and guardrail metrics after each change." },
      { priority: "later", title: "Capture prevention work", detail: "Document the confirmed cause, detection gap and follow-up actions after service health is restored." }
    ],
    evidence: [`Incident description: ${incident.description}`, `Reported impact: ${incident.impact}`, ...incident.events.slice(-3).map((event) => `${event.actor}: ${event.message}`), ...(article ? [`Relevant runbook: ${article.title}`] : [])],
    missingInformation: ["Exact incident start time and the last known-good deployment/configuration", "Time-series metrics and representative error traces", "Affected regions, customer cohorts and dependency response codes", "Whether mitigation has changed the primary symptom"],
    relatedIncidents: related.map((item) => item.id),
    provider: "Rules-based demo"
  };
}

export async function analyzeIncident(incident: Incident): Promise<CopilotAnalysis> {
  const fallback = fallbackAnalysis(incident);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.OPENAI_TIMEOUT_MS || 30000));
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are an incident response copilot. Return JSON with keys summary, suspectedRootCause, confidence (0-1), impactAssessment, recommendedActions (array of {priority: now|next|later,title,detail}), evidence (string array), missingInformation (string array), relatedIncidents (string array). Separate facts from hypotheses. Never invent telemetry, claim a mitigation was executed, or state an unverified root cause as fact. Give safe, reversible, observable actions. Use only supplied incident data." },
          { role: "user", content: JSON.stringify({ incident, recentIncidents: incidents.filter((item) => item.id !== incident.id).slice(0, 5), relevantRunbooks: knowledge.filter((item) => item.service === incident.service) }) }
        ]
      })
    });
    if (!response.ok) throw new Error(`AI provider returned HTTP ${response.status}`);
    const payload = await response.json();
    const raw = payload.choices?.[0]?.message?.content;
    if (typeof raw !== "string") throw new Error("AI provider returned an empty response");
    const parsed = JSON.parse(raw) as Omit<CopilotAnalysis, "provider">;
    if (!parsed.summary || !parsed.suspectedRootCause || !Array.isArray(parsed.recommendedActions) || !Array.isArray(parsed.evidence)) throw new Error("AI response did not match the expected schema");
    return { ...parsed, confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)), provider: "OpenAI-compatible" };
  } catch (error) {
    console.error("Incident analysis provider failed; using deterministic fallback.", error);
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}
