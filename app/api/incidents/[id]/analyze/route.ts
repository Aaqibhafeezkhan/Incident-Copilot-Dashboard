import { NextResponse } from "next/server";
import { z } from "zod";
import { incidents } from "@/lib/demo-data";
import { analyzeIncident } from "@/lib/analysis";

const paramsSchema = z.object({ id: z.string().min(1).max(64) });
export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: { id: string } }) {
  const params = paramsSchema.safeParse(context.params);
  if (!params.success) return NextResponse.json({ error: "Invalid incident identifier." }, { status: 400 });
  const incident = incidents.find((item) => item.id === params.data.id);
  if (!incident) return NextResponse.json({ error: "Incident not found." }, { status: 404 });
  const analysis = await analyzeIncident(incident);
  return NextResponse.json({ incidentId: incident.id, analysis, generatedAt: new Date().toISOString() });
}
