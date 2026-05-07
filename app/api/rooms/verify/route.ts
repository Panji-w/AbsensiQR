import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    console.log('=== VERIFY API CALLED ===')
    console.log('Token:', token)

    if (!token) {
      console.log('No token provided')
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const room = await prisma.room.findUnique({
      where: { token },
      select: {
        id: true,
        name: true,
        status: true,
        startTime: true,
        endTime: true
      }
    })

    console.log('Room found:', room)

    if (!room) {
      console.log('Room not found')
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Auto update status
    if (room.status === 'ACTIVE' && new Date() > new Date(room.endTime)) {
      console.log('Updating room status to FINISHED')
      await prisma.room.update({
        where: { token },
        data: { status: 'FINISHED' }
      })
      
      return NextResponse.json({
        ...room,
        status: 'FINISHED'
      })
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('=== ERROR IN VERIFY API ===')
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to verify token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}