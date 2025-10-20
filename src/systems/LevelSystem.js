/**
 * LevelSystem - Manages level progression and difficulty scaling
 *
 * Features:
 * - 5 levels with increasing difficulty
 * - Progressive increase in hut count, spawn rate, and fire rate
 * - Level statistics tracking
 */
export default class LevelSystem {
    constructor() {
        // Current level (1-5)
        this.currentLevel = 1;

        // Statistics for current level
        this.stats = {
            enemiesKilled: 0,
            goldCollected: 0,
            startTime: 0,
            endTime: 0,
            damageDealt: 0,
            damageTaken: 0
        };

        // Level configurations - 🎯 Rebalanced for smoother progression
        this.levelConfigs = {
            1: {
                level: 1,
                name: "First Wave",
                hutCount: 1,                 // Tutorial level
                spawnRateMultiplier: 1.0,    // Base spawn rate
                fireRateMultiplier: 1.0,     // Base fire rate
                description: "Survive the first assault"
            },
            2: {
                level: 2,
                name: "Growing Threat",
                hutCount: 2,                 // 🎯 Still easy, just more targets
                spawnRateMultiplier: 1.0,    // Same spawn rate
                fireRateMultiplier: 1.0,     // Same fire rate
                description: "More huts to defend against"
            },
            3: {
                level: 3,
                name: "Rising Danger",
                hutCount: 2,                 // 🎯 Keep at 2 huts for smoother curve (was 3)
                spawnRateMultiplier: 0.85,   // 🎯 15% faster spawns (was 0.7 = too hard)
                fireRateMultiplier: 0.9,     // 🎯 10% faster shooting (was 0.8 = too hard)
                description: "Enemies spawn and attack faster"
            },
            4: {
                level: 4,
                name: "Overwhelming Force",
                hutCount: 3,                 // 🎯 Now 3 huts (was 4)
                spawnRateMultiplier: 0.7,    // 🎯 30% faster spawns (was 0.5)
                fireRateMultiplier: 0.75,    // 🎯 25% faster shooting (was 0.6)
                description: "The horde intensifies"
            },
            5: {
                level: 5,
                name: "Final Stand",
                hutCount: 4,                 // Max huts for final challenge
                spawnRateMultiplier: 0.5,    // 🎯 50% faster spawns (was 0.2 = insane)
                fireRateMultiplier: 0.6,     // 🎯 40% faster shooting (was 0.4)
                description: "Survive the ultimate challenge"
            }
        };
    }

    /**
     * Get configuration for current level
     */
    getCurrentLevelConfig() {
        return this.levelConfigs[this.currentLevel];
    }

    /**
     * Get configuration for a specific level
     */
    getLevelConfig(level) {
        return this.levelConfigs[level];
    }

    /**
     * Advance to next level
     * @returns {boolean} True if advanced, false if already at max level
     */
    nextLevel() {
        if (this.currentLevel < 5) {
            this.currentLevel++;
            this.resetStats();
            return true;
        }
        return false;
    }

    /**
     * Reset to level 1 (game over)
     */
    resetToLevel1() {
        this.currentLevel = 1;
        this.resetStats();
    }

    /**
     * Check if there are more levels
     */
    hasNextLevel() {
        return this.currentLevel < 5;
    }

    /**
     * Check if this is the final level
     */
    isFinalLevel() {
        return this.currentLevel === 5;
    }

    /**
     * Start tracking level statistics
     */
    startLevel() {
        this.stats.startTime = Date.now();
        this.stats.enemiesKilled = 0;
        this.stats.goldCollected = 0;
        this.stats.damageDealt = 0;
        this.stats.damageTaken = 0;
    }

    /**
     * End level and record end time
     */
    endLevel() {
        this.stats.endTime = Date.now();
    }

    /**
     * Get level completion time in seconds
     */
    getCompletionTime() {
        if (this.stats.startTime === 0) return 0;
        const endTime = this.stats.endTime || Date.now();
        return Math.floor((endTime - this.stats.startTime) / 1000);
    }

    /**
     * Get formatted time string (MM:SS)
     */
    getFormattedTime() {
        const totalSeconds = this.getCompletionTime();
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            enemiesKilled: 0,
            goldCollected: 0,
            startTime: 0,
            endTime: 0,
            damageDealt: 0,
            damageTaken: 0
        };
    }

    /**
     * Track enemy kill
     */
    addEnemyKill() {
        this.stats.enemiesKilled++;
    }

    /**
     * Track gold collection
     */
    addGold(amount = 1) {
        this.stats.goldCollected += amount;
    }

    /**
     * Track damage dealt
     */
    addDamageDealt(amount) {
        this.stats.damageDealt += amount;
    }

    /**
     * Track damage taken
     */
    addDamageTaken(amount) {
        this.stats.damageTaken += amount;
    }

    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            completionTime: this.getCompletionTime(),
            formattedTime: this.getFormattedTime()
        };
    }

    /**
     * Get total progress (1-5 levels)
     */
    getProgress() {
        return {
            current: this.currentLevel,
            total: 5,
            percentage: (this.currentLevel / 5) * 100
        };
    }
}
