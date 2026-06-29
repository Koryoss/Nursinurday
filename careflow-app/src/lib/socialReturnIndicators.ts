export type Band = 'low' | 'normal' | 'high'

export type MetricKey = 'dizziness' | 'gait' | 'anxiety' | 'tension' | 'sleep'

export type MetricSeries = Partial<Record<MetricKey, number[]>>

export type Baseline = {
  metric: MetricKey
  rolling7_mean: number
  rolling7_sd: number
}

export type DailyMetricPoint = {
  date: string
  dizziness?: number
  gait?: number
  anxiety?: number
  tension?: number
  sleep?: number
}

export type IndicatorBands = {
  readiness: Band
  steadiness: Band
  activity_range: Band
}

export type TrendPoint = {
  date: string
  dizziness: number | null
  gait: number | null
  anxiety: number | null
  tension: number | null
  sleep: number | null
}

export type CorrelationItem = {
  pair: string
  direction: 'together' | 'opposite' | 'unclear'
  label: string
  sampleSize: number
}

const METRICS: MetricKey[] = ['dizziness', 'gait', 'anxiety', 'tension', 'sleep']

export function mean(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function standardDeviation(values: number[]) {
  if (values.length < 2) return 0
  const avg = mean(values)
  const variance = values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / values.length
  return Math.sqrt(variance)
}

export function bandFromZ(value: number | null | undefined, baseline?: Baseline): Band {
  if (value === null || value === undefined || !baseline || baseline.rolling7_sd === 0) return 'normal'
  const z = (value - baseline.rolling7_mean) / baseline.rolling7_sd
  if (z < -0.5) return 'low'
  if (z > 0.5) return 'high'
  return 'normal'
}

export function invertBand(band: Band): Band {
  if (band === 'low') return 'high'
  if (band === 'high') return 'low'
  return 'normal'
}

export function bandRank(band: Band) {
  if (band === 'low') return 0
  if (band === 'high') return 2
  return 1
}

export function rankToBand(rank: number): Band {
  if (rank < 0.75) return 'low'
  if (rank > 1.25) return 'high'
  return 'normal'
}

export function buildBaselines(points: DailyMetricPoint[]): Baseline[] {
  const series: MetricSeries = {}
  METRICS.forEach(metric => {
    series[metric] = points
      .map(point => point[metric])
      .filter((value): value is number => typeof value === 'number')
  })

  return METRICS.map(metric => ({
    metric,
    rolling7_mean: mean(series[metric] ?? []),
    rolling7_sd: standardDeviation(series[metric] ?? []),
  }))
}

export function calculateIndicatorBands(today: DailyMetricPoint | null, baselines: Baseline[]): IndicatorBands {
  const byMetric = Object.fromEntries(baselines.map(baseline => [baseline.metric, baseline])) as Partial<Record<MetricKey, Baseline>>
  const anxietyBand = bandFromZ(today?.anxiety, byMetric.anxiety)
  const tensionBand = bandFromZ(today?.tension, byMetric.tension)
  const sleepBand = bandFromZ(today?.sleep, byMetric.sleep)
  const dizzinessBand = bandFromZ(today?.dizziness, byMetric.dizziness)
  const gaitBand = bandFromZ(today?.gait, byMetric.gait)

  const readinessLoad = rankToBand(mean([bandRank(anxietyBand), bandRank(tensionBand), bandRank(sleepBand)]))
  const steadinessLoad = rankToBand(mean([bandRank(dizzinessBand), bandRank(gaitBand)]))
  const readiness = invertBand(readinessLoad)
  const steadiness = invertBand(steadinessLoad)
  const activity_range = rankToBand(mean([bandRank(readiness), bandRank(steadiness)]))

  return { readiness, steadiness, activity_range }
}

function pearson(xs: number[], ys: number[]) {
  if (xs.length !== ys.length || xs.length < 3) return null
  const xMean = mean(xs)
  const yMean = mean(ys)
  let numerator = 0
  let xDenominator = 0
  let yDenominator = 0

  xs.forEach((x, index) => {
    const xDiff = x - xMean
    const yDiff = ys[index] - yMean
    numerator += xDiff * yDiff
    xDenominator += xDiff * xDiff
    yDenominator += yDiff * yDiff
  })

  const denominator = Math.sqrt(xDenominator * yDenominator)
  if (denominator === 0) return null
  return numerator / denominator
}

export function buildCorrelations(points: TrendPoint[]): CorrelationItem[] {
  const pairs: [MetricKey, MetricKey, string][] = [
    ['dizziness', 'gait', '어지럼-걷기불안'],
    ['anxiety', 'tension', '불안-긴장'],
    ['sleep', 'anxiety', '수면-불안'],
    ['sleep', 'dizziness', '수면-어지럼'],
  ]

  return pairs
    .map(([left, right, pair]) => {
      const rows = points
        .map(point => [point[left], point[right]])
        .filter((values): values is [number, number] => typeof values[0] === 'number' && typeof values[1] === 'number')

      if (rows.length < 3) {
        return null
      }

      const coefficient = pearson(rows.map(row => row[0]), rows.map(row => row[1]))
      if (coefficient === null) {
        return null
      }

      if (coefficient > 0.5) {
        return { pair, direction: 'together', label: '함께 오르내리는 흐름이 관찰돼요.', sampleSize: rows.length }
      }
      if (coefficient < -0.5) {
        return { pair, direction: 'opposite', label: '서로 반대로 움직이는 흐름이 관찰돼요.', sampleSize: rows.length }
      }

      return null
    })
    .filter((item): item is CorrelationItem => item !== null)
}

export function formatKstDate(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10)
}

export function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
