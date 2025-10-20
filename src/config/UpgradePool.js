/**
 * UpgradePool.js
 * Complete pool of permanent stat upgrades
 * Each upgrade has 5 levels with increasing cost and power
 */

export const UPGRADE_POOL = {
    // ATTACK CATEGORY
    attackSpeed: {
        id: 'attackSpeed',
        name: 'Attack Speed',
        description: 'Reduce attack cooldown by {amount}%',
        icon: '⚡',
        category: 'attack',
        maxLevel: 10,
        levels: [
            { level: 1, amount: 15, price: 15 },   // ⚡ Fire rate: 350ms → 304ms (1.15x)
            { level: 2, amount: 30, price: 25 },   // ⚡ Fire rate: 350ms → 269ms (1.3x)
            { level: 3, amount: 45, price: 40 },   // ⚡ Fire rate: 350ms → 241ms (1.45x)
            { level: 4, amount: 60, price: 60 },   // ⚡ Fire rate: 350ms → 219ms (1.6x)
            { level: 5, amount: 75, price: 85 },   // ⚡ Fire rate: 350ms → 200ms (1.75x)
            { level: 6, amount: 100, price: 115 }, // ⚡⚡ Fire rate: 350ms → 175ms (2x)
            { level: 7, amount: 125, price: 150 }, // ⚡⚡ Fire rate: 350ms → 156ms (2.25x)
            { level: 8, amount: 150, price: 200 }, // ⚡⚡ Fire rate: 350ms → 140ms (2.5x)
            { level: 9, amount: 200, price: 270 }, // ⚡⚡⚡ Fire rate: 350ms → 117ms (3x)
            { level: 10, amount: 300, price: 400 } // ⚡⚡⚡⚡ Fire rate: 350ms → 87ms (4x) MÁXIMO!
        ]
    },

    damage: {
        id: 'damage',
        name: 'Base Damage',
        description: 'Increase damage by {amount}%',
        icon: '⚔️',
        category: 'attack',
        maxLevel: 5,
        levels: [
            { level: 1, amount: 15, price: 18 },  // 🎯 -28% (was 25)
            { level: 2, amount: 30, price: 28 },  // 🎯 -30% (was 40)
            { level: 3, amount: 50, price: 65 },
            { level: 4, amount: 75, price: 95 },
            { level: 5, amount: 100, price: 140 }
        ]
    },

    criticalChance: {
        id: 'criticalChance',
        name: 'Critical Strike',
        description: '{amount}% chance to deal 2x damage',
        icon: '💥',
        category: 'attack',
        maxLevel: 5,
        levels: [
            { level: 1, amount: 5, price: 20 },   // 🎯 -33% (was 30)
            { level: 2, amount: 10, price: 35 },  // 🎯 -30% (was 50)
            { level: 3, amount: 15, price: 75 },
            { level: 4, amount: 22, price: 110 },
            { level: 5, amount: 30, price: 160 }
        ]
    },

    projectileSpeed: {
        id: 'projectileSpeed',
        name: 'Projectile Velocity',
        description: 'Increase arrow speed by {amount}%',
        icon: '🏹',
        category: 'attack',
        maxLevel: 5,
        levels: [
            { level: 1, amount: 15, price: 10 },  // 🎯 -33% (was 15)
            { level: 2, amount: 30, price: 18 },  // 🎯 -28% (was 25)
            { level: 3, amount: 50, price: 40 },
            { level: 4, amount: 75, price: 60 },
            { level: 5, amount: 100, price: 90 }
        ]
    },

    // DEFENSE CATEGORY
    maxHealth: {
        id: 'maxHealth',
        name: 'Maximum Health',
        description: 'Increase max HP by {amount} points',
        icon: '❤️',
        category: 'defense',
        maxLevel: 5,
        levels: [
            { level: 1, amount: 20, price: 15 },  // 🎯 -25% (was 20)
            { level: 2, amount: 40, price: 25 },  // 🎯 -29% (was 35)
            { level: 3, amount: 70, price: 55 },
            { level: 4, amount: 110, price: 80 },
            { level: 5, amount: 160, price: 120 }
        ]
    },

    armor: {
        id: 'armor',
        name: 'Armor',
        description: 'Reduce damage taken by {amount}%',
        icon: '🛡️',
        category: 'defense',
        maxLevel: 5,
        levels: [
            { level: 1, amount: 5, price: 18 },   // 🎯 -28% (was 25)
            { level: 2, amount: 10, price: 28 },  // 🎯 -30% (was 40)
            { level: 3, amount: 17, price: 65 },
            { level: 4, amount: 25, price: 95 },
            { level: 5, amount: 35, price: 140 }
        ]
    },

    regeneration: {
        id: 'regeneration',
        name: 'Health Regeneration',
        description: 'Regenerate {amount} HP every 3 seconds',
        icon: '💚',
        category: 'defense',
        maxLevel: 5,
        levels: [
            { level: 1, amount: 1, price: 20 },   // 🎯 -33% (was 30)
            { level: 2, amount: 2, price: 35 },   // 🎯 -30% (was 50)
            { level: 3, amount: 4, price: 75 },
            { level: 4, amount: 7, price: 110 },
            { level: 5, amount: 12, price: 160 }
        ]
    },

    // MOBILITY CATEGORY
    moveSpeed: {
        id: 'moveSpeed',
        name: 'Movement Speed',
        description: 'Increase movement speed by {amount}%',
        icon: '👟',
        category: 'mobility',
        maxLevel: 5,
        levels: [
            { level: 1, amount: 10, price: 10 },  // 🎯 -33% (was 15)
            { level: 2, amount: 20, price: 18 },  // 🎯 -28% (was 25)
            { level: 3, amount: 30, price: 40 },
            { level: 4, amount: 45, price: 60 },
            { level: 5, amount: 60, price: 90 }
        ]
    },

    dashCooldown: {
        id: 'dashCooldown',
        name: 'Dash Mastery',
        description: 'Reduce all ability cooldowns by {amount}%',
        icon: '⚡',
        category: 'mobility',
        maxLevel: 5,
        levels: [
            { level: 1, amount: 10, price: 18 },  // 🎯 -28% (was 25)
            { level: 2, amount: 18, price: 28 },  // 🎯 -30% (was 40)
            { level: 3, amount: 27, price: 65 },
            { level: 4, amount: 37, price: 95 },
            { level: 5, amount: 50, price: 140 }
        ]
    },

    // UTILITY CATEGORY
    goldBonus: {
        id: 'goldBonus',
        name: 'Treasure Hunter',
        description: 'Gain {amount}% more gold',
        icon: '💰',
        category: 'utility',
        maxLevel: 5,
        levels: [
            { level: 1, amount: 20, price: 15 },  // 🎯 -25% (was 20)
            { level: 2, amount: 40, price: 25 },  // 🎯 -29% (was 35)
            { level: 3, amount: 65, price: 55 },
            { level: 4, amount: 95, price: 80 },
            { level: 5, amount: 130, price: 120 }
        ]
    },

    pickupRadius: {
        id: 'pickupRadius',
        name: 'Magnetism',
        description: 'Increase pickup radius by {amount}%',
        icon: '🧲',
        category: 'utility',
        maxLevel: 5,
        levels: [
            { level: 1, amount: 25, price: 10 },  // 🎯 -33% (was 15)
            { level: 2, amount: 50, price: 18 },  // 🎯 -28% (was 25)
            { level: 3, amount: 80, price: 40 },
            { level: 4, amount: 120, price: 60 },
            { level: 5, amount: 170, price: 90 }
        ]
    },

    luck: {
        id: 'luck',
        name: 'Luck',
        description: '{amount}% chance for double gold drops',
        icon: '🍀',
        category: 'utility',
        maxLevel: 5,
        levels: [
            { level: 1, amount: 15, price: 18 },  // 🎯 -28% price (was 25), +50% effect (was 10%)
            { level: 2, amount: 25, price: 28 },  // 🎯 -30% price (was 40), +39% effect (was 18%)
            { level: 3, amount: 35, price: 65 },  // 🎯 +30% effect (was 27%)
            { level: 4, amount: 45, price: 95 },  // 🎯 +22% effect (was 37%)
            { level: 5, amount: 60, price: 140 }  // 🎯 +20% effect (was 50%)
        ]
    }
};

/**
 * Get upgrade by ID
 */
export function getUpgrade(id) {
    return UPGRADE_POOL[id] || null;
}

/**
 * Get all upgrades in a category
 */
export function getUpgradesByCategory(category) {
    return Object.values(UPGRADE_POOL).filter(upgrade => upgrade.category === category);
}

/**
 * Get all available categories
 */
export function getCategories() {
    const categories = new Set();
    Object.values(UPGRADE_POOL).forEach(upgrade => categories.add(upgrade.category));
    return Array.from(categories);
}

/**
 * Get level data for an upgrade
 */
export function getUpgradeLevel(upgradeId, level) {
    const upgrade = UPGRADE_POOL[upgradeId];
    if (!upgrade) return null;
    return upgrade.levels.find(l => l.level === level) || null;
}
