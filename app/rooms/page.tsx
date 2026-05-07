"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

type Room = {
  id: number
  name: string
  location?: string
  token: string
  startTime: string
  endTime: string
  status: string
  attendances: any[]
}

type Ruangan = {
  id: number
  Room: string
}

export default function RoomsPage() {
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("11:00")

  // Ruangan list
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([])

  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>(new Date().getMonth().toString())
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString())
  const [filterType, setFilterType] = useState<'all' | 'month' | 'custom'>('month')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>()
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>()
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  useEffect(() => {
    fetchRooms()
    fetchRuangan()
  }, [])

  useEffect(() => {
    applyFilter()
  }, [rooms, filterMonth, filterYear, filterType, customStartDate, customEndDate])

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms')
      if (res.ok) {
        const data = await res.json()
        setRooms(data)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRuangan = async () => {
    try {
      const res = await fetch('/api/ruangan')
      if (res.ok) {
        const data = await res.json()
        setRuanganList(data)
      }
    } catch (error) {
      console.error('Error fetching ruangan:', error)
    }
  }

  const applyFilter = () => {
    if (filterType === 'all') {
      setFilteredRooms(rooms)
      return
    }

    if (filterType === 'month') {
      const filtered = rooms.filter(room => {
        const roomDate = new Date(room.startTime)
        return (
          roomDate.getMonth() === parseInt(filterMonth) &&
          roomDate.getFullYear() === parseInt(filterYear)
        )
      })
      setFilteredRooms(filtered)
      return
    }

    if (filterType === 'custom' && customStartDate && customEndDate) {
      const filtered = rooms.filter(room => {
        const roomDate = new Date(room.startTime)
        const start = new Date(customStartDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(customEndDate)
        end.setHours(23, 59, 59, 999)
        return roomDate >= start && roomDate <= end
      })
      setFilteredRooms(filtered)
      return
    }

    setFilteredRooms(rooms)
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    })
  }

  const combineDateTime = (date?: Date, time?: string) => {
    if (!date || !time) return ""
    const [hour, minute] = time.split(":")
    const newDate = new Date(date)
    newDate.setHours(Number(hour))
    newDate.setMinutes(Number(minute))
    return newDate.toISOString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const combinedStartTime = combineDateTime(startDate, startTime)
      const combinedEndTime = combineDateTime(endDate, endTime)

      if (!combinedStartTime || !combinedEndTime) {
        alert('Silakan pilih tanggal dan waktu dengan benar!')
        setSubmitting(false)
        return
      }

      if (new Date(combinedEndTime) <= new Date(combinedStartTime)) {
        alert('Waktu selesai harus lebih dari waktu mulai!')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location || undefined,
          startTime: combinedStartTime,
          endTime: combinedEndTime,
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create room')
      }

      setFormData({ name: "", location: "" })
      setStartDate(new Date())
      setEndDate(new Date())
      setStartTime("09:00")
      setEndTime("11:00")
      setShowForm(false)
      fetchRooms()
      alert('Room berhasil dibuat!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus room ini? Semua data absensi juga akan terhapus.')) return

    try {
      const res = await fetch(`/api/rooms/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchRooms()
        alert('Room berhasil dihapus!')
      }
    } catch (error) {
      alert('Gagal menghapus room')
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    alert('Token berhasil disalin!')
  }

  const generateQRLink = (token: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/absen/${token}`
  }

  const calculateDuration = () => {
    if (!startDate || !endDate) return "0 menit"
    const start = new Date(combineDateTime(startDate, startTime))
    const end = new Date(combineDateTime(endDate, endTime))
    const diff = end.getTime() - start.getTime()
    const minutes = Math.round(diff / (1000 * 60))
    const hours = Math.round(minutes / 60 * 10) / 10

    if (minutes < 60) {
      return `${minutes} menit`
    }
    return `${hours} jam (${minutes} menit)`
  }

  const months = [
    { value: '0', label: 'Januari' },
    { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' },
    { value: '3', label: 'April' },
    { value: '4', label: 'Mei' },
    { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' },
    { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' },
    { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' },
    { value: '11', label: 'Desember' },
  ]

  const years = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - 5 + i
    return { value: year.toString(), label: year.toString() }
  })

  const resetCustomDates = () => {
    setCustomStartDate(undefined)
    setCustomEndDate(undefined)
  }

  const getFilterSummary = () => {
    if (filterType === 'all') return 'Semua Data'
    if (filterType === 'month') {
      const monthLabel = months.find(m => m.value === filterMonth)?.label
      return `${monthLabel} ${filterYear}`
    }
    if (filterType === 'custom' && customStartDate && customEndDate) {
      return `${customStartDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${customEndDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return 'Filter'
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Kelola semua room rapat dan absensi</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-lg"
              >
                {showForm ? '✕ Tutup Form' : '+ Buat Room Baru'}
              </button>
              
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="inline-flex items-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition shadow-lg"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
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
              <p className="text-gray-400 mb-6">
                Apakah Anda yakin ingin keluar dari aplikasi?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Ya, Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Date Picker Modal */}
        {showCustomDatePicker && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-4xl w-full mx-4 shadow-2xl">
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Pilih Rentang Tanggal</h3>
                <button
                  onClick={() => setShowCustomDatePicker(false)}
                  className="text-gray-400 hover:text-gray-200 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Tanggal Mulai</label>
                    <div className="flex justify-center p-4 bg-gray-800 rounded-xl">
                      <DayPicker
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        modifiersClassNames={{
                          selected: "bg-blue-600 text-white font-semibold",
                          today: "border border-blue-400 text-blue-400 rounded-full font-semibold",
                        }}
                        classNames={{
                          day: "hover:bg-blue-600 hover:text-white rounded-full transition",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Tanggal Selesai</label>
                    <div className="flex justify-center p-4 bg-gray-800 rounded-xl">
                      <DayPicker
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        disabled={{ before: customStartDate || new Date(0) }}
                        modifiersClassNames={{
                          selected: "bg-blue-600 text-white font-semibold",
                          today: "border border-blue-400 text-blue-400 rounded-full font-semibold",
                        }}
                        classNames={{
                          day: "hover:bg-blue-600 hover:text-white rounded-full transition",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={() => {
                      resetCustomDates()
                      setShowCustomDatePicker(false)
                    }}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      if (customStartDate && customEndDate) {
                        setFilterType('custom')
                        setShowCustomDatePicker(false)
                      } else {
                        alert('Silakan pilih tanggal mulai dan selesai')
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="mb-8 p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-xl">
            <h2 className="text-xl font-semibold mb-6">Buat Room Rapat Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nama Rapat
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Contoh: Rapat Koordinasi Tim Marketing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Lokasi Rapat
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Pilih Lokasi Rapat</option>
                  {ruanganList.map((r) => (
                    <option key={r.id} value={r.Room}>
                      {r.Room}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* START TIME */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Waktu Mulai Rapat
                  </label>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-3">
                    <div className="flex justify-center p-4 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
                      <DayPicker
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={{ before: new Date() }}
                        modifiersClassNames={{
                          selected: "bg-blue-600 text-white font-semibold",
                          today: "border border-blue-400 text-blue-400 rounded-full font-semibold",
                        }}
                        classNames={{
                          day: "hover:bg-blue-600 hover:text-white rounded-full transition",
                        }}
                      />
                    </div>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-3 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* END TIME */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Waktu Selesai Rapat
                  </label>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-3">
                    <div className="flex justify-center p-4 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
                      <DayPicker
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={{ before: startDate || new Date() }}
                        modifiersClassNames={{
                          selected: "bg-blue-600 text-white font-semibold",
                          today: "border border-blue-400 text-blue-400 rounded-full font-semibold",
                        }}
                        classNames={{
                          day: "hover:bg-blue-600 hover:text-white rounded-full transition",
                        }}
                      />
                    </div>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-3 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Duration Info */}
              {startDate && endDate && (
                <div className="flex items-center gap-2 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-300">
                    Durasi: {calculateDuration()}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition shadow-lg"
                >
                  {submitting ? 'Membuat...' : '✓ Buat Room'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Section */}
        <div className="mb-6 p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h3 className="text-lg font-semibold">Filter Data</h3>
              <span className="px-3 py-1 text-xs bg-blue-900/30 text-blue-400 rounded-full border border-blue-800">
                {getFilterSummary()}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <button
                onClick={() => { setFilterType('all'); resetCustomDates() }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Semua Data
              </button>
              <button
                onClick={() => { setFilterType('month'); resetCustomDates() }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterType === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Per Bulan
              </button>
              <button
                onClick={() => setShowCustomDatePicker(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterType === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Rentang Tanggal
              </button>
            </div>
          </div>

          {filterType === 'month' && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Bulan</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-500"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Tahun</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-blue-500"
                >
                  {years.map(year => (
                    <option key={year.value} value={year.value}>{year.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {filterType === 'custom' && customStartDate && customEndDate && (
            <div className="mt-4 flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-300">
                  {customStartDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' - '}
                  {customEndDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <button
                onClick={() => setShowCustomDatePicker(true)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Ubah
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total Room</p>
            <p className="text-3xl font-bold">{filteredRooms.length}</p>
          </div>
          <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Room Aktif</p>
            <p className="text-3xl font-bold text-green-400">
              {filteredRooms.filter(r => r.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
            <p className="text-gray-400 text-sm mb-1">Total Peserta</p>
            <p className="text-3xl font-bold text-blue-400">
              {filteredRooms.reduce((sum, room) => sum + room.attendances.length, 0)}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-4">Loading...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400 text-lg mb-2">Tidak ada room ditemukan</p>
            <p className="text-gray-500 text-sm">
              {filterType === 'all'
                ? 'Klik tombol Buat Room Baru untuk memulai'
                : 'Coba ubah filter atau buat room baru'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="p-6 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-gray-700 transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{room.name}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        room.status === 'ACTIVE'
                          ? 'bg-green-900/30 text-green-400 border border-green-800'
                          : 'bg-red-900/30 text-red-400 border border-red-800'
                      }`}>
                        {room.status === 'ACTIVE' ? 'AKTIF' : 'SELESAI'}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Token:</span>
                        <code className="px-2 py-1 bg-gray-800 rounded text-xs">{room.token}</code>
                        <button
                          onClick={() => copyToken(room.token)}
                          className="text-blue-400 hover:text-blue-300 text-xs"
                        >
                          Salin
                        </button>
                      </div>
                      {room.location && (
                        <p><span className="font-medium">Lokasi:</span> {room.location}</p>
                      )}
                      <p>
                        <span className="font-medium">Waktu:</span>{' '}
                        {new Date(room.startTime).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                        {' - '}
                        {new Date(room.endTime).toLocaleString('id-ID', { timeStyle: 'short' })}
                      </p>
                      <p>
                        <span className="font-medium">Link Absensi:</span>{' '}
                        <a href={generateQRLink(room.token)} target="_blank" className="text-blue-400 hover:underline">
                          {generateQRLink(room.token)}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400">
                    <span className="font-semibold text-blue-400">{room.attendances.length}</span> peserta sudah absen
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/rooms/${room.id}`)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                    >
                      Lihat Detail
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}