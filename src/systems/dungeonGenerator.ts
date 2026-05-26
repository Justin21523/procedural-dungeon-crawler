import type { DungeonFloor, DungeonRoom, Corridor } from '../types/dungeon';
import type { EnemyInstance } from '../types/enemy';
import { createRNG, hashSeed } from '../utils/random';

/**
 * Generates a dungeon floor using random room placement and MST connections.
 */
export function generateDungeon(floorNumber: number, seed: string): DungeonFloor {
  const rng = createRNG(hashSeed(seed + floorNumber));
  const rooms: DungeonRoom[] = [];
  const roomCount = 5 + Math.floor(rng() * 3); // 5–7 rooms
  const mapWidth = 60;
  const mapDepth = 60;
  const minRoomSize = 4;
  const maxRoomSize = 8;
  const roomHeight = 3;
  const margin = 2; // minimum gap between rooms

  // 1. Place rooms without overlapping
  for (let i = 0; i < roomCount; i++) {
    let placed = false;
    let attempts = 0;
    while (attempts < 200 && !placed) {
      const w = minRoomSize + Math.floor(rng() * (maxRoomSize - minRoomSize + 1));
      const d = minRoomSize + Math.floor(rng() * (maxRoomSize - minRoomSize + 1));
      const x = rng() * (mapWidth - w - margin * 2) - mapWidth / 2 + w / 2 + margin;
      const z = rng() * (mapDepth - d - margin * 2) - mapDepth / 2 + d / 2 + margin;
      const overlap = rooms.some((r) => {
        return (
          Math.abs(r.position.x - x) < r.size.width / 2 + w / 2 + margin &&
          Math.abs(r.position.z - z) < r.size.depth / 2 + d / 2 + margin
        );
      });
      if (!overlap) {
        rooms.push({
          id: `room_${i}`,
          type: i === 0 ? 'start' : i === roomCount - 1 ? 'exit' : 'normal',
          position: { x, z },
          size: { width: w, depth: d, height: roomHeight },
          connections: [],
        });
        placed = true;
      }
      attempts++;
    }
    if (!placed) {
      // Fallback: force a small room at the edge
      rooms.push({
        id: `room_${i}`,
        type: i === 0 ? 'start' : i === roomCount - 1 ? 'exit' : 'normal',
        position: { x: -mapWidth / 2 + 4, z: -mapDepth / 2 + 4 + i * 8 },
        size: { width: 4, depth: 4, height: roomHeight },
        connections: [],
      });
    }
  }

  // 2. Build Minimum Spanning Tree (MST) to connect all rooms
  const visited: boolean[] = new Array(rooms.length).fill(false);
  visited[0] = true;
  const unvisited = Array.from({ length: rooms.length - 1 }, (_, i) => i + 1);

  while (unvisited.length > 0) {
    let bestDist = Infinity;
    let bestFrom = -1;
    let bestToIndex = -1;
    for (let vi = 0; vi < visited.length; vi++) {
      if (!visited[vi]) continue;
      for (let ui = 0; ui < unvisited.length; ui++) {
        const u = unvisited[ui];
        const dist = distance(rooms[vi].position, rooms[u].position);
        if (dist < bestDist) {
          bestDist = dist;
          bestFrom = vi;
          bestToIndex = ui;
        }
      }
    }
    if (bestFrom !== -1) {
      const toIdx = unvisited[bestToIndex];
      const fromRoom = rooms[bestFrom];
      const toRoom = rooms[toIdx];
      const dir = getDirection(fromRoom.position, toRoom.position);
      fromRoom.connections.push({ direction: dir, targetRoomId: toRoom.id });
      toRoom.connections.push({ direction: oppositeDirection(dir), targetRoomId: fromRoom.id });
      visited[toIdx] = true;
      unvisited.splice(bestToIndex, 1);
    }
  }

  // 3. Generate corridor geometry (L-shaped paths)
  const corridors: Corridor[] = [];
  const addedCorridors = new Set<string>();
  for (const room of rooms) {
    for (const conn of room.connections) {
      const pairKey = [room.id, conn.targetRoomId].sort().join('-');
      if (addedCorridors.has(pairKey)) continue;
      addedCorridors.add(pairKey);
      const targetRoom = rooms.find((r) => r.id === conn.targetRoomId);
      if (!targetRoom) continue;
      const points = generateLShapedPath(room.position, targetRoom.position, rng);
      corridors.push({ points, width: 1.5 });
    }
  }
  // 4. Place enemies in rooms (except start room)
  for (const room of rooms) {
    if (room.type === 'start') continue;
    const enemyCount = room.type === 'exit' ? 1 : Math.floor(rng() * 2) + 1;
    room.enemies = [];
    for (let j = 0; j < enemyCount; j++) {
      const templateType = rng() > 0.5 ? 'melee_grunt' : 'ranger_orb';
      const hp = templateType === 'melee_grunt' ? 30 : 20;
      room.enemies.push({
        instanceId: `${room.id}_enemy_${j}`,
        templateType,
        hp,
        maxHp: hp,
        state: 'idle',
        position: [
          room.position.x + (rng() - 0.5) * (room.size.width - 2),
          1,
          room.position.z + (rng() - 0.5) * (room.size.depth - 2),
        ],
        rotation: 0,
        lastAttackTime: 0,
        spawnRoomId: room.id,
      });
    }
  }
  return {
    floorNumber,
    seed,
    rooms,
    corridors,
    startRoomId: rooms[0].id,
    exitRoomId: rooms[rooms.length - 1].id,
  };
}

// ─── helpers ────────────────────────────────────────────

function distance(a: { x: number; z: number }, b: { x: number; z: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.z - b.z) ** 2);
}

type Direction = 'north' | 'south' | 'east' | 'west';

function getDirection(from: { x: number; z: number }, to: { x: number; z: number }): Direction {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (Math.abs(dx) > Math.abs(dz)) {
    return dx > 0 ? 'east' : 'west';
  } else {
    return dz > 0 ? 'north' : 'south'; // z positive = north in 3D
  }
}

function oppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'north': return 'south';
    case 'south': return 'north';
    case 'east': return 'west';
    case 'west': return 'east';
  }
}

function generateLShapedPath(
  from: { x: number; z: number },
  to: { x: number; z: number },
  rng: () => number
): { x: number; z: number }[] {
  const points: { x: number; z: number }[] = [from];
  if (rng() > 0.5) {
    points.push({ x: from.x, z: to.z });
  } else {
    points.push({ x: to.x, z: from.z });
  }
  points.push(to);
  return points;
}