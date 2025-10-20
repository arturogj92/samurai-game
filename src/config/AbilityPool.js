/**
 * AbilityPool
 * Complete pool of all available abilities with metadata
 */

export const ABILITY_POOL = {
    // Mobility
    dash: {
        id: 'dash',
        name: 'Dash',
        description: 'Quick dash forward',
        icon: 'skill-dash',
        price: 20, // 🎯 -20% (was 25)
        category: 'mobility'
    },

    // Attack
    burst: {
        id: 'burst',
        name: 'Burst Fire',
        description: 'Hold to charge, release for multiple arrows',
        icon: 'skill-burst',
        price: 25, // 🎯 -17% (was 30)
        category: 'attack'
    },

    arrowStorm: {
        id: 'arrowStorm',
        name: 'Arrow Storm',
        description: 'Rain of arrows from the sky at cursor',
        icon: 'skill-arrow-shower',
        price: 30, // 🎯 -25% (was 40)
        category: 'attack'
    },

    chainLightning: {
        id: 'chainLightning',
        name: 'Chain Lightning',
        description: 'Lightning jumps between enemies',
        icon: 'skill-lightning',
        price: 28, // 🎯 -20% (was 35)
        category: 'attack'
    },

    // Defense
    shield: {
        id: 'shield',
        name: 'Shield',
        description: 'Temporary damage immunity',
        icon: 'skill-shield',
        price: 40, // 🎯 -20% (was 50)
        category: 'defense'
    },

    // Buff
    berserker: {
        id: 'berserker',
        name: 'Berserker Mode',
        description: '+100% damage, +50% speed, 3x fire rate',
        icon: 'skill-berserker',
        price: 48, // 🎯 -20% (was 60)
        category: 'buff'
    },

    ricochet: {
        id: 'ricochet',
        name: 'Ricochet',
        description: 'Arrows bounce to another enemy',
        icon: 'skill-ricochet',
        price: 36, // 🎯 -20% (was 45)
        category: 'buff'
    },

    infinityArrows: {
        id: 'infinityArrows',
        name: 'Infinity Arrows',
        description: '10x fire rate for 4 seconds - ULTIMATE',
        icon: 'skill-infinity-arrows',
        price: 64, // 🎯 -20% (was 80)
        category: 'ultimate'
    },

    // Summon
    summon: {
        id: 'summon',
        name: 'Summon Archers',
        description: 'Spawn 5 mini archers to fight for you',
        icon: 'skill-summon-army',
        price: 44, // 🎯 -20% (was 55)
        category: 'summon'
    },

    // Special
    prism: {
        id: 'prism',
        name: 'Prism Orbital',
        description: 'Orbiting prisms that deflect projectiles',
        icon: 'skill-prism',
        price: 40, // 🎯 -20% (was 50)
        category: 'defense'
    }
};

// Helper function to get a random subset of abilities
export function getRandomAbilities(count, exclude = []) {
    const availableAbilities = Object.values(ABILITY_POOL).filter(
        ability => !exclude.includes(ability.id)
    );

    // Shuffle and take first 'count' items
    const shuffled = availableAbilities.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Helper to get ability by ID
export function getAbility(id) {
    return ABILITY_POOL[id] || null;
}
