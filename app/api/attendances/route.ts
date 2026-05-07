import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { name, instansi, gender, phone, email, position, signature, roomId } = await req.json()

    console.log('=== ATTENDANCE API CALLED ===')
    console.log('Data received:', { name, instansi, gender, phone, email, position, roomId })

    // Validasi input
    if (!name || !instansi || !gender || !phone || !position || !signature || !roomId) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    // Cek apakah room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    })

    console.log('Room found:', room)

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Cek status room
    if (room.status === 'FINISHED') {
      return NextResponse.json(
        { error: 'Room is already finished' },
        { status: 400 }
      )
    }

    // Cek apakah sudah lewat endTime
    if (new Date() > new Date(room.endTime)) {
      console.log('Room time has expired, updating status')
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'FINISHED' }
      })

      return NextResponse.json(
        { error: 'Room time has expired' },
        { status: 400 }
      )
    }

    // Buat attendance
    const attendance = await prisma.attendance.create({
      data: {
        name,
        instansi,
        gender,
        phone,
        position,
        signature,
        email: email || null,
        roomId
      },
      include: {
        room: true
      }
    })

    console.log('Attendance created:', attendance)

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    console.error('=== ERROR IN ATTENDANCE API ===')
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to create attendance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')

    const where = roomId ? { roomId: parseInt(roomId) } : {}

    const attendances = await prisma.attendance.findMany({
      where,
      select: {
        id: true,
        name: true,
        instansi: true,
        gender: true,
        phone: true,
        email: true,
        position: true,
        createdAt: true,
        room: {
          select: {
            id: true,
            name: true,
            status: true,
            startTime: true,
            endTime: true,
          }
        }
        // signature TIDAK diambil — base64 terlalu besar untuk list
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(attendances)
  } catch (error) {
    console.error('Error fetching attendances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendances' },
      { status: 500 }
    )
  }
}