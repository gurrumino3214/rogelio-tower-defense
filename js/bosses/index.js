/**
 * Boss System - Sistema completo de bosses para Tower Defense
 *
 * @module bosses
 * @version 1.0.0
 */

export { Boss } from './Boss.js';
export { BossManager, getBossManager } from './BossManager.js';
export { BossStateMachine, BossState, PhaseState, State } from './BossStateMachine.js';
export { BossAbilitySystem, BossAbility, EffectTypes, EffectExecutors } from './BossAbilitySystem.js';
export { 
    executeSummon, 
    executeRoar, 
    executeProjectile, 
    executeSlam, 
    executeExplosion, 
    executeCurse, 
    executeInvulnerability,
    executeAreaDamage,
    executeCharge,
    executeGroundEffect
} from './BossAbilityEffects.js';
export { CursedPencilConfig, BossTemplate, BossRegistry } from './BossTypes.js';
