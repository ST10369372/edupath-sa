const LIFE_ORIENTATION = 'Life Orientation'

export function markToAps(mark) {
  const value = Number(mark)
  if (!Number.isFinite(value) || value < 0 || value > 100) return 0
  if (value >= 80) return 7
  if (value >= 70) return 6
  if (value >= 60) return 5
  if (value >= 50) return 4
  if (value >= 40) return 3
  if (value >= 30) return 2
  return 1
}

export function calculateApsVariants(subjects) {
  const marked = subjects
    .filter(subject => subject.subject && subject.mark !== '' && Number.isFinite(Number(subject.mark)))
    .map(subject => ({
      subject: subject.subject,
      mark: Number(subject.mark),
      points: markToAps(subject.mark),
    }))

  const nonLifeOrientation = marked
    .filter(subject => subject.subject !== LIFE_ORIENTATION)
    .sort((a, b) => b.points - a.points)
  const bestSixWithoutLifeOrientation = nonLifeOrientation.slice(0, 6)
  const bestSixOverall = [...marked]
    .sort((a, b) => b.points - a.points)
    .slice(0, 6)
  const lifeOrientation = marked.find(subject => subject.subject === LIFE_ORIENTATION)
  const baseScore = bestSixWithoutLifeOrientation.reduce((sum, subject) => sum + subject.points, 0)
  const lifeOrientationHalf = lifeOrientation
    ? Math.min(2, Math.floor(lifeOrientation.points / 2))
    : 0

  return {
    subjects: marked,
    variants: [
      {
        key: 'best-six-no-lo',
        label: 'Best 6, excluding Life Orientation',
        score: baseScore,
        note: 'A commonly used comparison; confirm the institution’s rules.',
      },
      {
        key: 'best-six-with-lo',
        label: 'Best 6, including Life Orientation',
        score: bestSixOverall.reduce((sum, subject) => sum + subject.points, 0),
        note: 'Some institutions use different subject selections.',
      },
      {
        key: 'half-lo',
        label: 'Best 6 + half Life Orientation',
        score: baseScore + lifeOrientationHalf,
        note: 'Matches this app’s calculator convention; LO contribution is capped at 2.',
      },
    ],
    bestSixWithoutLifeOrientation,
    lifeOrientationHalf,
  }
}
