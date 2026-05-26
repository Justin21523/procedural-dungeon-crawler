export interface EnemyTemplate {
  type: string;                  // identifier, e.g., 'melee_grunt', 'ranger_orb'
  geometry: 'box' | 'sphere';   // basic geometry type
  color: string;
  scale: [number, number, number];
  stats: {
    hp: number;
    damage: number;
    speed: number;              // movement speed (for patrol/chase)
    attackRange: number;        // trigger distance for attack
    attackCooldown: number;     // seconds between attacks
    detectionRange: number;     // distance to notice player
  };
  behavior: 'patrol' | 'ranged_static'; // simple AI types
}

export interface EnemyInstance {
  instanceId: string;
  templateType: string;
  hp: number;
  maxHp: number;
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'dead';
  position: [number, number, number];
  rotation: number;             // Y rotation in radians
  targetPosition?: [number, number, number]; // patrol destination
  lastAttackTime: number;       // timestamp in seconds
  spawnRoomId: string;
}