import { NextResponse } from "next/server";
import { z } from "zod";
import { incidents } from "@/lib/demo-data";

const schema = z.object({ status: z.enum(["OPEN", "INVESTIGATING", "MITIGATED", "RESOLVED"]) });
export const dynamic = "force-dynamic";
export async function PATCH(request: Request, context: { params: { id: string } }) {
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid status update." }, { status: 400 });
  const incident = incidents.find((item) => item.id === context.params.id);
  if (!incident) return NextResponse.json({ error: "Incident not found." }, { status: 404 });
  return NextResponse.json({ incidentId: incident.id, requestedStatus: body.data.status, persisted: false, message: "Demo mode: connect PostgreSQL to persist status changes." });
}
