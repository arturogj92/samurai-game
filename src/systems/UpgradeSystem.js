/**
 * UpgradeSystem.js
 * Manages permanent stat upgrades for the player
 * Applies bonuses and tracks upgrade levels
 */

import { UPGRADE_POOL, getUpgrade, getUpgradeLevel } from '../config/UpgradePool.js';

export default class UpgradeSystem {
    constructor(scene) {
        this.scene = scene;

        // Track current level of each upgrade
        // Example: { attackSpeed: 2, maxHealth: 3, moveSpeed: 1 }
        this.upgradeLevels = {};

        // Regeneration timer
        this.lastRegenTime = 0;
        this.REGEN_INTERVAL = 3000; // Every 3 seconds
    }

    /**
     * Purchase an upgrade (increase its level)
     */
    purchaseUpgrade(upgradeId) {
        const upgrade = getUpgrade(upgradeId);
        if (!upgrade) {
            console.error(`❌ Unknown upgrade: ${upgradeId}`);
            return false;
        }

        const currentLevel = this.upgradeLevels[upgradeId] || 0;
        const nextLevel = currentLevel + 1;

        if (nextLevel > upgrade.maxLevel) {
            console.warn(`⚠️ ${upgrade.name} is already at max level!`);
            return false;
        }

        const levelData = getUpgradeLevel(upgradeId, nextLevel);
        if (!levelData) {
            console.error(`❌ No data for ${upgrade.name} level ${nextLevel}`);
            return false;
        }

        // Check if player can afford it
        const gold = this.scene.gameState.resources.gold;
        if (gold < levelData.price) {
            console.warn(`⚠️ Not enough gold! Need ${levelData.price}, have ${gold}`);
            return false;
        }

        // Deduct gold
        this.scene.gameState.resources.gold -= levelData.price;

        // Increase level
        this.upgradeLevels[upgradeId] = nextLevel;

        console.log(`✅ Purchased ${upgrade.name} level ${nextLevel} for ${levelData.price} gold`);
        console.log(`💎 Current upgrades:`, this.upgradeLevels);

        // Apply the upgrade immediately
        this.applyUpgrades();

        return true;
    }

    /**
     * Get current level of an upgrade
     */
    getUpgradeLevel(upgradeId) {
        return this.upgradeLevels[upgradeId] || 0;
    }

    /**
     * Check if upgrade can be purchased
     */
    canPurchase(upgradeId) {
        const upgrade = getUpgrade(upgradeId);
        if (!upgrade) return false;

        const currentLevel = this.upgradeLevels[upgradeId] || 0;
        if (currentLevel >= upgrade.maxLevel) return false;

        const nextLevel = currentLevel + 1;
        const levelData = getUpgradeLevel(upgradeId, nextLevel);
        if (!levelData) return false;

        const gold = this.scene.gameState.resources.gold;
        return gold >= levelData.price;
    }

    /**
     * Apply all upgrades to player stats
     * Call this after purchasing an upgrade or when initializing
     */
    applyUpgrades() {
        const player = this.scene.player;
        if (!player) return;

        // Reset to base stats
        player.baseSpeed = 200;
        player.baseMaxHealth = 100;
        player.baseDamageMultiplier = 1.0;
        player.baseAttackSpeed = 1.0;
        player.armor = 0;
        player.regenAmount = 0;
        player.critChance = 0;
        player.projectileSpeedBonus = 0;
        player.cooldownReduction = 0;
        player.goldBonus = 0;
        player.pickupRadiusMultiplier = 1.0;
        player.luckChance = 0;

        // Apply each upgrade
        Object.entries(this.upgradeLevels).forEach(([upgradeId, level]) => {
            const levelData = getUpgradeLevel(upgradeId, level);
            if (!levelData) return;

            switch (upgradeId) {
                case 'attackSpeed':
                    // Reduce cooldown by X%
                    player.baseAttackSpeed = 1.0 + (levelData.amount / 100);
                    break;

                case 'damage':
                    // Increase damage multiplier
                    player.baseDamageMultiplier = 1.0 + (levelData.amount / 100);
                    break;

                case 'criticalChance':
                    player.critChance = levelData.amount / 100;
                    break;

                case 'projectileSpeed':
                    player.projectileSpeedBonus = levelData.amount / 100;
                    break;

                case 'maxHealth':
                    player.baseMaxHealth = 100 + levelData.amount;
                    // Heal player by the bonus amount
                    player.health = Math.min(player.health + levelData.amount, player.baseMaxHealth);
                    player.maxHealth = player.baseMaxHealth;
                    break;

                case 'armor':
                    player.armor = levelData.amount / 100;
                    break;

                case 'regeneration':
                    player.regenAmount = levelData.amount;
                    break;

                case 'moveSpeed':
                    player.baseSpeed = 200 * (1 + levelData.amount / 100);
                    break;

                case 'dashCooldown':
                    player.cooldownReduction = levelData.amount / 100;
                    break;

                case 'goldBonus':
                    player.goldBonus = levelData.amount / 100;
                    break;

                case 'pickupRadius':
                    player.pickupRadiusMultiplier = 1.0 + (levelData.amount / 100);
                    break;

                case 'luck':
                    player.luckChance = levelData.amount / 100;
                    break;
            }
        });

        // Apply final calculated values
        player.speed = player.baseSpeed;
        player.maxHealth = player.baseMaxHealth;
        player.damageMultiplier = player.baseDamageMultiplier;

        console.log('📊 Applied upgrades to player:', {
            speed: player.speed,
            maxHealth: player.maxHealth,
            damage: player.damageMultiplier,
            attackSpeed: player.baseAttackSpeed,
            armor: player.armor,
            regen: player.regenAmount
        });

        // Update health bar if it exists
        if (this.scene.updateHealthBar) {
            this.scene.updateHealthBar();
        }
    }

    /**
     * Update loop - handle regeneration
     */
    update(time) {
        if (!this.scene.player) return;

        // Health regeneration
        if (this.scene.player.regenAmount > 0) {
            if (time - this.lastRegenTime >= this.REGEN_INTERVAL) {
                this.lastRegenTime = time;

                const currentHealth = this.scene.player.health;
                const maxHealth = this.scene.player.maxHealth;

                if (currentHealth < maxHealth) {
                    const newHealth = Math.min(currentHealth + this.scene.player.regenAmount, maxHealth);
                    this.scene.player.health = newHealth;

                    // Show heal number (using spawnDamageNumber with negative value indicates healing)
                    if (this.scene.damageNumberSystem) {
                        this.scene.damageNumberSystem.spawnDamageNumber(
                            this.scene.player.x,
                            this.scene.player.y - 30,
                            this.scene.player.regenAmount,
                            false,  // not critical
                            false   // not player damage (it's healing)
                        );
                    }

                    // Update health bar
                    if (this.scene.updateHealthBar) {
                        this.scene.updateHealthBar();
                    }
                }
            }
        }
    }

    /**
     * Get all current upgrade bonuses as a summary
     */
    getSummary() {
        const summary = {};
        Object.entries(this.upgradeLevels).forEach(([upgradeId, level]) => {
            const upgrade = getUpgrade(upgradeId);
            const levelData = getUpgradeLevel(upgradeId, level);
            if (upgrade && levelData) {
                summary[upgradeId] = {
                    name: upgrade.name,
                    level: level,
                    maxLevel: upgrade.maxLevel,
                    amount: levelData.amount,
                    description: upgrade.description.replace('{amount}', levelData.amount)
                };
            }
        });
        return summary;
    }

    /**
     * Reset all upgrades (for new game)
     */
    reset() {
        this.upgradeLevels = {};
        this.applyUpgrades();
    }
}
