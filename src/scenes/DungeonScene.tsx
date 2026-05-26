import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useDungeonStore } from '../stores/dungeonStore';
import { usePlayerStore } from '../stores/playerStore';
import { Box } from '@react-three/drei';
import type { DungeonFloor, DungeonRoom, Corridor } from '../types/dungeon';
import type { EnemyInstance } from '../types/enemy';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';

const WALL_THICKNESS = 0.2;
const WALL_HEIGHT = 3;
const FLOOR_THICKNESS = 0.2;

interface DungeonSceneProps {
  playerRigidBodyRef: React.MutableRefObject<RapierRigidBody | null>;
  enemiesRef: React.MutableRefObject<Map<string, EnemyInstance>>;
  onPlayerHit: (damage: number) => void;
}

interface ProjectileData {
  id: string;
  startPos: [number, number, number];
  direction: [number, number, number];
  speed: number;
  lifetime: number;
  damage: number;
}

export function DungeonScene({ playerRigidBodyRef }: DungeonSceneProps) {
  const currentFloor = useDungeonStore((s) => s.currentFloor);
  const currentFloorNum = usePlayerStore((s) => s.currentFloor);
  const setCurrentFloor = usePlayerStore((s) => s.setCurrentFloor);
  const setDungeon = useDungeonStore((s) => s.setCurrentFloor);
  const [projectiles, setProjectiles] = useState<ProjectileData[]>([]);
  const projectileIdCounter = useRef(0);
  

  // Cleanup enemies map when floor changes
  useEffect(() => {
    enemiesRef.current.clear();
  }, [currentFloorNum, enemiesRef]);

  const handleExit = useCallback(() => {
    const nextFloor = currentFloorNum + 1;
    setCurrentFloor(nextFloor);
    import('../systems/dungeonGenerator').then(({ generateDungeon }) => {
      const newFloor = generateDungeon(nextFloor, 'dungeon-seed');
      setDungeon(newFloor);
      const startRoom = newFloor.rooms.find((r) => r.id === newFloor.startRoomId);
      if (startRoom && playerRigidBodyRef.current) {
        const { x, z } = startRoom.position;
        playerRigidBodyRef.current.setTranslation({ x, y: 1, z }, true);
        usePlayerStore.getState().setPlayerPosition([x, 1, z]);
      }
    });
  }, [currentFloorNum, setCurrentFloor, setDungeon, playerRigidBodyRef]);

  const handleEnemyDeath = useCallback((instanceId: string) => {
    enemiesRef.current.delete(instanceId);
  }, [enemiesRef]);

  const handleProjectileSpawn = useCallback((pos: [number, number, number], dir: [number, number, number]) => {
    const id = `proj_${projectileIdCounter.current++}`;
    setProjectiles((prev) => [...prev, {
      id,
      startPos: pos,
      direction: dir,
      speed: 5,
      lifetime: 3,
      damage: 8,
    }]);
  }, []);

  const handleProjectileExpire = useCallback((id: string) => {
    setProjectiles((prev) => prev.filter(p => p.id !== id));
  }, []);

  const handleProjectileHit = useCallback((id: string, damage: number) => {
    onPlayerHit(damage);
    setProjectiles((prev) => prev.filter(p => p.id !== id));
  }, [onPlayerHit]);
  
  if (!currentFloor) return null;

  return (
    <group>
      {/* Rooms */}
      {currentFloor.rooms.map((room) => (
        <RoomGeometry key={room.id} room={room} />
      ))}

      {/* Corridors */}
      {currentFloor.corridors.map((corridor, i) => (
        <CorridorGeometry key={`corr-${i}`} corridor={corridor} />
      ))}

      {/* Exit trigger sensor */}
      <ExitTrigger
        exitRoom={currentFloor.rooms.find((r) => r.id === currentFloor.exitRoomId)}
        onEnter={handleExit}
      />
      {/* Enemies */}
      {currentFloor.rooms.map((room) =>
        room.enemies?.map((enemy) => {
          if (enemy.state === 'dead') return null;
          // Register in map
          enemiesRef.current.set(enemy.instanceId, enemy);
          return (
            <Enemy
              key={enemy.instanceId}
              enemyData={enemy}
              playerPos={usePlayerStore.getState().playerPosition}
              onDeath={handleEnemyDeath}
              onProjectileSpawn={handleProjectileSpawn}
              onAttackPlayer={onPlayerHit}
            />
          );
        })
      )}
      {/* Projectiles */}
      {projectiles.map((proj) => (
        <Projectile
          key={proj.id}
          id={proj.id}
          startPos={proj.startPos}
          direction={proj.direction}
          speed={proj.speed}
          lifetime={proj.lifetime}
          damage={proj.damage}
          onHit={handleProjectileHit}
          onExpire={handleProjectileExpire}
        />
      ))} 
    </group>
  );
}

// ─── Room Geometry & Physics ────────────────────────────

function RoomGeometry({ room }: { room: DungeonRoom }) {
  const { x, z } = room.position;
  const { width, depth, height } = room.size;
  const hw = width / 2;
  const hd = depth / 2;

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[hw, FLOOR_THICKNESS / 2, hd]} position={[x, -FLOOR_THICKNESS / 2, z]} />
        <Box args={[width, FLOOR_THICKNESS, depth]} position={[x, -FLOOR_THICKNESS / 2, z]}>
          <meshStandardMaterial color="#4a4a4a" />
        </Box>
      </RigidBody>

      {/* North wall (z positive) */}
      {!room.connections.some((c) => c.direction === 'north') && (
        <Wall position={[x, height / 2, z + hd]} size={[width, height, WALL_THICKNESS]} />
      )}
      {/* South wall */}
      {!room.connections.some((c) => c.direction === 'south') && (
        <Wall position={[x, height / 2, z - hd]} size={[width, height, WALL_THICKNESS]} />
      )}
      {/* East wall */}
      {!room.connections.some((c) => c.direction === 'east') && (
        <Wall position={[x + hw, height / 2, z]} size={[WALL_THICKNESS, height, depth]} />
      )}
      {/* West wall */}
      {!room.connections.some((c) => c.direction === 'west') && (
        <Wall position={[x - hw, height / 2, z]} size={[WALL_THICKNESS, height, depth]} />
      )}
    </group>
  );
}

function Wall({
  position,
  size,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <RigidBody type="fixed" colliders={false} rotation={rotation}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} position={position} />
      <Box args={size} position={position}>
        <meshStandardMaterial color="#8b8b8b" />
      </Box>
    </RigidBody>
  );
}

// ─── Corridor Geometry & Physics ────────────────────────

function CorridorGeometry({ corridor }: { corridor: Corridor }) {
  const halfWidth = corridor.width / 2;
  const segments = [];
  for (let i = 0; i < corridor.points.length - 1; i++) {
    const a = corridor.points[i];
    const b = corridor.points[i + 1];
    segments.push({ a, b });
  }

  return (
    <group>
      {segments.map((seg, idx) => {
        const dx = seg.b.x - seg.a.x;
        const dz = seg.b.z - seg.a.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz); // rotation around Y
        const midX = (seg.a.x + seg.b.x) / 2;
        const midZ = (seg.a.z + seg.b.z) / 2;

        return (
          <group key={idx}>
            {/* Floor */}
            <RigidBody type="fixed" colliders={false}>
              <CuboidCollider
                args={[halfWidth, FLOOR_THICKNESS / 2, length / 2]}
                position={[midX, -FLOOR_THICKNESS / 2, midZ]}
                rotation={[0, angle, 0]}
              />
              <Box
                args={[corridor.width, FLOOR_THICKNESS, length]}
                position={[midX, -FLOOR_THICKNESS / 2, midZ]}
                rotation={[0, angle, 0]}
              >
                <meshStandardMaterial color="#3a3a3a" />
              </Box>
            </RigidBody>

            {/* Left wall */}
            <Wall
              position={[
                midX + Math.cos(angle) * halfWidth,
                WALL_HEIGHT / 2,
                midZ - Math.sin(angle) * halfWidth,
              ]}
              size={[WALL_THICKNESS, WALL_HEIGHT, length]}
              rotation={[0, angle, 0]}
            />
            {/* Right wall */}
            <Wall
              position={[
                midX - Math.cos(angle) * halfWidth,
                WALL_HEIGHT / 2,
                midZ + Math.sin(angle) * halfWidth,
              ]}
              size={[WALL_THICKNESS, WALL_HEIGHT, length]}
              rotation={[0, angle, 0]}
            />
          </group>
        );
      })}
    </group>
  );
}

// ─── Exit Trigger ───────────────────────────────────────

function ExitTrigger({
  exitRoom,
  onEnter,
}: {
  exitRoom: DungeonRoom | undefined;
  onEnter: () => void;
}) {
  if (!exitRoom) return null;

  return (
    <RigidBody
      type="fixed"
      sensor
      colliders={false}
      position={[exitRoom.position.x, 0.5, exitRoom.position.z]}
      onIntersectionEnter={({ other }) => {
        // Only trigger if it's the player (we can check rigidBody handle name or just trigger)
        onEnter();
      }}
    >
      <CuboidCollider args={[1, 0.5, 1]} />
      {/* Visual exit marker */}
      <Box args={[1.2, 1.2, 1.2]} position={[0, 0.6, 0]}>
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.3} />
      </Box>
    </RigidBody>
  );
}