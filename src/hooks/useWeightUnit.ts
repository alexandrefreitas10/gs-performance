'use client'
import { useState, useEffect } from 'react'

export type WeightUnit = 'lbs' | 'kg'

export const LBS_TO_KG = 0.453592
export const KG_TO_LBS = 2.20462

export function lbsToKg(lbs: number): number {
  return lbs * LBS_TO_KG
}
export function kgToLbs(kg: number): number {
  return kg * KG_TO_LBS
}

// Convert stored lbs string to display unit string
export function formatWeightDisplay(storedLbs: string, displayUnit: WeightUnit): string {
  if (!storedLbs?.trim()) return storedLbs ?? ''
  const num = parseFloat(storedLbs.replace(',', '.'))
  if (isNaN(num)) return storedLbs
  if (displayUnit === 'kg') {
    const kg = lbsToKg(num)
    return kg % 1 === 0 ? String(kg) : kg.toFixed(1)
  }
  return storedLbs
}

// Convert display unit string back to lbs string for storage
export function parseWeightToLbs(displayVal: string, displayUnit: WeightUnit): string {
  if (!displayVal?.trim()) return displayVal ?? ''
  const num = parseFloat(displayVal.replace(',', '.'))
  if (isNaN(num)) return displayVal
  if (displayUnit === 'kg') {
    const lbs = kgToLbs(num)
    return lbs % 1 === 0 ? String(Math.round(lbs)) : lbs.toFixed(1)
  }
  return displayVal
}

export function useWeightUnit() {
  const [unit, setUnitState] = useState<WeightUnit>('lbs')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('gs_weight_unit')
    if (saved === 'kg' || saved === 'lbs') setUnitState(saved)
    setReady(true)
  }, [])

  function setUnit(u: WeightUnit) {
    setUnitState(u)
    localStorage.setItem('gs_weight_unit', u)
  }

  return { unit, setUnit, ready }
}
