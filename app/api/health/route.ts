import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString(), aiConfigured: Boolean(process.env.OPENAI_API_KEY), persistenceConfigured: Boolean(process.env.DATABASE_URL) });
}
