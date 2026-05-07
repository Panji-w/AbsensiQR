import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// GET: Ambil semua rooms
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        attendances: {

        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}

// POST: Buat room baru
export async function POST(req: Request) {
  try {
    const { name, location, startTime, endTime } = await req.json()

    console.log('Creating room:', { name, location, startTime, endTime })

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Name, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (end <= start) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    const token = crypto.randomUUID()

    const room = await prisma.room.create({
      data: {
        name,
        location,
        token,
        startTime: start,
        endTime: end,
        status: 'ACTIVE'
      }
    })

    console.log('Room created:', room)

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}