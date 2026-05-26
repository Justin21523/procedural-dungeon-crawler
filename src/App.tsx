import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import { Player } from './scenes/Player'
import { DungeonScene } from './scenes/DungeonScene'
import { useDungeonStore } from './stores/dungeonStore'
import { usePlayerStore } from './stores/playerStore'
import { generateDungeon } from './systems/dungeonGenerator'
import { useThirdPersonCamera } from './hooks/useThirdPersonCamera'
import { useCombat } from './hooks/useCombat'
import { GameOverOverlay } from './hooks/useGameOver'
import { Vector3 } from 'three'
import type { RapierRigidBody } from '@react-three/rapier'
import type { EnemyInstance } from './types/enemy'

function CameraController({
  playerRigidBodyRef,
  yawRef,
  pitchRef,
}: {
  playerRigidBodyRef: React.MutableRefObject<RapierRigidBody | null>
  yawRef: React.MutableRefObject<number>
  pitchRef: React.MutableRefObject<number>
}) {
  const targetPosRef = useRef(new Vector3())
  useThirdPersonCamera(targetPosRef, yawRef, pitchRef)

  // Update target position from the player rigid body
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRigidBodyRef.current) {
        const t = playerRigidBodyRef.current.translation()
        targetPosRef.current.set(t.x, t.y, t.z)
      }
    }, 16)
    return () => clearInterval(interval)
  }, [playerRigidBodyRef])

  return null
}

export default function App() {
  const playerRigidBodyRef = useRef<RapierRigidBody | null>(null)
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const setDungeon = useDungeonStore((s) => s.setCurrentFloor)
  const currentFloor = usePlayerStore((s) => s.currentFloor)
  const hp = usePlayerStore((s) => s.hp)
  const maxHp = usePlayerStore((s) => s.maxHp)
  const isPointerLocked = usePlayerStore((s) => s.isPointerLocked)
  const takeDamage = usePlayerStore((s) => s.takeDamage)
  const enemiesRef = useRef<Map<string, EnemyInstance>>(new Map())

  useCombat(playerRigidBodyRef, yawRef, enemiesRef)

  // Generate first dungeon on mount
  useEffect(() => {
    const dungeon = generateDungeon(1, 'dungeon-seed')
    setDungeon(dungeon)
    const startRoom = dungeon.rooms.find((r) => r.id === dungeon.startRoomId)
    if (startRoom) {
      usePlayerStore.getState().setPlayerPosition([startRoom.position.x, 1, startRoom.position.z])
      // Rigid body will be set later; position will be updated on first frame via store or direct
      setTimeout(() => {
        if (playerRigidBodyRef.current) {
          playerRigidBodyRef.current.setTranslation(
            { x: startRoom.position.x, y: 1, z: startRoom.position.z },
            true
          )
        }
      }, 100)
    }
  }, [setDungeon])


  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50, near: 0.1, far: 200 }}
        style={{ background: '#1a1a2e' }}
        onPointerDown={(e) => {
          e.target.requestPointerLock?.()
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 15, 5]} intensity={0.8} castShadow />
          <Player
            playerRigidBodyRef={playerRigidBodyRef}
            yawRef={yawRef}
            pitchRef={pitchRef}
          />
          <DungeonScene
            playerRigidBodyRef={playerRigidBodyRef}
            enemiesRef={enemiesRef}
            onPlayerHit={(damage) => takeDamage(damage)}
          />
          <CameraController
            playerRigidBodyRef={playerRigidBodyRef}
            yawRef={yawRef}
            pitchRef={pitchRef}
          />
        </Suspense>
      </Canvas>

      {/* HUD */}
      <div className="absolute top-4 left-4 text-white pointer-events-none select-none">
        <h1 className="text-2xl font-bold text-blue-300">Dungeon Crawler</h1>
        <p className="text-sm text-gray-300">Floor {currentFloor}</p>
        <div className="mt-2">
          <div className="w-48 h-4 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-200"
              style={{ width: `${(hp / maxHp) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">HP: {hp}/{maxHp}</p>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {isPointerLocked ? 'Mouse locked (ESC to release)' : 'Click to lock mouse'}
        </p>
      </div>

      {/* Game Over overlay */}
      <GameOverOverlay />
    </div>
  )

}