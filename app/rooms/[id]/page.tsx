"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { QRCodeSVG } from 'qrcode.react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

type Attendance = {
  id: number
  name: string
  instansi: string
  gender: string
  phone: string
  email: string | null
  position: string
  signature: string
  createdAt: string
}

type Room = {
  id: number
  name: string
  token: string
  startTime: string
  endTime: string
  status: string
  attendances: Attendance[]
}

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [printing, setPrinting] = useState(false)

  const id = params?.id as string

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    fetchRoom()
    const interval = setInterval(() => { fetchRoom() }, 3000)
    return () => clearInterval(interval)
  }, [id])

  const fetchRoom = async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/rooms/${id}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })
      if (!res.ok) throw new Error(`Failed to fetch room: ${res.status}`)
      const data = await res.json()
      setRoom(data)
    } catch (error) {
      console.error('Error fetching room:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await signOut({ callbackUrl: '/login', redirect: true })
  }

  const generateQRLink = (token: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/absen/${token}`
  }

  const copyLink = (token: string) => {
    const link = generateQRLink(token)
    navigator.clipboard.writeText(link)
    alert('Link absensi berhasil disalin!')
  }

  const getRoomStatusBadge = (status: string) => {
    if (status === 'FINISHED') {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-900/30 text-red-400 border border-red-800">
          SELESAI
        </span>
      )
    }
    return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-900/30 text-green-400 border border-green-800">
        AKTIF
      </span>
    )
  }

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `QR-${room?.name}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const openDetailModal = (attendance: Attendance) => {
    setSelectedAttendance(attendance)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedAttendance(null)
  }

  const getGenderLabel = (gender: string) => {
    return gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'
  }

  const formatRoomTime = (room: Room) => {
    const startDate = new Date(room.startTime)
    const endDate = new Date(room.endTime)
    const isSameDay =
      startDate.getDate() === endDate.getDate() &&
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()

    if (isSameDay) {
      return `${startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pukul ${startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
    }
    return `${startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pukul ${startDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pukul ${endDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
  }

  const exportToExcel = () => {
    if (!room || room.attendances.length === 0) {
      alert('Tidak ada data untuk diekspor')
      return
    }
    setExporting(true)
    try {
      const excelData = room.attendances.map((attendance, index) => ({
        'No': index + 1,
        'Nama Lengkap': attendance.name,
        'Asal Instansi': attendance.instansi,
        'Jabatan': attendance.position,
        'Jenis Kelamin': getGenderLabel(attendance.gender),
        'No. HP': attendance.phone,
        'Email': attendance.email || '-',
        'Waktu Absen': new Date(attendance.createdAt).toLocaleString('id-ID', {
          dateStyle: 'full',
          timeStyle: 'medium'
        })
      }))

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      worksheet['!cols'] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 30 },
        { wch: 35 },
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Kehadiran')

      const roomInfo = [
        ['INFORMASI RAPAT'],
        [''],
        ['Nama Rapat', room.name],
        ['Status', room.status === 'ACTIVE' ? 'Aktif' : 'Selesai'],
        ['Waktu Mulai', new Date(room.startTime).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })],
        ['Waktu Selesai', new Date(room.endTime).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })],
        ['Total Peserta', room.attendances.length],
        [''],
        ['Diekspor pada', new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })]
      ]
      const infoSheet = XLSX.utils.aoa_to_sheet(roomInfo)
      infoSheet['!cols'] = [{ wch: 20 }, { wch: 50 }]
      XLSX.utils.book_append_sheet(workbook, infoSheet, 'Info Rapat')

      const fileName = `Absensi_${room.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(data, fileName)
      setTimeout(() => { alert('Data berhasil diekspor ke Excel!') }, 100)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Gagal mengekspor data ke Excel')
    } finally {
      setExporting(false)
    }
  }

  const printAttendance = () => {
    if (!room || room.attendances.length === 0) {
      alert('Tidak ada data untuk dicetak')
      return
    }

    setPrinting(true)

    const printContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Daftar Hadir - ${room.name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff; padding: 24px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 12px; }
          .header h1 { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
          .header p { font-size: 11px; color: #444; }
          .info-table { width: 100%; margin-bottom: 20px; }
          .info-table td { padding: 3px 8px; font-size: 11px; }
          .info-table td:first-child { font-weight: bold; width: 130px; }
          table.attendance { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          table.attendance th { background-color: #1e3a5f; color: #fff; padding: 8px 10px; text-align: left; font-size: 11px; }
          table.attendance td { padding: 7px 10px; border-bottom: 1px solid #ddd; font-size: 11px; vertical-align: middle; }
          table.attendance tr:nth-child(even) td { background-color: #f5f8ff; }
          .signature-img { max-height: 40px; max-width: 100px; object-fit: contain; }
          .footer { margin-top: 30px; display: flex; justify-content: right; }
          .footer .sign-box { text-align: center; }
          .footer .sign-box .line { margin-top: 60px; border-top: 1px solid #000; width: 160px; }
          .footer .sign-box p { font-size: 11px; margin-top: 4px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
          .badge-active { background: #dcfce7; color: #166534; }
          .badge-finished { background: #fee2e2; color: #991b1b; }
          @media print {
            body { padding: 0; }
            @page { margin: 1.5cm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DAFTAR HADIR</h1>
          <h1>${room.name}</h1>
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}</p>
        </div>

        <table class="info-table">
          <tr>
            <td>Nama Kegiatan</td>
            <td>: ${room.name}</td>
          </tr>
          <tr>
            <td>Waktu</td>
            <td>: ${formatRoomTime(room)}</td>
          </tr>
          <tr>
            <td>Total Peserta</td>
            <td>: <strong>${room.attendances.length} orang</strong></td>
          </tr>
        </table>

        <table class="attendance">
          <thead>
            <tr>
              <th style="width:32px">No</th>
              <th>Nama Lengkap</th>
              <th>Instansi</th>
              <th>Jabatan</th>
              <th>L/P</th>
              <th>No. HP</th>
              <th>Email</th>
              <th>Waktu Absen</th>
              <th>Tanda Tangan</th>
            </tr>
          </thead>
          <tbody>
            ${room.attendances.map((a, i) => `
              <tr>
                <td style="text-align:center">${i + 1}</td>
                <td>${a.name}</td>
                <td>${a.instansi}</td>
                <td>${a.position}</td>
                <td>${a.gender === 'LAKI_LAKI' ? 'L' : 'P'}</td>
                <td>${a.phone}</td>
                <td>${a.email || '-'}</td>
                <td>${new Date(a.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td><img src="${a.signature}" class="signature-img" alt="TTD" /></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div class="sign-box">
            <p>PPTR,</p>
            <div class="line"></div>
          </div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=1000,height=700')
    if (!printWindow) {
      alert('Popup diblokir. Izinkan popup untuk mencetak.')
      setPrinting(false)
      return
    }

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
        setPrinting(false)
      }, 500)
    }
  }

  if (!id && !loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-400 mb-4">Room ID tidak ditemukan di URL</p>
          <Link href="/rooms" className="text-gray-400 hover:text-gray-200 underline">← Kembali ke daftar room</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        ) : !room ? (
          <div>
            <p className="text-red-400 mb-4">Room tidak ditemukan</p>
            <Link href="/rooms" className="text-gray-400 hover:text-gray-200 underline">← Kembali ke daftar room</Link>
          </div>
        ) : (
          <>
            {/* Top Navigation Bar */}
            <div className="mb-6 flex items-center justify-between">
              <Link href="/rooms" className="inline-flex items-center text-gray-400 hover:text-gray-200 transition">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Kembali ke Dashboard
              </Link>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-800 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold">Konfirmasi Logout</h3>
                  </div>
                  <p className="text-gray-400 mb-6">Apakah Anda yakin ingin keluar dari aplikasi?</p>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition">
                      Batal
                    </button>
                    <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition">
                      Ya, Logout
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedAttendance && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-900/30 border border-blue-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold">Detail Peserta</h3>
                    </div>
                    <button onClick={closeDetailModal} className="text-gray-400 hover:text-gray-200 transition">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Nama Lengkap</label>
                      <p className="text-lg font-semibold text-gray-100">{selectedAttendance.name}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Asal Instansi</label>
                        <p className="text-gray-100">{selectedAttendance.instansi}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Jabatan</label>
                        <p className="text-gray-100">{selectedAttendance.position}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Jenis Kelamin</label>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-100">{getGenderLabel(selectedAttendance.gender)}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">No. HP</label>
                        <p className="text-gray-100">{selectedAttendance.phone}</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                      {selectedAttendance.email ? (
                        <a
                          href={`mailto:${selectedAttendance.email}`}
                          className="text-blue-400 hover:text-blue-300 hover:underline transition"
                        >
                          {selectedAttendance.email}
                        </a>
                      ) : (
                        <p className="text-gray-500 italic text-sm">Tidak diisi</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Waktu Absen</label>
                      <div className="flex items-center gap-2 text-gray-100">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(selectedAttendance.createdAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-3">Tanda Tangan Digital</label>
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-700 inline-block">
                        <img src={selectedAttendance.signature} alt="Tanda Tangan" className="max-w-full h-32 object-contain" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-500">ID Absensi: #{selectedAttendance.id}</p>
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 p-6">
                    <button onClick={closeDetailModal} className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg font-medium transition">
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">{room.name}</h1>
                {getRoomStatusBadge(room.status)}
              </div>
              <div className="text-gray-400 text-sm">
                <p><span className="font-medium">Waktu:</span> {formatRoomTime(room)}</p>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="mb-8 p-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="flex flex-col items-center">
                  <div className="bg-white p-6 rounded-2xl shadow-2xl mb-4">
                    <QRCodeSVG id="qr-code-svg" value={generateQRLink(room.token)} size={280} level="H" includeMargin={true} />
                  </div>
                  <p className="text-gray-400 text-sm text-center mb-4">Scan QR Code untuk absensi</p>
                  <button onClick={downloadQR} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
                    Download QR Code
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Informasi Absensi</h3>
                    <p className="text-gray-400 text-sm mb-4">Peserta dapat melakukan absensi dengan 2 cara:</p>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-start"><span className="text-blue-400 mr-2">1.</span><span>Scan QR Code di samping menggunakan kamera smartphone</span></li>
                      <li className="flex items-start"><span className="text-blue-400 mr-2">2.</span><span>Akses link di bawah ini secara manual</span></li>
                    </ul>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Link Absensi:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm text-blue-400 break-all">{generateQRLink(room.token)}</code>
                      <button onClick={() => copyLink(room.token)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition flex-shrink-0">
                        Salin
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Token Room:</p>
                    <code className="text-sm text-gray-300">{room.token}</code>
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-300">Daftar kehadiran akan otomatis diperbarui setiap 3 detik</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Table Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Daftar Kehadiran</h3>
                <div className="text-sm text-gray-400 mt-1">
                  Total Peserta: <span className="font-semibold text-blue-400">{room.attendances.length}</span>
                </div>
              </div>

              {room.attendances.length > 0 && (
                <div className="flex items-center gap-2">
                  {/* Print Button */}
                  <button
                    onClick={printAttendance}
                    disabled={printing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition shadow-lg"
                  >
                    {printing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Menyiapkan...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>Print</span>
                      </>
                    )}
                  </button>

                  {/* Export Excel Button */}
                  <button
                    onClick={exportToExcel}
                    disabled={exporting}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition shadow-lg"
                  >
                    {exporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Mengekspor...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export Excel</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {room.attendances.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-400 text-lg mb-2">Belum ada peserta yang absen</p>
                <p className="text-gray-500 text-sm">Peserta dapat scan QR Code di atas untuk melakukan absensi</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-800">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-900/50 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">No</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Nama</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Instansi</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Jabatan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Waktu Absen</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {room.attendances.map((attendance, index) => (
                      <tr key={attendance.id} className="border-t border-gray-800 hover:bg-gray-900/30 transition">
                        <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium">{attendance.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{attendance.instansi}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{attendance.position}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {attendance.email ? (
                            <a href={`mailto:${attendance.email}`} className="text-blue-400 hover:underline">
                              {attendance.email}
                            </a>
                          ) : (
                            <span className="text-gray-600 italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(attendance.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openDetailModal(attendance)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}