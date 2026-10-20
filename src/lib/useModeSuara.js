import { useSyncExternalStore } from 'react'
import { ambilModeSuara, aturModeSuara, dengarkanModeSuara } from './sound'

// Mode suara yang dipilih (normal / tanpa-voice / senyap) dan fungsi buat gantinya.
export function useModeSuara() {
  const mode = useSyncExternalStore(dengarkanModeSuara, ambilModeSuara)
  return [mode, aturModeSuara]
}
