import * as THREE from 'three'

/*
 * Shell-texture fur. The same mesh is drawn N times, each shell pushed a little
 * further out along the normals; each shell keeps only the strands that are
 * still "tall enough" at that height, and strands taper toward the tips.
 * Colour comes from the geometry's vertex colours (the coat pattern).
 */

const cache = new Map()

/**
 * @param layer    0 = skin (base shell), 1 = tips
 * @param length   fur length in world units
 * @param density  strands per UV unit [u, v]
 * @param gravity  how much the tips droop
 */
export function furMaterial({ layer, length = 0.012, density = [420, 170], gravity = 0.35 }) {
  const key = [layer.toFixed(3), length, density.join('x'), gravity].join('|')
  if (cache.has(key)) return cache.get(key)

  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })
  m.onBeforeCompile = (s) => {
    s.uniforms.uLayer = { value: layer }
    s.uniforms.uLen = { value: length }
    s.uniforms.uDensity = { value: new THREE.Vector2(...density) }
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uLayer;\nuniform float uLen;\nvarying vec2 vFurUv;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed += objectNormal * uLayer * uLen;
        transformed.y -= uLayer * uLayer * uLen * ${gravity.toFixed(3)};
        vFurUv = uv;`,
      )
    s.fragmentShader = s.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uLayer;
        uniform vec2 uDensity;
        varying vec2 vFurUv;
        float furHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        if (uLayer > 0.0) {
          vec2 cell = vFurUv * uDensity;
          vec2 f = fract(cell) - 0.5;
          float h = furHash(floor(cell));
          if (h < uLayer * 0.92 || length(f) > 0.55 * (1.0 - uLayer) + 0.1) discard;
        }
        // self-shadowing: darker near the skin, light catches the tips
        diffuseColor.rgb *= mix(0.5, 1.08, uLayer);`,
      )
  }
  m.customProgramCacheKey = () => 'fur-' + gravity.toFixed(3)
  cache.set(key, m)
  return m
}
