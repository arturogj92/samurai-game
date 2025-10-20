/**
 * AbilityUpgradeSystem.js
 * Manages ability upgrades and enhancements
 * Integrates with AbilitySystem to modify ability behavior
 */

import { ABILITY_UPGRADES, getAbilityUpgrade, getAbilityLevel, canUpgradeAbility } from '../config/AbilityUpgrades.js';

export default class AbilityUpgradeSystem {
    constructor(scene) {
        this.scene = scene;

        // Track current level of each ability
        // Example: { dash: 3, shield: 2, burst: 1 }
        this.abilityLevels = {};

        // Initialize all owned abilities to level 1
        this.initializeOwnedAbilities();
    }

    /**
     * Initialize owned abilities to level 1
     */
    initializeOwnedAbilities() {
        const ownedAbilities = this.scene.gameState.ownedAbilities || [];
        ownedAbilities.forEach(abilityId => {
            if (!this.abilityLevels[abilityId]) {
                this.abilityLevels[abilityId] = 1; // Start at level 1 (base ability)
            }
        });

        // Also check ability slots
        Object.values(this.scene.gameState.abilitySlots).forEach(abilityId => {
            if (abilityId && !this.abilityLevels[abilityId]) {
                this.abilityLevels[abilityId] = 1;
            }
        });
    }

    /**
     * When player buys a new ability, set it to level 1
     */
    registerAbility(abilityId) {
        if (!this.abilityLevels[abilityId]) {
            this.abilityLevels[abilityId] = 1;
            console.log(`📝 Registered new ability: ${abilityId} at level 1`);
        }
    }

    /**
     * Upgrade an ability to the next level
     */
    upgradeAbility(abilityId) {
        const abilityData = getAbilityUpgrade(abilityId);
        if (!abilityData) {
            console.error(`❌ Unknown ability: ${abilityId}`);
            return false;
        }

        const currentLevel = this.abilityLevels[abilityId] || 1;
        const nextLevel = currentLevel + 1;

        if (nextLevel > abilityData.maxLevel) {
            console.warn(`⚠️ ${abilityId} is already at max level!`);
            return false;
        }

        const levelData = getAbilityLevel(abilityId, nextLevel);
        if (!levelData) {
            console.error(`❌ No data for ${abilityId} level ${nextLevel}`);
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
        this.abilityLevels[abilityId] = nextLevel;

        console.log(`✨ Upgraded ${abilityId} to level ${nextLevel}: ${levelData.name}`);
        if (levelData.special) {
            console.log(`🌟 SPECIAL EFFECT: ${levelData.special}`);
        }
        console.log(`💎 Current ability levels:`, this.abilityLevels);

        // Update ability bar UI to show new level
        if (this.scene.abilityBarUI) {
            this.scene.abilityBarUI.update();
        }

        return true;
    }

    /**
     * Get current level of an ability
     */
    getAbilityLevel(abilityId) {
        return this.abilityLevels[abilityId] || 1;
    }

    /**
     * Get ability stats for current level
     */
    getAbilityStats(abilityId) {
        const currentLevel = this.getAbilityLevel(abilityId);
        const levelData = getAbilityLevel(abilityId, currentLevel);
        return levelData ? levelData.stats : null;
    }

    /**
     * Check if ability has a special effect
     */
    hasSpecialEffect(abilityId, effectName) {
        const currentLevel = this.getAbilityLevel(abilityId);
        const levelData = getAbilityLevel(abilityId, currentLevel);
        return levelData && levelData.special === effectName;
    }

    /**
     * Get special effect name for current level
     */
    getSpecialEffect(abilityId) {
        const currentLevel = this.getAbilityLevel(abilityId);
        const levelData = getAbilityLevel(abilityId, currentLevel);
        return levelData ? levelData.special : null;
    }

    /**
     * Check if ability can be upgraded
     */
    canUpgrade(abilityId) {
        const currentLevel = this.abilityLevels[abilityId] || 1;
        const abilityData = getAbilityUpgrade(abilityId);
        if (!abilityData) return false;

        if (currentLevel >= abilityData.maxLevel) return false;

        const nextLevel = currentLevel + 1;
        const levelData = getAbilityLevel(abilityId, nextLevel);
        if (!levelData) return false;

        const gold = this.scene.gameState.resources.gold;
        return gold >= levelData.price;
    }

    /**
     * Get next level data (for UI preview)
     */
    getNextLevelData(abilityId) {
        const currentLevel = this.abilityLevels[abilityId] || 1;
        const nextLevel = currentLevel + 1;
        return getAbilityLevel(abilityId, nextLevel);
    }

    /**
     * Get current level data (for UI display)
     */
    getCurrentLevelData(abilityId) {
        const currentLevel = this.abilityLevels[abilityId] || 1;
        return getAbilityLevel(abilityId, currentLevel);
    }

    /**
     * Apply cooldown reduction from ability upgrades
     */
    getModifiedCooldown(abilityId, baseCooldown) {
        const stats = this.getAbilityStats(abilityId);
        if (!stats || !stats.cooldown) return baseCooldown;

        // Also apply player's cooldown reduction upgrade
        const player = this.scene.player;
        const cooldownReduction = player.cooldownReduction || 0;

        return stats.cooldown * (1 - cooldownReduction);
    }

    /**
     * Get all owned abilities with their levels
     */
    getOwnedAbilitiesWithLevels() {
        const result = [];
        const ownedIds = new Set([
            ...this.scene.gameState.ownedAbilities,
            ...Object.values(this.scene.gameState.abilitySlots).filter(id => id !== null)
        ]);

        ownedIds.forEach(abilityId => {
            const currentLevel = this.getAbilityLevel(abilityId);
            const currentData = this.getCurrentLevelData(abilityId);
            const nextData = this.getNextLevelData(abilityId);
            const abilityInfo = getAbilityUpgrade(abilityId);

            if (abilityInfo) {
                result.push({
                    id: abilityId,
                    currentLevel: currentLevel,
                    maxLevel: abilityInfo.maxLevel,
                    currentData: currentData,
                    nextData: nextData,
                    canUpgrade: this.canUpgrade(abilityId)
                });
            }
        });

        return result;
    }

    /**
     * Reset all ability levels (for new game)
     */
    reset() {
        this.abilityLevels = {};
        this.initializeOwnedAbilities();
    }
}
