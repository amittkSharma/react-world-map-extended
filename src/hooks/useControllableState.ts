import { useCallback, useState } from 'react'

/**
 * State that is controlled when `value` is given and uncontrolled otherwise
 * (`defaultValue` is only the initial value). `onChange` fires in both cases.
 */
export const useControllableState = <T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
) => {
  const [inner, setInner] = useState<T>(defaultValue)
  const isControlled = value !== undefined

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInner(next)
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  return [isControlled ? value : inner, setValue] as const
}
