// All positions use the same actual stool: no camera in the gap between seats.
export const GUEST_SEAT = { x: .9, z: 2.95, cushionY: .84, eyeY: 2.9 };
export const SEATING_MS = 2200;
export const THINKING_MS = 2000;
export const SERVING_MS = 1200;
export type ChefMode = 'idle' | 'think' | 'serve' | 'watch' | 'routine';
