import type { EnemyTemplate } from '../types/enemy';

export const enemyTemplates: Record<string, EnemyTemplate> = {
  melee_grunt: {
    type: 'melee_grunt',
    geometry: 'box',
    color: '#ef4444', // red
    scale: [0.8, 1.6, 0.8],
    stats: {
      hp: 30,
      damage: 10,
      speed: 2.5,
      attackRange: 1.8,
      attackCooldown: 1.2,
      detectionRange: 6,
    },
    behavior: 'patrol',
  },
  ranger_orb: {
    type: 'ranger_orb',
    geometry: 'sphere',
    color: '#a855f7', // purple
    scale: [0.8, 0.8, 0.8],
    stats: {
      hp: 20,
      damage: 8,
      speed: 0,          // doesn't move
      attackRange: 10,   // shoot range
      attackCooldown: 2.0,
      detectionRange: 10,
    },
    behavior: 'ranged_static',
  },
};