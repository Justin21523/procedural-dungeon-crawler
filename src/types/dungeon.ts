export interface DungeonRoom {
  id: string;
  type: 'start' | 'normal' | 'exit';
  position: { x: number; z: number }; // center in 2D plane
  size: { width: number; depth: number; height: number };
  connections: { direction: 'north' | 'south' | 'east' | 'west'; targetRoomId: string }[];
}

export interface Corridor {
  points: { x: number; z: number }[]; // waypoints (at least 2)
  width: number;
}

export interface DungeonFloor {
  floorNumber: number;
  seed: string;
  rooms: DungeonRoom[];
  corridors: Corridor[];
  startRoomId: string;
  exitRoomId: string;
}