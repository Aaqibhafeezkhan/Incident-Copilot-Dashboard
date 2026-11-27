import { NextResponse } from "next/server";
import { incidents } from "@/lib/demo-data";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ incidents, source: "demo-seed" });
}
