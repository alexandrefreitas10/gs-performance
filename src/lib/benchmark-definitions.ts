export type BenchmarkCategory = 'Levantamento de Peso' | 'Ginástico' | 'Monoestrutural'

export interface BenchmarkDef {
  name: string
  category: BenchmarkCategory
  unit: string
}

export const BENCHMARK_DEFINITIONS: BenchmarkDef[] = [
  // Levantamento de Peso
  { name: '1RM Back Squat', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Front Squat', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Deadlift', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Bench Press', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Shoulder Press', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '2RM Back Squat', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '2RM Front Squat', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '2RM Deadlift', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '2RM Bench Press', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '2RM Shoulder Press', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '5RM Back Squat', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '5RM Front Squat', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '5RM Deadlift', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '5RM Bench Press', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '5RM Shoulder Press', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '10RM Back Squat', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '10RM Front Squat', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '10RM Deadlift', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '10RM Bench Press', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '10RM Shoulder Press', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Squat Snatch', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Power Snatch', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Power Clean', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Squat Clean', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Clean & Jerk', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Push Press', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Push Jerk', category: 'Levantamento de Peso', unit: 'lbs' },
  { name: '1RM Split Jerk', category: 'Levantamento de Peso', unit: 'lbs' },

  // Ginástico
  { name: 'Máx Reps T2B', category: 'Ginástico', unit: 'reps' },
  { name: 'Máx Reps C2B', category: 'Ginástico', unit: 'reps' },
  { name: 'Máx Reps Pull Up', category: 'Ginástico', unit: 'reps' },
  { name: 'Máx Reps Bar Muscle Up', category: 'Ginástico', unit: 'reps' },
  { name: 'Máx Reps Ring Muscle Up', category: 'Ginástico', unit: 'reps' },
  { name: 'Máx Reps Strict HSPU', category: 'Ginástico', unit: 'reps' },
  { name: 'Máx Reps Kipping HSPU', category: 'Ginástico', unit: 'reps' },

  // Monoestrutural
  { name: 'Menor Tempo 500m Row', category: 'Monoestrutural', unit: 'tempo' },
  { name: 'Menor Tempo 2km Row', category: 'Monoestrutural', unit: 'tempo' },
  { name: 'Menor Tempo 5km Row', category: 'Monoestrutural', unit: 'tempo' },
  { name: 'Menor Tempo 400m Run', category: 'Monoestrutural', unit: 'tempo' },
  { name: 'Menor Tempo 1,6km Run', category: 'Monoestrutural', unit: 'tempo' },
  { name: 'Menor Tempo 5km Run', category: 'Monoestrutural', unit: 'tempo' },
  { name: 'Menor Tempo 50 Cal Bike', category: 'Monoestrutural', unit: 'tempo' },
  { name: '1min Máx Cal Bike', category: 'Monoestrutural', unit: 'cal' },
]

export const CATEGORIES: BenchmarkCategory[] = [
  'Levantamento de Peso',
  'Ginástico',
  'Monoestrutural',
]
