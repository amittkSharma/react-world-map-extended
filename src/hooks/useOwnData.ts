import type { DetailsSource } from '../lib/cardSelections'
import type { CountryData, CountryDataIssue, ValidatedProperty } from '../lib/countryData'
import { useControllableState } from './useControllableState'
import { useCountryData } from './useCountryData'

const NO_PROPERTIES: ValidatedProperty[] = []

interface OwnDataOptions {
  countryData: CountryData | undefined
  detailsSource: DetailsSource | undefined
  dataProperty: string | undefined
  defaultDataProperty: string | undefined
  onDataPropertyChange: ((name: string) => void) | undefined
  onDataIssues: ((issues: CountryDataIssue[]) => void) | undefined
}

/**
 * Your own data as the map uses it: the valid rows, which facts the details show (`source`), the
 * properties you can colour the map by and the one that does it now. Data without a usable property
 * is ignored (and reported), and the built-in facts stay.
 */
export const useOwnData = ({
  countryData,
  detailsSource,
  dataProperty,
  defaultDataProperty,
  onDataPropertyChange,
  onDataIssues,
}: OwnDataOptions) => {
  const validated = useCountryData(countryData, onDataIssues)
  const usable = validated && validated.properties.length > 0 ? validated : undefined
  const source: DetailsSource = usable ? (detailsSource ?? 'custom') : 'default'
  const properties = usable && source !== 'default' ? usable.properties : NO_PROPERTIES

  const [chosen, setChosen] = useControllableState<string | undefined>(
    dataProperty,
    defaultDataProperty,
    (name) => name !== undefined && onDataPropertyChange?.(name),
  )
  // the chosen property, or the first when none or an unknown one is chosen
  const property = properties.find(({ name }) => name === chosen) ?? properties[0]

  /** The number of the colouring property for a country; none without a value. */
  const numberFor = (code: string) => {
    const value = property ? usable?.rows.get(code)?.[property.name] : undefined
    return typeof value === 'number' ? value : undefined
  }

  return {
    rows: usable?.rows,
    source,
    properties,
    property,
    chooseProperty: setChosen,
    numberFor,
  }
}
