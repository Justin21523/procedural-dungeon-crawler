import { useCallback, useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import type { RapierRigidBody } from '@react-three/rapier';
import type { EnemyInstance } from '../types/enemy';
import { damageEnemy } from '../systems/combatSystem';

const ATTACK_COOLDOWN = 0.5; // seconds
const ATTACK_RANGE = 2.0;
const ATTACK_ANGLE = Math.PI / 3; // 60 degree cone

export function useCombat(
  playerRigidBodyRef: React.MutableRefObject<RapierRigidBody | null>,
  yawRef: React.MutableRefObject<number>,
  enemiesRef: React.MutableRefObject<Map<string, EnemyInstance>>
) {
  const lastAttackTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        performAttack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const performAttack = useCallback(() => {
    const now = performance.now() / 1000;
    if (now - lastAttackTime.current < ATTACK_COOLDOWN) return;
    lastAttackTime.current = now;

    const playerBody = playerRigidBodyRef.current;
    if (!playerBody) return;
    const playerPos = playerBody.translation();
    const yaw = yawRef.current;
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);

    enemiesRef.current.forEach((enemy) => {
      if (enemy.state === 'dead') return;
      const dx = enemy.position[0] - playerPos.x;
      const dz = enemy.position[2] - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > ATTACK_RANGE) return;
      // Check angle: dot product with forward
      if (dist > 0) {
        const dot = (dx * forwardX + dz * forwardZ) / dist;
        const angle = Math.acos(dot);
        if (angle > ATTACK_ANGLE / 2) return;
      }
      damageEnemy(enemy, 15);
    });
  }, [playerRigidBodyRef, yawRef, enemiesRef]);

  return { performAttack };
}