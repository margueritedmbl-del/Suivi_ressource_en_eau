import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "PSORE",
    version: process.env.npm_package_version || "2.6.0-render",
    runtime: "nodejs",
    timestamp: new Date().toISOString(),
  });
}
