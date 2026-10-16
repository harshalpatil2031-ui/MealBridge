const donorPatterns = [
  { donorId: 'U-D01', foodName: 'Cooked Meals', base: 118, swing: 81 },
  { donorId: 'U-D02', foodName: 'Rice & Dal', base: 126, swing: 76 },
  { donorId: 'U-D03', foodName: 'Baked Goods', base: 93, swing: 58 },
]

function buildDemoHistory() {
  const history = []
  const today = new Date()

  for (let daysAgo = 1; daysAgo <= 60; daysAgo += 1) {
    const sampleDate = new Date(today)
    sampleDate.setDate(today.getDate() - daysAgo)
    const weekday = (sampleDate.getDay() + 6) % 7

    donorPatterns.forEach(({ donorId, foodName, base, swing }) => {
      const weekdayFactor = weekday === 4 || weekday === 5 ? 1.12 : weekday === 0 ? 0.92 : 1
      const donorNumber = Number(donorId.slice(-1))
      const variation = ((daysAgo * 17 + donorNumber * 13) % swing) - Math.floor(swing / 2)
      const surplusMeals = Math.max(10, Math.round((base + variation) * weekdayFactor))

      history.push({
        donorId,
        foodName,
        date: sampleDate,
        weekday,
        surplusMeals,
      })
    })
  }

  return history
}

const surplusHistory = buildDemoHistory()

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

/** Estimate surplus from the donor's historical weekday pattern in the demo dataset. */
export function predictSurplus(donorId, foodName, date = new Date()) {
  const weekday = (date.getDay() + 6) % 7
  const donorHistory = surplusHistory.filter(record => record.donorId === donorId)
  const foodHistory = donorHistory.filter(record => record.foodName === foodName)
  const matchingFoodWeekday = foodHistory.filter(record => record.weekday === weekday)
  const matchingDonorWeekday = donorHistory.filter(record => record.weekday === weekday)
  const samples = matchingFoodWeekday.length >= 3
    ? matchingFoodWeekday
    : matchingDonorWeekday

  if (!samples.length) {
    return { estimate: 0, confidence: 'Low', sampleCount: 0, trend: [] }
  }

  const values = samples.map(record => record.surplusMeals)
  const trend = samples
    .slice()
    .sort((a, b) => a.date - b.date)
    .slice(-7)
    .map(record => record.surplusMeals)

  return {
    estimate: median(values),
    confidence: samples.length >= 6 ? 'High' : samples.length >= 3 ? 'Medium' : 'Low',
    sampleCount: samples.length,
    trend,
  }
}
