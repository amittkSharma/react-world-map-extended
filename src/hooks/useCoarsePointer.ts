import { useEffect, useState } from 'react'

/** Whether the main pointer is a finger (read once the page is loaded, so server and client agree). */
export const useCoarsePointer = () => {
  const [coarse, setCoarse] = useState(false)
  useEffect(() => {
    setCoarse(window.matchMedia?.('(pointer: coarse)').matches ?? false)
  }, [])
  return coarse
}
