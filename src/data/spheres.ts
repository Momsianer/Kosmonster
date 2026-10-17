/** Fangsphärentypen, Werte in balancing.ts unter spheres, Namen in de.ts unter shop.sphere.<id> */
export const SPHERE_TYPES = ['standard', 'orbit', 'nebel', 'singularitaet'] as const;
export type SphereType = (typeof SPHERE_TYPES)[number];

export function isSphereType(value: unknown): value is SphereType {
  return typeof value === 'string' && (SPHERE_TYPES as readonly string[]).includes(value);
}
