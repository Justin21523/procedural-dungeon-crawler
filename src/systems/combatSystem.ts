import type { EnemyInstance } from '../types/enemy';
import { enemyTemplates } from '../data/enemyTemplates';

/**
 * Apply damage to an enemy. Returns true if enemy died.
 */
export function damageEnemy(enemy: EnemyInstance, amount: number): boolean {
  enemy.hp -= amount;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.state = 'dead';
    return true;
  }
  return false;
}

/**
 * Calculate damage from enemy to player (simplified).
 */
export function getEnemyDamage(enemy: EnemyInstance): number {
  const template = enemyTemplates[enemy.templateType];
  return template?.stats.damage ?? 5;
}