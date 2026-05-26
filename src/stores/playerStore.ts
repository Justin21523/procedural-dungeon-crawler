import { create } from 'zustand';

interface PlayerState {
  currentFloor: number;
  playerPosition: [number, number, number];
  isPointerLocked: boolean;
  hp: number;
  maxHp: number;
  gameOver: boolean;
  setCurrentFloor: (floor: number) => void;
  setPlayerPosition: (pos: [number, number, number]) => void;
  setPointerLocked: (locked: boolean) => void;
  takeDamage: (amount: number) => void;
  resetPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentFloor: 1,
  playerPosition: [0, 1, 0],
  isPointerLocked: false,
  hp: 100,
  maxHp: 100,
  gameOver: false,
  setCurrentFloor: (floor) => set({ currentFloor: floor }),
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPointerLocked: (locked) => set({ isPointerLocked: locked }),
  takeDamage: (amount) =>
    set((state) => {
      const newHp = Math.max(0, state.hp - amount);
      return { hp: newHp, gameOver: newHp <= 0 };
    }),
  resetPlayer: () =>
    set({
      hp: 100,
      maxHp: 100,
      gameOver: false,
      currentFloor: 1,
      playerPosition: [0, 1, 0],
    }),
}));