import { useEffect, useState } from 'react'

/** Whether a finger is among the pointers (read once the page is loaded, so server and client agree). A
 * touch laptop with a mouse counts too: it has no other way to add a country than Shift/Cmd/Ctrl. */
export const useCoarsePointer = () => {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    setCoarse(window.matchMedia?.('(any-pointer: coarse)').matches ?? false)
  }, [])
  return coarse
}
