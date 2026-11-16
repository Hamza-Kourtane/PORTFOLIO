/**
 * Every clickable zone of the room lives here.
 *
 * camera  – where the camera flies to (position) and what it looks at (target)
 * hitbox  – invisible box that captures clicks/hover in the overview
 * marker  – where the floating "01 Projects" pin sits in 3D
 * objects – (next step) the interactive objects inside the zone, each one
 *           opening a portfolio panel. Kept empty for now on purpose.
 */

// Overview camera — reproduces the framing of the reference image.
export const HOME_VIEW = {
  position: [0, 2.25, 7.5],
  target: [0.2, 2.0, -4.5],
  range: 0, // locked: the overview stays fixed on this framing
}

// Starting point of the intro dolly-in.
export const INTRO_VIEW = {
  position: [0.6, 3.1, 12.5],
  target: [0.2, 2.2, -4.5],
}

export const AREAS = [
  {
    id: 'projects',
    index: '01',
    label: 'Projects',
    caption: 'The robot at work on the laptop',
    hint: 'Opening the laptop…',
    // flies right up to the laptop screen (screen centre ≈ [1.066, 1.415, -2.005], facing the robot)
    camera: { position: [0.81, 1.535, -2.256], target: [1.066, 1.415, -2.005], range: 0 },
    hitbox: { position: [0.95, 1.0, -1.6], size: [4.3, 2.1, 1.9] },
    marker: [0.85, 1.95, -2.1],
    // clickable objects live in the scene (<Interactive> / feature books)
  },
  {
    id: 'experience',
    index: '02',
    label: 'Experience',
    caption: 'The arched bookshelf',
    hint: 'Hover the three tall books on the top shelf — click one to open it.',
    camera: { position: [3.7, 3.1, 1.3], target: [3.75, 3.05, -4.5], range: 0 },
    hitbox: { position: [3.75, 3.0, -4.2], size: [2.5, 3.2, 0.7] },
    marker: [3.9, 4.05, -4.0],
    // clickable objects live in the scene (<Interactive> / feature books)
  },
]

export const AREAS_BY_ID = Object.fromEntries(AREAS.map((a) => [a.id, a]))
