import { useEffect, useRef } from 'react'
import { STATUS_PERMINTAAN } from './constants'
import { playReminderSound } from './sound'

export function useReminderKeberangkatan(permintaan) {
  const timerRefs = useRef([])

  useEffect(() => {
    timerRefs.current.forEach(clearTimeout)
    timerRefs.current = []

    const adaWaktu = permintaan?.status === STATUS_PERMINTAAN.DITERIMA && permintaan?.waktu
    if (!adaWaktu) return

    const [jam, menit] = permintaan.waktu.split(':').map(Number)
    const target = new Date()
    target.setHours(jam, menit, 0, 0)

    const sekarang = new Date()

    const jadwalReminder = [
      { menitSebelum: 5, judul: '⏰ 5 Menit Lagi!', pesan: `Waktunya siap-siap berangkat, jam ${permintaan.waktu} harus udah jalan.` },
      { menitSebelum: 1, judul: '🚨 1 Menit Lagi!', pesan: 'Udah harus berangkat SEKARANG!' },
    ]

    jadwalReminder.forEach(({ menitSebelum, judul, pesan }) => {
      const waktuTrigger = new Date(target.getTime() - menitSebelum * 60 * 1000)
      const delay = waktuTrigger.getTime() - sekarang.getTime()

      if (delay > 0) {
        const id = setTimeout(() => {
          playReminderSound()
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(judul, {
              body: pesan,
              tag: 'reminder-keberangkatan',
              icon: '/icons/apple-touch-icon.png',
            })
          }
        }, delay)
        timerRefs.current.push(id)
      }
    })

    return () => {
      timerRefs.current.forEach(clearTimeout)
      timerRefs.current = []
    }
  }, [permintaan?.status, permintaan?.waktu])
}