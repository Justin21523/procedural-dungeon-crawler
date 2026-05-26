import { create } from 'zustand';

interface PlayerState {
  currentFloor: number;
  playerPosition: [number, number, number]; // for UI if needed
  isPointerLocked: boolean;
  setCurrentFloor: (floor: number) => void;
  setPlayerPosition: (pos: [number, number, number]) => void;
  setPointerLocked: (locked: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentFloor: 1,
  playerPosition: [0, 0, 0],
  isPointerLocked: false,
  setCurrentFloor: (floor) => set({ currentFloor: floor }),
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPointerLocked: (locked) => set({ isPointerLocked: locked }),
}));