import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const ruangan = await prisma.ruangan.findMany({
    orderBy: { id: "asc" },
  })
  return NextResponse.json(ruangan)
}