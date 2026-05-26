import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Box } from '@react-three/drei';
import { usePlayerStore } from '../stores/playerStore';

interface ProjectileProps {
  id: string;
  startPos: [number, number, number];
  direction: [number, number, number];
  speed: number;
  lifetime: number; // seconds
  damage: number;
  onHit: (id: string, damage: number) => void;
  onExpire: (id: string) => void;
}

export function Projectile({ id, startPos, direction, speed, lifetime, damage, onHit, onExpire }: ProjectileProps) {
  const rigidBodyRef = useRef<any>(null);
  const ageRef = useRef(0);

  useFrame((_, delta) => {
    if (!rigidBodyRef.current) return;
    ageRef.current += delta;
    if (ageRef.current > lifetime) {
      onExpire(id);
      return;
    }

    const currentPos = rigidBodyRef.current.translation();
    const newX = currentPos.x + direction[0] * speed * delta;
    const newZ = currentPos.z + direction[2] * speed * delta;
    rigidBodyRef.current.setNextKinematicTranslation({ x: newX, y: currentPos.y, z: newZ });
  });

  // Collision with player is handled via sensor events on the RigidBody
  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders={false}
      position={startPos}
      sensor
      onIntersectionEnter={({ other }) => {
        // Check if other is player (we can use a userData tag, but for MVP just always trigger)
        onHit(id, damage);
      }}
    >
      <CuboidCollider args={[0.2, 0.2, 0.2]} />
      <Box args={[0.4, 0.4, 0.4]}>
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.8} />
      </Box>
    </RigidBody>
  );
}