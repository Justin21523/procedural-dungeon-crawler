import { CapsuleCollider, RigidBody } from '@react-three/rapier';
import { Capsule } from '@react-three/drei';
import { usePlayerController } from '../hooks/usePlayerController';
import type { RapierRigidBody } from '@react-three/rapier';

interface PlayerProps {
  playerRigidBodyRef: React.MutableRefObject<RapierRigidBody | null>;
  yawRef: React.MutableRefObject<number>;
  pitchRef: React.MutableRefObject<number>;
}

export function Player({ playerRigidBodyRef, yawRef, pitchRef }: PlayerProps) {
  const { onCanvasClick } = usePlayerController(playerRigidBodyRef, yawRef, pitchRef);

  return (
    <>
      <RigidBody
        ref={playerRigidBodyRef}
        type="kinematicPosition"
        colliders={false}
        position={[0, 1, 0]}
      >
        <CapsuleCollider args={[0.5, 0.8]} />
        <Capsule args={[0.5, 0.8, 4, 8]} castShadow>
          <meshStandardMaterial color="#3b82f6" />
        </Capsule>
      </RigidBody>
      <mesh onClick={onCanvasClick} visible={false} scale={[200, 200, 200]}>
        <boxGeometry />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}