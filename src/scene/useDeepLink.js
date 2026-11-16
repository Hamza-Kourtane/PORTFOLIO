import { useEffect } from 'react'
import { useRoomStore } from '../store/useRoomStore'

const wanted = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('object') : null

/**
 * `?area=experience&object=exp-geo` opens straight on an object.
 * `open()` is the same handler a click would run (it needs the object's world position).
 */
export function useDeepLink(id, open) {
  useEffect(() => {
    if (wanted !== id) return
    const t = setTimeout(() => {
      if (!useRoomStore.getState().activeObject) open()
    }, 300)
    return () => clearTimeout(t)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
}
