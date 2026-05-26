import { create } from 'zustand';
import { type DungeonFloor } from '../types/dungeon';

interface DungeonState {
  currentFloor: DungeonFloor | null;
  setCurrentFloor: (floor: DungeonFloor) => void;
}

export const useDungeonStore = create<DungeonState>((set) => ({
  currentFloor: null,
  setCurrentFloor: (floor) => set({ currentFloor: floor }),
}));