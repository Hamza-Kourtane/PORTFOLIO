import { create } from 'zustand'

/**
 * Global UI/scene state.
 * - entered:     visitor passed the intro screen
 * - activeArea:  id of the zone the camera is focused on (null = overview)
 * - hoveredArea: zone under the pointer in the overview
 * - activeObject: (next step) object selected inside a zone → opens its panel
 */
// `?enter` in the URL skips the intro screen (handy while developing).
// `?area=projects` opens straight on an area (deep link).
const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
const initialArea = params.get('area')
const skipIntro = params.has('enter') || !!initialArea

export const useRoomStore = create((set) => ({
  entered: skipIntro,
  activeArea: initialArea,
  hoveredArea: null,
  activeObject: null,
  objectFocus: null, // { position, target } — camera framing for the selected object

  enter: () => set({ entered: true }),
  focusArea: (id) => set({ activeArea: id, hoveredArea: null, activeObject: null, objectFocus: null }),
  backToRoom: () => set({ activeArea: null, activeObject: null, objectFocus: null }),
  setHovered: (id) => set({ hoveredArea: id }),
  openObject: (id, focus = null) => set({ activeObject: id, objectFocus: focus }),
  closeObject: () => set({ activeObject: null, objectFocus: null }),
}))
