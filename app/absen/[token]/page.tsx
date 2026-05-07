"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import SignatureCanvas from "react-signature-canvas"

type Room = {
  id: number
  name: string
  status: string
  startTime: string
  endTime: string
}

type AttendanceEntry = {
  id: number
  name: string
  instansi: string
  gender: string
  position: string
  createdAt: string
}

export default function AbsenPage() {
  const { token } = useParams()
  const router = useRouter()
  const sigCanvas = useRef<SignatureCanvas>(null)

  const [room, setRoom] = useState<Room | null>(null)
  const [name, setName] = useState("")
  const [instansi, setInstansi] = useState("")
  const [gender, setGender] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [position, setPosition] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Attendance list popup state
  const [showAttendanceList, setShowAttendanceList] = useState(false)
  const [attendanceList, setAttendanceList] = useState<AttendanceEntry[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [listError, setListError] = useState("")

  useEffect(() => {
    fetchRoom()
  }, [token])

  const fetchRoom = async () => {
    try {
      const res = await fetch(`/api/rooms/verify?token=${token}`)

      if (!res.ok) {
        setError('Token tidak valid atau room tidak ditemukan')
        return
      }

      const data = await res.json()
      setRoom(data)

      if (data.status === 'FINISHED') {
        setError('Maaf, waktu absensi sudah berakhir')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceList = async () => {
    if (!room) return
    setLoadingList(true)
    setListError("")
    try {
      const res = await fetch(`/api/attendances?roomId=${room.id}&token=${token}`)
      if (!res.ok) throw new Error("Gagal memuat daftar absensi")
      const data = await res.json()
      setAttendanceList(data)
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoadingList(false)
    }
  }

  const openAttendanceList = () => {
    setShowAttendanceList(true)
    fetchAttendanceList()
  }

  const clearSignature = () => {
    sigCanvas.current?.clear()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    if (!room) {
      setError('Room tidak ditemukan')
      setSubmitting(false)
      return
    }

    if (room.status === 'FINISHED') {
      setError('Maaf, waktu absensi sudah berakhir')
      setSubmitting(false)
      return
    }

    if (sigCanvas.current?.isEmpty()) {
      setError('Silakan tanda tangan terlebih dahulu')
      setSubmitting(false)
      return
    }

    const signatureData = sigCanvas.current?.toDataURL('image/png')

    try {
      const res = await fetch("/api/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          instansi,
          gender,
          phone,
          email: email || null,
          position,
          signature: signatureData,
          roomId: room.id
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan absensi")
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Memuat...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {success ? (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-500 mb-2">Absensi Berhasil!</h2>
              <p className="text-gray-400 mb-1">
                Terima kasih, <span className="font-semibold text-gray-200">{name}</span>
              </p>
              <p className="text-gray-500 text-sm">
                Absensi Anda telah tercatat untuk rapat: <br />
                <span className="font-medium text-gray-300">{room?.name}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <button
                onClick={openAttendanceList}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Lihat Daftar Hadir
              </button>
              <Link href="/" className="inline-flex items-center justify-center text-gray-400 hover:text-gray-200 underline text-sm">
                Kembali ke Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-blue-600 rounded-2xl mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Form Absensi</h1>
              {room && (
                <>
                  <p className="text-gray-400 text-sm mb-1">{room.name}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(room.startTime).toLocaleString('id-ID', {
                      dateStyle: 'long',
                      timeStyle: 'short'
                    })}
                  </p>
                  {room.status === 'FINISHED' && (
                    <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
                      <p className="text-red-400 text-sm font-medium">⚠️ Waktu absensi sudah berakhir</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* View Attendance List Button */}
            {room && (
              <div className="mb-6 flex justify-center">
                <button
                  type="button"
                  onClick={openAttendanceList}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-300 hover:text-white transition font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Lihat Daftar Hadir
                </button>
              </div>
            )}

            {error && !room ? (
              <div>
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
                  <p className="text-red-400 text-center">{error}</p>
                </div>
                <div className="text-center">
                  <Link href="/" className="text-gray-400 hover:text-gray-200 underline text-sm">
                    ← Kembali ke Home
                  </Link>
                </div>
              </div>
            ) : room?.status === 'ACTIVE' ? (
              <form onSubmit={submit} className="space-y-5">
                {/* Nama Lengkap */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                {/* Asal Instansi */}
                <div>
                  <label htmlFor="instansi" className="block text-sm font-medium text-gray-300 mb-2">
                    Asal Instansi <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="instansi"
                    type="text"
                    placeholder="Masukkan nama instansi"
                    value={instansi}
                    onChange={(e) => setInstansi(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                {/* Jabatan */}
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-2">
                    Jabatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="position"
                    type="text"
                    placeholder="Masukkan jabatan"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-2">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>

                {/* No. HP */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                    No. HP <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>

                {/* Email (Opsional) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email <span className="text-gray-500 font-normal text-xs">(opsional)</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Contoh: nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>


                {/* Tanda Tangan Digital */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tanda Tangan Digital <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-gray-700 rounded-lg bg-white">
                    <SignatureCanvas
                      ref={sigCanvas}
                      canvasProps={{
                        className: 'w-full h-48 rounded-lg',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="mt-2 text-sm text-gray-400 hover:text-gray-200 underline"
                  >
                    Hapus Tanda Tangan
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition shadow-lg"
                >
                  {submitting ? "Mengirim..." : "✓ Kirim Absensi"}
                </button>
              </form>
            ) : (
              <div className="text-center">
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
                  <p className="text-red-400">Waktu absensi sudah berakhir</p>
                </div>
                <Link href="/" className="text-gray-400 hover:text-gray-200 underline text-sm">
                  ← Kembali ke Home
                </Link>
              </div>
            )}

            {room?.status === 'ACTIVE' && (
              <div className="mt-6 text-center">
                <Link href="/" className="text-gray-400 hover:text-gray-200 underline text-sm">
                  ← Kembali ke Home
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attendance List Modal */}
      {showAttendanceList && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAttendanceList(false) }}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-white">Daftar Hadir</h2>
                <p className="text-xs text-gray-500 mt-0.5">{room?.name}</p>
              </div>
              <button
                onClick={() => setShowAttendanceList(false)}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
 
            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-5">
              {loadingList ? (
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : listError ? (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-center">
                  <p className="text-red-400 text-sm">{listError}</p>
                  <button
                    onClick={fetchAttendanceList}
                    className="mt-3 text-sm text-gray-400 hover:text-white underline"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : attendanceList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-800 mb-3">
                    <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">Belum ada yang absen</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 mb-3">
                    Total: <span className="text-blue-400 font-semibold">{attendanceList.length} peserta</span>
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-gray-700">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                          <th className="px-3 py-3 text-left w-8">#</th>
                          <th className="px-3 py-3 text-left">Nama</th>
                          <th className="px-3 py-3 text-left">Instansi</th>
                          <th className="px-3 py-3 text-left">Jabatan</th>
                          <th className="px-3 py-3 text-left whitespace-nowrap">Waktu Absen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/60">
                        {attendanceList.map((entry, index) => (
                          <tr key={entry.id} className="bg-gray-900/60 hover:bg-gray-800/60 transition">
                            <td className="px-3 py-3 text-gray-500 text-xs">{index + 1}</td>
                            <td className="px-3 py-3 text-white font-medium max-w-[120px] truncate">{entry.name}</td>
                            <td className="px-3 py-3 text-gray-400 max-w-[100px] truncate">{entry.instansi}</td>
                            <td className="px-3 py-3 text-gray-400 max-w-[100px] truncate">{entry.position}</td>
                            <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                              {new Date(entry.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-800">
              <button
                onClick={() => setShowAttendanceList(false)}
                className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}