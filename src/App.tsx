import { Canvas } from '@react-three/fiber'
import { OrbitControls, Box, Capsule } from '@react-three/drei'
import { Suspense } from 'react'

// A simple floor component using a box geometry
function Floor() {
  return (
    <Box args={[10, 0.2, 10]} position={[0, -0.1, 0]}>
      <meshStandardMaterial color="#2d2d2d" />
    </Box>
  )
}

// The player representation
function Player() {
  return (
    <Capsule args={[0.5, 0.8, 4, 8]} position={[0, 1, 0]}>
      <meshStandardMaterial color="#3b82f6" />
    </Capsule>
  )
}

// Lighting setup
function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 3, -5]} intensity={0.3} />
    </>
  )
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 3D Scene */}
      <Canvas
        shadows
        camera={{ position: [8, 6, 8], fov: 50, near: 0.1, far: 100 }}
        style={{ background: '#1a1a2e' }}
      >
        <Suspense fallback={null}>
          <Lights />
          <Floor />
          <Player />
        </Suspense>
        {/* OrbitControls for debugging; will be replaced later */}
        <OrbitControls />
      </Canvas>

      {/* React UI overlay (Tailwind styled) */}
      <div className="absolute top-4 left-4 text-white pointer-events-none select-none">
        <h1 className="text-2xl font-bold text-blue-300">Dungeon Crawler MVP</h1>
        <p className="text-sm text-gray-300">Floor 1</p>
      </div>
    </div>
  )
}

export default App