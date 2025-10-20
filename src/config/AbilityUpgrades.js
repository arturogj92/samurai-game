/**
 * AbilityUpgrades.js
 * Upgrade paths for each ability in ABILITY_POOL
 * Level 3+ upgrades have EPIC special effects and bonuses!
 */

export const ABILITY_UPGRADES = {
    dash: {
        id: 'dash',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                name: 'Dash',
                price: 0, // Base ability (already purchased)
                description: 'Quick dash forward',
                stats: { distance: 250, cooldown: 5000 }
            },
            {
                level: 2,
                name: 'Swift Dash',
                price: 30,
                description: '+30% distance, -20% cooldown',
                stats: { distance: 325, cooldown: 4000 }
            },
            {
                level: 3,
                name: '⚡ Lightning Dash',
                price: 60,
                description: '🌟 EPIC: Leave lightning trail that damages enemies!',
                stats: { distance: 400, cooldown: 3500, trailDamage: 15, trailDuration: 1000 },
                special: 'lightning_trail',
                color: '#FFD700'
            },
            {
                level: 4,
                name: '⚡ Thunder Dash',
                price: 100,
                description: '🌟 Create shockwave at end point, stunning nearby enemies',
                stats: { distance: 450, cooldown: 3000, trailDamage: 25, trailDuration: 1500, shockwaveRadius: 150 },
                special: 'shockwave',
                color: '#FF4500'
            },
            {
                level: 5,
                name: '⚡ Quantum Dash',
                price: 150,
                description: '🌟🌟 LEGENDARY: Can dash through walls + 2 charges!',
                stats: { distance: 550, cooldown: 2500, trailDamage: 40, trailDuration: 2000, shockwaveRadius: 200, charges: 2 },
                special: 'phasing',
                color: '#9400D3'
            }
        ]
    },

    burst: {
        id: 'burst',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                name: 'Burst Fire',
                price: 0,
                description: 'Hold to charge, release for multiple arrows',
                stats: { maxArrows: 3, chargeTime: 1500, damage: 1.0 }
            },
            {
                level: 2,
                name: 'Rapid Burst',
                price: 35,
                description: '+2 arrows, faster charge',
                stats: { maxArrows: 5, chargeTime: 1200, damage: 1.0 }
            },
            {
                level: 3,
                name: '🔥 Flame Burst',
                price: 70,
                description: '🌟 EPIC: Arrows ignite enemies, dealing burn damage!',
                stats: { maxArrows: 7, chargeTime: 1000, damage: 1.2, burnDamage: 5, burnDuration: 3000 },
                special: 'fire_arrows',
                color: '#FF4500'
            },
            {
                level: 4,
                name: '🔥 Inferno Burst',
                price: 110,
                description: '🌟 Burning enemies explode on death',
                stats: { maxArrows: 9, chargeTime: 800, damage: 1.5, burnDamage: 10, burnDuration: 4000, explosionRadius: 100 },
                special: 'burn_explosion',
                color: '#FF8C00'
            },
            {
                level: 5,
                name: '🔥 Phoenix Burst',
                price: 170,
                description: '🌟🌟 LEGENDARY: Arrows split on hit + pierce enemies!',
                stats: { maxArrows: 12, chargeTime: 600, damage: 2.0, burnDamage: 20, burnDuration: 5000, explosionRadius: 150, pierce: true, split: 2 },
                special: 'phoenix_split',
                color: '#FFD700'
            }
        ]
    },

    arrowStorm: {
        id: 'arrowStorm',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                name: 'Arrow Storm',
                price: 0,
                description: 'Rain of arrows from the sky',
                stats: { arrowCount: 15, radius: 150, damage: 25, cooldown: 12000 }
            },
            {
                level: 2,
                name: 'Heavy Storm',
                price: 40,
                description: 'More arrows, larger area',
                stats: { arrowCount: 25, radius: 200, damage: 30, cooldown: 10000 }
            },
            {
                level: 3,
                name: '❄️ Blizzard Storm',
                price: 80,
                description: '🌟 EPIC: Arrows freeze enemies, slowing them by 50%!',
                stats: { arrowCount: 35, radius: 250, damage: 40, cooldown: 9000, slowPercent: 50, slowDuration: 3000 },
                special: 'freeze',
                color: '#00FFFF'
            },
            {
                level: 4,
                name: '❄️ Avalanche Storm',
                price: 130,
                description: '🌟 Frozen enemies shatter, damaging nearby foes',
                stats: { arrowCount: 50, radius: 300, damage: 55, cooldown: 8000, slowPercent: 70, slowDuration: 4000, shatterRadius: 120 },
                special: 'shatter',
                color: '#4169E1'
            },
            {
                level: 5,
                name: '❄️ Eternal Winter',
                price: 200,
                description: '🌟🌟 LEGENDARY: Creates lingering frost zone that keeps damaging!',
                stats: { arrowCount: 70, radius: 400, damage: 75, cooldown: 7000, slowPercent: 90, slowDuration: 5000, shatterRadius: 150, zoneDuration: 8000, zoneDamage: 10 },
                special: 'frost_zone',
                color: '#E0FFFF'
            }
        ]
    },

    chainLightning: {
        id: 'chainLightning',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                name: 'Chain Lightning',
                price: 0,
                description: 'Lightning jumps between enemies',
                stats: { damage: 40, jumpCount: 3, jumpRange: 200, cooldown: 8000 }
            },
            {
                level: 2,
                name: 'Forked Lightning',
                price: 35,
                description: 'More jumps, longer range',
                stats: { damage: 55, jumpCount: 5, jumpRange: 250, cooldown: 7000 }
            },
            {
                level: 3,
                name: '⚡ Storm Chain',
                price: 70,
                description: '🌟 EPIC: Each jump creates mini storm clouds!',
                stats: { damage: 75, jumpCount: 7, jumpRange: 300, cooldown: 6000, cloudDamage: 15, cloudDuration: 2000 },
                special: 'storm_clouds',
                color: '#FFD700'
            },
            {
                level: 4,
                name: '⚡ Thunderlord Chain',
                price: 115,
                description: '🌟 Lightning can jump to same target twice',
                stats: { damage: 100, jumpCount: 10, jumpRange: 350, cooldown: 5000, cloudDamage: 25, cloudDuration: 3000, doubleHit: true },
                special: 'double_hit',
                color: '#FF4500'
            },
            {
                level: 5,
                name: '⚡ Zeus Wrath',
                price: 180,
                description: '🌟🌟 LEGENDARY: Lightning stuns + calls down massive thunder bolt!',
                stats: { damage: 150, jumpCount: 15, jumpRange: 450, cooldown: 4000, cloudDamage: 40, cloudDuration: 4000, doubleHit: true, stunDuration: 1500, finalBoltDamage: 200 },
                special: 'thunder_finale',
                color: '#9370DB'
            }
        ]
    },

    shield: {
        id: 'shield',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                name: 'Shield',
                price: 0,
                description: 'Temporary damage immunity',
                stats: { duration: 3000, cooldown: 15000 }
            },
            {
                level: 2,
                name: 'Iron Shield',
                price: 45,
                description: 'Longer duration, shorter cooldown',
                stats: { duration: 4500, cooldown: 12000 }
            },
            {
                level: 3,
                name: '💎 Diamond Shield',
                price: 90,
                description: '🌟 EPIC: Reflects 50% of blocked damage to attackers!',
                stats: { duration: 6000, cooldown: 10000, reflectPercent: 50 },
                special: 'reflect',
                color: '#00CED1'
            },
            {
                level: 4,
                name: '💎 Prism Shield',
                price: 140,
                description: '🌟 Reflected damage also heals you',
                stats: { duration: 7500, cooldown: 8500, reflectPercent: 75, healPercent: 30 },
                special: 'vampiric_reflect',
                color: '#FF1493'
            },
            {
                level: 5,
                name: '💎 Divine Aegis',
                price: 210,
                description: '🌟🌟 LEGENDARY: Shield explodes when it ends, damaging all nearby enemies!',
                stats: { duration: 9000, cooldown: 7000, reflectPercent: 100, healPercent: 50, explosionDamage: 150, explosionRadius: 300 },
                special: 'divine_explosion',
                color: '#FFD700'
            }
        ]
    },

    berserker: {
        id: 'berserker',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                name: 'Berserker Mode',
                price: 0,
                description: '+100% damage, +50% speed, 3x fire rate',
                stats: { damageBonus: 1.0, speedBonus: 0.5, fireRateMultiplier: 3, duration: 5000, cooldown: 20000 }
            },
            {
                level: 2,
                name: 'Rage Mode',
                price: 55,
                description: 'Enhanced bonuses, longer duration',
                stats: { damageBonus: 1.5, speedBonus: 0.7, fireRateMultiplier: 4, duration: 7000, cooldown: 18000 }
            },
            {
                level: 3,
                name: '🔴 Blood Rage',
                price: 110,
                description: '🌟 EPIC: Kills extend duration by 1 second each!',
                stats: { damageBonus: 2.0, speedBonus: 1.0, fireRateMultiplier: 5, duration: 9000, cooldown: 16000, killExtension: 1000 },
                special: 'kill_extension',
                color: '#DC143C'
            },
            {
                level: 4,
                name: '🔴 Carnage Mode',
                price: 170,
                description: '🌟 You become unstoppable - immune to knockback!',
                stats: { damageBonus: 2.5, speedBonus: 1.3, fireRateMultiplier: 6, duration: 11000, cooldown: 14000, killExtension: 1500, unstoppable: true },
                special: 'unstoppable',
                color: '#8B0000'
            },
            {
                level: 5,
                name: '🔴 God of War',
                price: 250,
                description: '🌟🌟 LEGENDARY: Gain lifesteal + create shockwaves with each attack!',
                stats: { damageBonus: 3.5, speedBonus: 2.0, fireRateMultiplier: 8, duration: 15000, cooldown: 12000, killExtension: 2000, unstoppable: true, lifesteal: 0.25, shockwave: true },
                special: 'war_god',
                color: '#FF0000'
            }
        ]
    },

    ricochet: {
        id: 'ricochet',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                name: 'Ricochet',
                price: 0,
                description: 'Arrows bounce to another enemy',
                stats: { bounces: 1, bounceRange: 200, damageMultiplier: 1.0 }
            },
            {
                level: 2,
                name: 'Multi-Ricochet',
                price: 40,
                description: 'More bounces, longer range',
                stats: { bounces: 2, bounceRange: 250, damageMultiplier: 1.0 }
            },
            {
                level: 3,
                name: '🌈 Prism Ricochet',
                price: 80,
                description: '🌟 EPIC: Each bounce increases damage by 25%!',
                stats: { bounces: 3, bounceRange: 300, damageMultiplier: 1.25 },
                special: 'escalating_damage',
                color: '#FF69B4'
            },
            {
                level: 4,
                name: '🌈 Rainbow Cascade',
                price: 130,
                description: '🌟 Arrows split into 2 on each bounce',
                stats: { bounces: 4, bounceRange: 350, damageMultiplier: 1.4, split: 2 },
                special: 'bounce_split',
                color: '#9400D3'
            },
            {
                level: 5,
                name: '🌈 Infinite Reflection',
                price: 200,
                description: '🌟🌟 LEGENDARY: Arrows never stop bouncing until all enemies dead!',
                stats: { bounces: 999, bounceRange: 450, damageMultiplier: 1.6, split: 3, infinite: true },
                special: 'infinite_bounce',
                color: '#FFD700'
            }
        ]
    },

    infinityArrows: {
        id: 'infinityArrows',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                name: 'Infinity Arrows',
                price: 0,
                description: '10x fire rate for 4 seconds - ULTIMATE',
                stats: { fireRateMultiplier: 10, duration: 4000, cooldown: 30000 }
            },
            {
                level: 2,
                name: 'Infinity Storm',
                price: 75,
                description: 'Longer duration, faster fire rate',
                stats: { fireRateMultiplier: 15, duration: 5500, cooldown: 27000 }
            },
            {
                level: 3,
                name: '♾️ Infinity Barrage',
                price: 150,
                description: '🌟 EPIC: Arrows pierce all enemies infinitely!',
                stats: { fireRateMultiplier: 20, duration: 7000, cooldown: 24000, infinitePierce: true },
                special: 'pierce',
                color: '#FFD700'
            },
            {
                level: 4,
                name: '♾️ Infinity Apocalypse',
                price: 230,
                description: '🌟 Arrows home in on enemies + triple shot!',
                stats: { fireRateMultiplier: 25, duration: 9000, cooldown: 21000, infinitePierce: true, homing: true, multishot: 3 },
                special: 'homing',
                color: '#FF4500'
            },
            {
                level: 5,
                name: '♾️ Arrow Singularity',
                price: 350,
                description: '🌟🌟 LEGENDARY: Create a black hole of arrows - INSTANT KILL EVERYTHING!',
                stats: { fireRateMultiplier: 50, duration: 12000, cooldown: 18000, infinitePierce: true, homing: true, multishot: 5, vortex: true, damageMultiplier: 3.0 },
                special: 'singularity',
                color: '#9400D3'
            }
        ]
    },

    summon: {
        id: 'summon',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                name: 'Summon Archers',
                price: 0,
                description: 'Spawn 5 mini archers',
                stats: { count: 5, duration: 15000, archerHealth: 30, archerDamage: 8, cooldown: 25000 }
            },
            {
                level: 2,
                name: 'Archer Squad',
                price: 50,
                description: 'More archers, stronger stats',
                stats: { count: 7, duration: 20000, archerHealth: 45, archerDamage: 12, cooldown: 22000 }
            },
            {
                level: 3,
                name: '🏹 Elite Battalion',
                price: 100,
                description: '🌟 EPIC: Archers have special abilities (dash, shield)!',
                stats: { count: 10, duration: 25000, archerHealth: 60, archerDamage: 18, cooldown: 20000, abilities: true },
                special: 'archer_abilities',
                color: '#4169E1'
            },
            {
                level: 4,
                name: '🏹 Royal Army',
                price: 160,
                description: '🌟 Summon armored knights + mages!',
                stats: { count: 12, duration: 30000, archerHealth: 80, archerDamage: 25, cooldown: 18000, abilities: true, variety: ['archer', 'knight', 'mage'] },
                special: 'army_variety',
                color: '#FFD700'
            },
            {
                level: 5,
                name: '🏹 Legendary Legion',
                price: 250,
                description: '🌟🌟 LEGENDARY: Summons respawn on death + follow you forever!',
                stats: { count: 15, duration: 99999, archerHealth: 120, archerDamage: 40, cooldown: 15000, abilities: true, variety: ['archer', 'knight', 'mage', 'tank'], respawn: true, permanent: true },
                special: 'immortal_army',
                color: '#9370DB'
            }
        ]
    },

    prism: {
        id: 'prism',
        maxLevel: 5,
        levels: [
            {
                level: 1,
                name: 'Prism Orbital',
                price: 0,
                description: 'Orbiting prisms deflect projectiles',
                stats: { prismCount: 3, orbitRadius: 80, rotationSpeed: 2, deflectChance: 0.7, duration: 12000, cooldown: 20000 }
            },
            {
                level: 2,
                name: 'Crystal Guard',
                price: 45,
                description: 'More prisms, better deflection',
                stats: { prismCount: 5, orbitRadius: 100, rotationSpeed: 2.5, deflectChance: 0.85, duration: 16000, cooldown: 18000 }
            },
            {
                level: 3,
                name: '💎 Diamond Orbit',
                price: 90,
                description: '🌟 EPIC: Prisms shoot lasers at nearby enemies!',
                stats: { prismCount: 7, orbitRadius: 120, rotationSpeed: 3, deflectChance: 0.95, duration: 20000, cooldown: 16000, laserDamage: 20 },
                special: 'laser_attack',
                color: '#00CED1'
            },
            {
                level: 4,
                name: '💎 Prismatic Barrier',
                price: 145,
                description: '🌟 Prisms create damage shield + heal you',
                stats: { prismCount: 9, orbitRadius: 140, rotationSpeed: 3.5, deflectChance: 1.0, duration: 25000, cooldown: 14000, laserDamage: 35, shieldHealth: 50, healPerSecond: 3 },
                special: 'healing_shield',
                color: '#FF1493'
            },
            {
                level: 5,
                name: '💎 Celestial Prisms',
                price: 220,
                description: '🌟🌟 LEGENDARY: Prisms explode and reform + attract gold!',
                stats: { prismCount: 12, orbitRadius: 160, rotationSpeed: 4, deflectChance: 1.0, duration: 35000, cooldown: 12000, laserDamage: 60, shieldHealth: 100, healPerSecond: 5, explosionDamage: 80, goldMagnet: true },
                special: 'celestial',
                color: '#FFD700'
            }
        ]
    }
};

/**
 * Get ability upgrade data
 */
export function getAbilityUpgrade(abilityId) {
    return ABILITY_UPGRADES[abilityId] || null;
}

/**
 * Get specific level data for an ability
 */
export function getAbilityLevel(abilityId, level) {
    const ability = ABILITY_UPGRADES[abilityId];
    if (!ability) return null;
    return ability.levels.find(l => l.level === level) || null;
}

/**
 * Check if ability can be upgraded
 */
export function canUpgradeAbility(abilityId, currentLevel) {
    const ability = ABILITY_UPGRADES[abilityId];
    if (!ability) return false;
    return currentLevel < ability.maxLevel;
}
