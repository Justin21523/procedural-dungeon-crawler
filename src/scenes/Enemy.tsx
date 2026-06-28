import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, BallCollider } from '@react-three/rapier';
import { Box, Sphere } from '@react-three/drei';
import type { EnemyInstance } from '../types/enemy';
import { enemyTemplates } from '../data/enemyTemplates';
import { updateEnemyAI } from '../systems/enemyAI';
import type { RapierRigidBody } from '@react-three/rapier';

interface EnemyProps {
  enemyData: EnemyInstance;
  playerRigidBodyRef: React.MutableRefObject<RapierRigidBody | null>;
  onDeath: (instanceId: string) => void;
  onProjectileSpawn: (pos: [number, number, number], dir: [number, number, number]) => void;
  onAttackPlayer: (damage: number) => void;
}

export function Enemy({ enemyData, playerRigidBodyRef, onDeath, onProjectileSpawn, onAttackPlayer }: EnemyProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const lastAttackTimeRef = useRef(0);

  useFrame((_, delta) => {
    if (enemyData.state === 'dead') return;

    const playerPos: [number, number, number] = playerRigidBodyRef.current
      ? [
          playerRigidBodyRef.current.translation().x,
          playerRigidBodyRef.current.translation().y,
          playerRigidBodyRef.current.translation().z,
        ]
      : [0, 0, 0];

    const result = updateEnemyAI(enemyData, playerPos, delta);

    if (result.newPosition && rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation(
        { x: result.newPosition[0], y: result.newPosition[1], z: result.newPosition[2] },
        true
      );
      enemyData.position = result.newPosition;
    }
    if (result.newRotation !== undefined) {
      enemyData.rotation = result.newRotation;
    }

    if (result.attackTriggered) {
      const now = performance.now() / 1000;
      const cooldown = enemyTemplates[enemyData.templateType]!.stats.attackCooldown;
      if (now - lastAttackTimeRef.current > cooldown) {
        lastAttackTimeRef.current = now;
        onAttackPlayer(enemyTemplates[enemyData.templateType]!.stats.damage);
      }
    }

    if (result.projectileSpawned) {
      onProjectileSpawn(result.projectileSpawned.pos, result.projectileSpawned.dir);
    }

    // Check if dead after AI update (e.g., from combat)
    if (enemyData.state === 'dead') {
      onDeath(enemyData.instanceId);
    }
  });

  if (enemyData.state === 'dead') return null;

  const template = enemyTemplates[enemyData.templateType];
  const Geometry = template.geometry === 'box' ? Box : Sphere;

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      colliders={false}
      position={enemyData.position}
      rotation={[0, enemyData.rotation, 0]}
    >
      {template.geometry === 'box' ? (
        <CuboidCollider args={template.scale.map((s) => s / 2) as [number, number, number]} />
      ) : (
        <BallCollider args={[template.scale[0] / 2]} />
      )}
      <Geometry args={template.scale} castShadow>
        <meshStandardMaterial color={template.color} />
      </Geometry>
    </RigidBody>
  );
}
