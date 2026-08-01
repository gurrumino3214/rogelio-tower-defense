/**
 * BossAbilityEffects.js - Sistema de efectos para habilidades del Boss
 * Maneja la ejecución visual y lógica de cada tipo de habilidad
 * 
 * Soporta:
 * - Invocar enemigos
 * - Rugidos (buffs/debuffs)
 * - Proyectiles
 * - Golpes (slam)
 * - Explosiones
 * - Maldiciones
 * - Invulnerabilidad temporal
 * 
 * @module bosses/BossAbilityEffects
 */

import { EventEmitter } from '../utils/EventEmitter.js';

/**
 * Tipos de efectos disponibles
 */
const EffectTypes = {
    SUMMON: 'summon',
    ROAR: 'roar',
    PROJECTILE: 'projectile',
    SLAM: 'slam',
    EXPLOSION: 'explosion',
    CURSE: 'curse',
    INVULNERABILITY: 'invulnerability',
    AREA_DAMAGE: 'area_damage',
    CHARGE: 'charge',
    GROUND_EFFECT: 'ground_effect',
    MEGA_AREA: 'mega_area',
    SPAWN_WAVE: 'spawn_wave'
};

/**
 * Ejecuta un efecto de invocación de enemigos
 */
function executeSummon(boss, effect, context) {
    const { enemyTypes, count, spawnRadius, positions } = effect;
    
    // Determinar número de enemigos
    const minCount = Array.isArray(count) ? count[0] : count;
    const maxCount = Array.isArray(count) ? count[1] : count;
    const actualCount = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
    
    const spawnedEnemies = [];
    
    for (let i = 0; i < actualCount; i++) {
        // Seleccionar tipo aleatorio
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        // Calcular posición
        let spawnX, spawnY;
        if (positions === 'around_boss') {
            const angle = (Math.PI * 2 / actualCount) * i + Math.random() * 0.5;
            const radius = spawnRadius * (0.8 + Math.random() * 0.4);
            spawnX = boss.x + Math.cos(angle) * radius;
            spawnY = boss.y + Math.sin(angle) * radius;
        } else if (positions === 'spread') {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * spawnRadius;
            spawnX = boss.x + Math.cos(angle) * radius;
            spawnY = boss.y + Math.sin(angle) * radius;
        } else {
            spawnX = boss.x;
            spawnY = boss.y;
        }
        
        spawnedEnemies.push({
            type: enemyType,
            x: spawnX,
            y: spawnY
        });
    }
    
    // Emitir evento para que el sistema externo spawnee los enemigos
    if (context?.onSpawn) {
        context.onSpawn(spawnedEnemies);
    }
    
    // Crear efecto visual
    createSummonVisuals(boss, spawnedEnemies);
    
    return spawnedEnemies;
}

/**
 * Ejecuta un efecto de rugido (buff para aliados, debuff para jugadores)
 */
function executeRoar(boss, effect, context) {
    const { 
        buffType = 'damage_boost',
        buffValue = 1.5,
        buffDuration = 5000,
        debuffType = 'fear',
        debuffValue = 0.7,
        debuffDuration = 3000,
        radius = 250
    } = effect;
    
    // Aplicar buff al boss (o aliados cercanos)
    const bossBuff = {
        type: buffType,
        value: buffValue,
        duration: buffDuration,
        remaining: buffDuration
    };
    
    // Buscar entidades en el radio
    const affectedEntities = [];
    if (context?.getEntitiesInRadius) {
        const entities = context.getEntitiesInRadius(boss.x, boss.y, radius);
        for (const entity of entities) {
            if (entity.isAlly) {
                entity.applyBuff(buffType, buffValue, buffDuration);
            } else {
                entity.applyDebuff(debuffType, debuffValue, debuffDuration);
            }
            affectedEntities.push(entity);
        }
    }
    
    // Efectos visuales y sonoros
    createRoarVisuals(boss, radius);
    playRoarSound(boss, context);
    
    return {
        bossBuff,
        affectedEntities
    };
}

/**
 * Ejecuta un efecto de proyectil
 */
function executeProjectile(boss, effect, context) {
    const {
        projectileType = 'basic',
        damage = 30,
        speed = 300,
        count = 1,
        spreadAngle = 30,
        targetMode = 'nearest',
        homing = false
    } = effect;
    
    const projectiles = [];
    
    // Determinar target
    let targetX, targetY;
    if (context?.getPlayerPosition) {
        const playerPos = context.getPlayerPosition();
        targetX = playerPos.x;
        targetY = playerPos.y;
    } else {
        targetX = boss.x + 400;
        targetY = boss.y;
    }
    
    // Calcular ángulo base
    const baseAngle = Math.atan2(targetY - boss.y, targetX - boss.x);
    
    for (let i = 0; i < count; i++) {
        let angle = baseAngle;
        
        // Añadir spread si hay múltiples proyectiles
        if (count > 1) {
            const spreadRad = (spreadAngle * Math.PI / 180);
            const offset = (i - (count - 1) / 2) * (spreadRad / count);
            angle += offset;
        }
        
        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        
        projectiles.push({
            type: projectileType,
            x: boss.x,
            y: boss.y,
            velocity,
            damage,
            homing,
            targetId: null
        });
    }
    
    // Emitir para creación de proyectiles
    if (context?.onSpawnProjectile) {
        for (const proj of projectiles) {
            context.onSpawnProjectile(proj);
        }
    }
    
    createProjectileVisuals(boss, projectiles);
    
    return projectiles;
}

/**
 * Ejecuta un efecto de golpe (slam)
 */
function executeSlam(boss, effect, context) {
    const {
        damage = 40,
        radius = 120,
        knockback = 50,
        stunDuration = 500,
        animation = 'slam_ground'
    } = effect;
    
    // Activar animación
    if (boss.playAnimation) {
        boss.playAnimation(animation);
    }
    
    // Buscar entidades afectadas
    const affectedEntities = [];
    if (context?.getEntitiesInRadius) {
        const entities = context.getEntitiesInRadius(boss.x, boss.y, radius);
        for (const entity of entities) {
            if (!entity.isAlly) {
                // Aplicar daño
                entity.takeDamage(damage);
                
                // Aplicar knockback
                const angle = Math.atan2(entity.y - boss.y, entity.x - boss.x);
                entity.applyKnockback(
                    Math.cos(angle) * knockback,
                    Math.sin(angle) * knockback
                );
                
                // Aplicar stun
                if (stunDuration > 0) {
                    entity.applyStun(stunDuration);
                }
                
                affectedEntities.push(entity);
            }
        }
    }
    
    // Efectos visuales
    createSlamVisuals(boss, radius);
    
    // Screen shake
    if (boss.triggerScreenShake) {
        boss.triggerScreenShake(10);
    }
    
    return { damage, affectedEntities };
}

/**
 * Ejecuta un efecto de explosión
 */
function executeExplosion(boss, effect, context) {
    const {
        damage = 60,
        radius = 200,
        damageOverTime = 0,
        dotDuration = 0,
        slowPercent = 0,
        slowDuration = 0,
        animation = 'ink_explosion',
        screenShake = 15
    } = effect;
    
    // Activar animación
    if (boss.playAnimation) {
        boss.playAnimation(animation);
    }
    
    // Buscar entidades afectadas
    const affectedEntities = [];
    if (context?.getEntitiesInRadius) {
        const entities = context.getEntitiesInRadius(boss.x, boss.y, radius);
        for (const entity of entities) {
            if (!entity.isAlly) {
                // Aplicar daño instantáneo
                entity.takeDamage(damage);
                
                // Aplicar DoT si corresponde
                if (damageOverTime > 0 && dotDuration > 0) {
                    entity.applyDamageOverTime(damageOverTime, dotDuration);
                }
                
                // Aplicar slow si corresponde
                if (slowPercent > 0 && slowDuration > 0) {
                    entity.applySlow(slowPercent, slowDuration);
                }
                
                affectedEntities.push(entity);
            }
        }
    }
    
    // Efectos visuales
    createExplosionVisuals(boss, radius, animation);
    
    // Screen shake
    if (boss.triggerScreenShake) {
        boss.triggerScreenShake(screenShake);
    }
    
    return { damage, affectedEntities };
}

/**
 * Ejecuta un efecto de maldición
 */
function executeCurse(boss, effect, context) {
    const {
        curseType = 'weakness',
        curseValue = 0.5,
        curseDuration = 10000,
        radius = 300,
        affectAll = false
    } = effect;
    
    const cursedEntities = [];
    
    if (context?.getEntitiesInRadius) {
        const entities = context.getEntitiesInRadius(boss.x, boss.y, radius);
        for (const entity of entities) {
            if (!entity.isAlly || affectAll) {
                // Aplicar maldición según tipo
                switch (curseType) {
                    case 'weakness':
                        entity.applyDebuff('damage_reduction', curseValue, curseDuration);
                        break;
                    case 'vulnerability':
                        entity.applyDebuff('defense_reduction', curseValue, curseDuration);
                        break;
                    case 'slowness':
                        entity.applyDebuff('speed_reduction', curseValue, curseDuration);
                        break;
                    case 'silence':
                        entity.applyDebuff('cannot_attack', true, curseDuration);
                        break;
                }
                
                cursedEntities.push(entity);
            }
        }
    }
    
    // Efectos visuales
    createCurseVisuals(boss, cursedEntities, curseType);
    
    return { curseType, cursedEntities };
}

/**
 * Ejecuta un efecto de invulnerabilidad temporal
 */
function executeInvulnerability(boss, effect, context) {
    const {
        duration = 3000,
        immunityType = 'all',
        visualEffect = 'shield',
        soundEffect = 'shield_activate'
    } = effect;
    
    // Activar invulnerabilidad
    boss.isInvulnerable = true;
    boss.immunityType = immunityType;
    
    // Programar fin de invulnerabilidad
    setTimeout(() => {
        boss.isInvulnerable = false;
        boss.immunityType = null;
        if (context?.onInvulnerabilityEnd) {
            context.onInvulnerabilityEnd(boss);
        }
    }, duration);
    
    // Efectos visuales
    createShieldVisuals(boss, visualEffect, duration);
    
    // Sonido
    if (boss.playSound) {
        boss.playSound(soundEffect);
    }
    
    return { duration, immunityType };
}

/**
 * Ejecuta un efecto de área (genérico)
 */
function executeAreaDamage(boss, effect, context) {
    const {
        damage = 50,
        radius = 150,
        knockback = 0,
        stunDuration = 0,
        animation = 'area_blast'
    } = effect;
    
    // Activar animación
    if (boss.playAnimation) {
        boss.playAnimation(animation);
    }
    
    const affectedEntities = [];
    if (context?.getEntitiesInRadius) {
        const entities = context.getEntitiesInRadius(boss.x, boss.y, radius);
        for (const entity of entities) {
            if (!entity.isAlly) {
                entity.takeDamage(damage);
                
                if (knockback > 0) {
                    const angle = Math.atan2(entity.y - boss.y, entity.x - boss.x);
                    entity.applyKnockback(
                        Math.cos(angle) * knockback,
                        Math.sin(angle) * knockback
                    );
                }
                
                if (stunDuration > 0) {
                    entity.applyStun(stunDuration);
                }
                
                affectedEntities.push(entity);
            }
        }
    }
    
    createAreaVisuals(boss, radius, animation);
    
    return { damage, affectedEntities };
}

/**
 * Ejecuta un efecto de carga (charge)
 */
function executeCharge(boss, effect, context) {
    const {
        damage = 50,
        distance = 300,
        speed = 400,
        knockback = 100,
        collisionDamage = true,
        animation = 'charge_forward'
    } = effect;
    
    // Determinar dirección
    let targetX, targetY;
    if (context?.getPlayerPosition) {
        const playerPos = context.getPlayerPosition();
        const angle = Math.atan2(playerPos.y - boss.y, playerPos.x - boss.x);
        targetX = boss.x + Math.cos(angle) * distance;
        targetY = boss.y + Math.sin(angle) * distance;
    } else {
        targetX = boss.x + distance;
        targetY = boss.y;
    }
    
    // Iniciar movimiento de carga
    const chargeData = {
        startX: boss.x,
        startY: boss.y,
        targetX,
        targetY,
        damage,
        knockback,
        collisionDamage,
        elapsed: 0
    };
    
    if (boss.playAnimation) {
        boss.playAnimation(animation);
    }
    
    return chargeData;
}

/**
 * Ejecuta un efecto en el suelo (zona persistente)
 */
function executeGroundEffect(boss, effect, context) {
    const {
        damage = 25,
        zones = 5,
        zoneRadius = 80,
        zoneDuration = 8000,
        damageTick = 500,
        animation = 'ink_puddles'
    } = effect;
    
    const groundZones = [];
    
    for (let i = 0; i < zones; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 200;
        
        groundZones.push({
            x: boss.x + Math.cos(angle) * distance,
            y: boss.y + Math.sin(angle) * distance,
            radius: zoneRadius,
            damage,
            damageTick,
            remaining: zoneDuration,
            animation
        });
    }
    
    // Notificar creación de zonas
    if (context?.onCreateGroundZone) {
        for (const zone of groundZones) {
            context.onCreateGroundZone(zone);
        }
    }
    
    createGroundEffectVisuals(boss, groundZones);
    
    return groundZones;
}

// ==========================================
// FUNCIONES DE EFECTOS VISUALES (PLACEHOLDERS)
// ==========================================

function createSummonVisuals(boss, enemies) {
    if (boss.addParticle) {
        for (const enemy of enemies) {
            for (let i = 0; i < 10; i++) {
                boss.addParticle({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 500,
                    color: '#8b00ff',
                    size: 3 + Math.random() * 3
                });
            }
        }
    }
}

function createRoarVisuals(boss, radius) {
    if (boss.addParticle) {
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            boss.addParticle({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * 150,
                vy: Math.sin(angle) * 150,
                life: 800,
                color: '#ff4400',
                size: 5
            });
        }
    }
}

function createProjectileVisuals(boss, projectiles) {
    // Los proyectiles tienen su propio sistema de renderizado
}

function createSlamVisuals(boss, radius) {
    if (boss.addParticle) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            boss.addParticle({
                x: boss.x + Math.cos(angle) * dist,
                y: boss.y + Math.sin(angle) * dist,
                vx: 0,
                vy: 0,
                life: 400,
                color: '#666666',
                size: 4 + Math.random() * 4
            });
        }
    }
}

function createExplosionVisuals(boss, radius, animation) {
    if (boss.addParticle) {
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            boss.addParticle({
                x: boss.x + Math.cos(angle) * dist,
                y: boss.y + Math.sin(angle) * dist,
                vx: Math.cos(angle) * (100 + Math.random() * 100),
                vy: Math.sin(angle) * (100 + Math.random() * 100),
                life: 600 + Math.random() * 400,
                color: animation === 'ink_explosion' ? '#2e004a' : '#ff6600',
                size: 3 + Math.random() * 5
            });
        }
    }
}

function createCurseVisuals(boss, entities, curseType) {
    if (boss.addParticle) {
        const colors = {
            weakness: '#8b0000',
            vulnerability: '#ff8c00',
            slowness: '#00008b',
            silence: '#4b0082'
        };
        
        for (const entity of entities) {
            for (let i = 0; i < 5; i++) {
                boss.addParticle({
                    x: entity.x || boss.x,
                    y: entity.y || boss.y,
                    vx: (Math.random() - 0.5) * 50,
                    vy: -50 - Math.random() * 50,
                    life: 1000,
                    color: colors[curseType] || '#8b0000',
                    size: 3
                });
            }
        }
    }
}

function createShieldVisuals(boss, visualEffect, duration) {
    if (boss.addParticle) {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            boss.addParticle({
                x: boss.x + Math.cos(angle) * 60,
                y: boss.y + Math.sin(angle) * 60,
                vx: 0,
                vy: 0,
                life: duration,
                color: visualEffect === 'shield' ? '#00ffff' : '#ffffff',
                size: 4
            });
        }
    }
}

function createAreaVisuals(boss, radius, animation) {
    createExplosionVisuals(boss, radius, animation);
}

function createGroundEffectVisuals(boss, zones) {
    if (boss.addParticle) {
        for (const zone of zones) {
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * zone.radius;
                boss.addParticle({
                    x: zone.x + Math.cos(angle) * dist,
                    y: zone.y + Math.sin(angle) * dist,
                    vx: 0,
                    vy: 0,
                    life: 2000,
                    color: '#1a0033',
                    size: 5 + Math.random() * 3
                });
            }
        }
    }
}

function playRoarSound(boss, context) {
    if (boss.playSound) {
        boss.playSound('roar');
    }
}

// ==========================================
// EXPORTS
// ==========================================

const EffectExecutors = {
    [EffectTypes.SUMMON]: executeSummon,
    [EffectTypes.SPAWN_WAVE]: executeSummon,
    [EffectTypes.ROAR]: executeRoar,
    [EffectTypes.PROJECTILE]: executeProjectile,
    [EffectTypes.SLAM]: executeSlam,
    [EffectTypes.EXPLOSION]: executeExplosion,
    [EffectTypes.CURSE]: executeCurse,
    [EffectTypes.INVULNERABILITY]: executeInvulnerability,
    [EffectTypes.AREA_DAMAGE]: executeAreaDamage,
    [EffectTypes.CHARGE]: executeCharge,
    [EffectTypes.GROUND_EFFECT]: executeGroundEffect,
    [EffectTypes.MEGA_AREA]: executeExplosion
};

export {
    EffectTypes,
    EffectExecutors,
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
};
