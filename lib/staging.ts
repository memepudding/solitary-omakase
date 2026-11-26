// All positions use the same actual stool: no camera in the gap between seats.
export const GUEST_SEAT = { x: .9, z: 2.95, cushionY: .84, eyeY: 2.9 };
export const SEATING_MS = 2200;
export const THINKING_MS = 2000;
export const SERVING_MS = 1200;
export type ChefMode = 'idle' | 'think' | 'serve' | 'watch' | 'routine';

// The existing wooden board on the guest-facing counter is the cooking station.
export const COOK_STATION = {
  x: GUEST_SEAT.x, y: 2.105, z: .93,
  chefX: GUEST_SEAT.x + .23, chefY: 1.135, chefZ: .2,
};
