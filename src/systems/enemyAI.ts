import type { EnemyInstance } from '../types/enemy';
import { enemyTemplates } from '../data/enemyTemplates';

/**
 * Updates enemy state based on player position and delta time.
 * Mutates the enemy object directly (or returns a new one).
 * @param enemy - the enemy to update
 * @param playerPos - current player position [x, y, z]
 * @param delta - delta seconds
 * @param roomCenter - room center for patrol limits (optional)
 * @param roomSize - room size for patrol limits (optional)
 */
export function updateEnemyAI(
  enemy: EnemyInstance,
  playerPos: [number, number, number],
  delta: number,
  roomCenter?: [number, number, number],
  roomSize?: [number, number, number]
): { newPosition?: [number, number, number]; newRotation?: number; attackTriggered?: boolean; projectileSpawned?: { pos: [number, number, number]; dir: [number, number, number] } } {
  const template = enemyTemplates[enemy.templateType];
  if (!template || enemy.state === 'dead') return {};

  const dx = playerPos[0] - enemy.position[0];
  const dz = playerPos[2] - enemy.position[2];
  const distToPlayer = Math.sqrt(dx * dx + dz * dz);

  // Common: update lastAttackTime (handled via delta accumulation later)
  // We'll use a simple timer concept by checking cooldown in combat system

  if (template.behavior === 'patrol') {
    return updatePatrolAI(enemy, playerPos, distToPlayer, delta, roomCenter, roomSize);
  } else if (template.behavior === 'ranged_static') {
    return updateRangedAI(enemy, playerPos, distToPlayer, delta);
  }
  return {};
}

function updatePatrolAI(
  enemy: EnemyInstance,
  playerPos: [number, number, number],
  distToPlayer: number,
  delta: number,
  roomCenter?: [number, number, number],
  roomSize?: [number, number, number]
) {
  const template = enemyTemplates[enemy.templateType]!;
  const now = performance.now() / 1000; // not ideal, but works for demo; we can pass currentTime

  // State transitions
  if (distToPlayer < template.stats.attackRange) {
    enemy.state = 'attack';
  } else if (distToPlayer < template.stats.detectionRange) {
    enemy.state = 'chase';
  } else {
    enemy.state = 'patrol';
  }

  let newPosition: [number, number, number] | undefined;
  let newRotation = enemy.rotation;

  if (enemy.state === 'chase') {
    // Move towards player
    const angle = Math.atan2(dx, dz);
    const moveX = Math.sin(angle) * template.stats.speed * delta;
    const moveZ = Math.cos(angle) * template.stats.speed * delta;
    newPosition = [
      enemy.position[0] + moveX,
      enemy.position[1],
      enemy.position[2] + moveZ,
    ];
    newRotation = angle;
  } else if (enemy.state === 'patrol') {
    // Simple patrol: if no target, pick a random point within room; move towards it
    // For MVP, we'll just make the enemy rotate slowly or stand still
    // To keep it simple, they just idle.
    // Could implement a basic wander, but let's skip for now to avoid complexity.
  } else if (enemy.state === 'attack') {
    // Face player
    newRotation = Math.atan2(dx, dz);
    // Attack will be triggered by combat system based on cooldown
  }

  return { newPosition, newRotation, attackTriggered: enemy.state === 'attack' };
}

function updateRangedAI(
  enemy: EnemyInstance,
  playerPos: [number, number, number],
  distToPlayer: number,
  delta: number
) {
  const template = enemyTemplates[enemy.templateType]!;
  // Always face player if within detection range
  const angle = Math.atan2(playerPos[0] - enemy.position[0], playerPos[2] - enemy.position[2]);
  const newRotation = angle;

  let projectileSpawned;
  const now = performance.now() / 1000;
  if (
    distToPlayer < template.stats.attackRange &&
    now - enemy.lastAttackTime > template.stats.attackCooldown
  ) {
    enemy.lastAttackTime = now;
    const dir: [number, number, number] = [
      Math.sin(angle),
      0,
      Math.cos(angle),
    ];
    projectileSpawned = {
      pos: [enemy.position[0], enemy.position[1] + 0.5, enemy.position[2]],
      dir,
    };
  }

  return { newRotation, projectileSpawned };
}