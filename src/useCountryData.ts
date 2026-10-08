import { useEffect, useMemo, useRef } from 'react'
import { type CountryDataIssue, type ValidatedCountryData, validateCountryData } from './countryData'

// Identifies the data by what is in it, so that an array written inline in a component (a new array
// on every render) is still checked and reported only once. JSON drops `undefined`, which the
// validator treats as "not there" anyway. Data that cannot be turned into JSON is told apart by
// reference instead.
const signatureOf = (data: unknown): string | undefined => {
  try {
    return JSON.stringify(data)
  } catch {
    return undefined
  }
}

/**
 * Validates `countryData` whenever its content changes and reports what was wrong: to `onIssues`
 * when given, otherwise as a console warning.
 */
export const useCountryData = (
  countryData: unknown,
  onIssues?: (issues: CountryDataIssue[]) => void,
): ValidatedCountryData | undefined => {
  const signature = signatureOf(countryData)
  const latest = useRef(countryData)
  latest.current = countryData

  // biome-ignore lint/correctness/useExhaustiveDependencies: the signature stands for the content of the data; for data without one, the reference does
  const validated = useMemo(
    () => (latest.current === undefined ? undefined : validateCountryData(latest.current)),
    [signature ?? countryData],
  )
  const report = useRef(onIssues)
  report.current = onIssues // a new callback must not report the same problems again

  useEffect(() => {
    if (!validated || validated.issues.length === 0) return
    if (report.current) {
      report.current(validated.issues)
      return
    }
    const lines = validated.issues.map(
      ({ row, property, message }) =>
        `  ${row === null ? 'data' : `row ${row}`}${property ? ` (${property})` : ''}: ${message}`,
    )
    console.warn(
      `react-world-map-extended: ${validated.issues.length} problem(s) in countryData (pass onDataIssues to handle them yourself):\n${lines.join('\n')}`,
    )
  }, [validated])

  return validated
}
