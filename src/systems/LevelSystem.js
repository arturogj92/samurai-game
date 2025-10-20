/**
 * LevelSystem - Manages level progression and difficulty scaling
 *
 * Features:
 * - 5 preset levels with increasing difficulty
 * - INFINITE procedurally generated levels after level 5
 * - Progressive increase in hut count, spawn rate, and fire rate
 * - Level statistics tracking
 */
export default class LevelSystem {
    constructor() {
        // Current level (1 to infinity!)
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
                hutCount: 1,                      // Tutorial level
                spawnRateMultiplier: 1.0,         // Base spawn rate
                fireRateMultiplier: 1.0,          // Base fire rate
                enemySpeedMultiplier: 1.0,        // Normal enemy speed
                enemyAttackRateMultiplier: 1.0,   // Normal attack rate
                potionDropRate: 0.08,             // 8% potion drop
                description: "Survive the first assault"
            },
            2: {
                level: 2,
                name: "Growing Threat",
                hutCount: 2,                      // 🎯 Still easy, just more targets
                spawnRateMultiplier: 1.0,         // Same spawn rate
                fireRateMultiplier: 1.0,          // Same fire rate
                enemySpeedMultiplier: 1.0,        // Normal enemy speed
                enemyAttackRateMultiplier: 1.0,   // Normal attack rate
                potionDropRate: 0.08,             // 8% potion drop
                description: "More huts to defend against"
            },
            3: {
                level: 3,
                name: "Rising Danger",
                hutCount: 2,                      // 🎯 Keep at 2 huts for smoother curve (was 3)
                spawnRateMultiplier: 0.85,        // 🎯 15% faster spawns (was 0.7 = too hard)
                fireRateMultiplier: 0.9,          // 🎯 10% faster shooting (was 0.8 = too hard)
                enemySpeedMultiplier: 1.0,        // Normal enemy speed
                enemyAttackRateMultiplier: 1.0,   // Normal attack rate
                potionDropRate: 0.08,             // 8% potion drop
                description: "Enemies spawn and attack faster"
            },
            4: {
                level: 4,
                name: "Overwhelming Force",
                hutCount: 3,                      // 🎯 Now 3 huts (was 4)
                spawnRateMultiplier: 0.7,         // 🎯 30% faster spawns (was 0.5)
                fireRateMultiplier: 0.75,         // 🎯 25% faster shooting (was 0.6)
                enemySpeedMultiplier: 1.0,        // Normal enemy speed
                enemyAttackRateMultiplier: 1.0,   // Normal attack rate
                potionDropRate: 0.08,             // 8% potion drop
                description: "The horde intensifies"
            },
            5: {
                level: 5,
                name: "Final Stand",
                hutCount: 4,                      // Max huts for final challenge
                spawnRateMultiplier: 0.5,         // 🎯 50% faster spawns (was 0.2 = insane)
                fireRateMultiplier: 0.6,          // 🎯 40% faster shooting (was 0.4)
                enemySpeedMultiplier: 1.0,        // Normal enemy speed
                enemyAttackRateMultiplier: 1.0,   // Normal attack rate
                potionDropRate: 0.08,             // 8% potion drop
                description: "Survive the ultimate challenge"
            }
        };
    }

    /**
     * Get configuration for current level
     * Generates procedural configs for levels 6+
     */
    getCurrentLevelConfig() {
        // If level 1-5, return predefined config
        if (this.currentLevel <= 5) {
            return this.levelConfigs[this.currentLevel];
        }

        // Generate procedural config for levels 6+
        return this.generateProceduralLevel(this.currentLevel);
    }

    /**
     * Generate procedural level config for infinite levels (6+)
     * Difficulty scales progressively with each level
     */
    generateProceduralLevel(level) {
        // Base difficulty from level 5
        const baseDifficulty = this.levelConfigs[5];

        // Calculate how many levels past 5 we are
        const levelsAbove5 = level - 5;

        // Hut count: Start at 4, add 1 every 2 levels (max 5 huts due to positioning)
        const hutCount = Math.min(5, 4 + Math.floor(levelsAbove5 / 2));

        // Spawn rate: Get progressively faster (lower = faster)
        // Level 6: 0.45, Level 7: 0.40, Level 8: 0.35, etc.
        // Minimum: 0.15 (crazy fast but not impossible)
        const spawnRateMultiplier = Math.max(0.15, 0.5 - (levelsAbove5 * 0.05));

        // Fire rate: Get progressively faster (lower = faster)
        // Level 6: 0.55, Level 7: 0.50, Level 8: 0.45, etc.
        // Minimum: 0.20 (very fast but manageable)
        const fireRateMultiplier = Math.max(0.20, 0.6 - (levelsAbove5 * 0.05));

        // Enemy speed: Increases 2% per level from level 6
        // Level 6: 1.02x, Level 7: 1.04x, Level 8: 1.06x, etc.
        // Maximum: 1.50x (50% faster at level 30+)
        const enemySpeedMultiplier = Math.min(1.50, 1.0 + (levelsAbove5 * 0.02));

        // Enemy attack rate: Attacks get faster (lower = faster)
        // Level 6: 0.95x, Level 7: 0.90x, Level 8: 0.85x, etc.
        // Minimum: 0.50x (attacks twice as fast at level 15+)
        const enemyAttackRateMultiplier = Math.max(0.50, 1.0 - (levelsAbove5 * 0.05));

        // Potion drop rate: Decreases with higher levels
        // Level 6: 7.2%, Level 7: 6.4%, Level 8: 5.6%, etc.
        // Minimum: 3% (still gives some healing at high levels)
        const potionDropRate = Math.max(0.03, 0.08 - (levelsAbove5 * 0.008));

        return {
            level: level,
            name: `Endless Wave ${levelsAbove5}`,
            hutCount: hutCount,
            spawnRateMultiplier: spawnRateMultiplier,
            fireRateMultiplier: fireRateMultiplier,
            enemySpeedMultiplier: enemySpeedMultiplier,
            enemyAttackRateMultiplier: enemyAttackRateMultiplier,
            potionDropRate: potionDropRate,
            description: `Survive the ${this.getOrdinal(levelsAbove5)} endless wave`
        };
    }

    /**
     * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
     */
    getOrdinal(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    /**
     * Get configuration for a specific level
     */
    getLevelConfig(level) {
        // If level 1-5, return predefined config
        if (level <= 5) {
            return this.levelConfigs[level];
        }

        // Generate procedural config for levels 6+
        return this.generateProceduralLevel(level);
    }

    /**
     * Advance to next level
     * @returns {boolean} Always true (infinite levels!)
     */
    nextLevel() {
        this.currentLevel++;
        this.resetStats();
        return true;
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
        return true; // Always true - infinite levels!
    }

    /**
     * Check if this is the final level
     */
    isFinalLevel() {
        return false; // Never final - infinite levels!
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
