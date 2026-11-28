// All positions use the same actual stool: no camera in the gap between seats.
export const GUEST_SEAT = { x: .9, z: 2.95, cushionY: .84, eyeY: 2.3 };
export const SEATING_MS = 2200;
export const THINKING_MS = 2000;
export const SERVING_MS = 1200;
export type ChefMode = 'idle' | 'think' | 'serve' | 'watch' | 'routine';

// The existing wooden board on the guest-facing counter is the cooking station.
export const COOK_STATION = {
  x: GUEST_SEAT.x, y: 1.29, z: .93,
  chefX: GUEST_SEAT.x, chefY: .32, chefZ: -.15,
};
