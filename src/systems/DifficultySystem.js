/**
 * DifficultySystem - Progressive difficulty scaling system
 *
 * Features:
 * - Scales enemy accuracy, fire rate, and projectile speed based on level
 * - Provides predictive aiming calculations for smart enemies
 * - Adds variability to keep combat interesting
 */
export default class DifficultySystem {
    constructor(scene) {
        this.scene = scene;

        // Difficulty tiers based on level
        this.getCurrentDifficulty = this.getCurrentDifficulty.bind(this);
    }

    /**
     * Get current difficulty configuration based on level
     * @returns {Object} Difficulty settings
     */
    getCurrentDifficulty() {
        const level = this.scene.levelSystem?.currentLevel || 1;

        // Base difficulty settings - 🎯 Nerfed for friendlier early game
        const baseDifficulty = {
            // Accuracy: 0-1 (0 = can't hit, 1 = perfect aim)
            baseAccuracy: 0.2,           // 🎯 Level 1: 20% accuracy (was 30%, now easier!)
            maxAccuracy: 0.75,           // 🎯 Level 10+: 75% accuracy (was 85%, nerfed!)

            // Prediction: 0-1 (how far ahead enemy predicts player movement)
            basePrediction: 0.0,         // Level 1: no prediction (unchanged)
            maxPrediction: 0.7,          // 🎯 Level 10+: 70% prediction (was 90%, nerfed!)

            // Fire rate multiplier (lower = faster)
            baseFireRateMultiplier: 1.2, // Level 1: 20% slower
            minFireRateMultiplier: 0.7,  // Level 10+: 30% faster

            // Projectile speed multiplier
            baseSpeedMultiplier: 0.8,    // Level 1: 20% slower
            maxSpeedMultiplier: 1.3,     // Level 10+: 30% faster
        };

        // Scale values based on level (1-10 scale, then caps at level 10)
        const levelScale = Math.min(level - 1, 9) / 9; // 0 at level 1, 1 at level 10+

        return {
            level: level,

            // Accuracy increases with level
            accuracy: baseDifficulty.baseAccuracy +
                     (baseDifficulty.maxAccuracy - baseDifficulty.baseAccuracy) * levelScale,

            // Prediction increases with level
            prediction: baseDifficulty.basePrediction +
                       (baseDifficulty.maxPrediction - baseDifficulty.basePrediction) * levelScale,

            // Fire rate multiplier decreases (faster shooting)
            fireRateMultiplier: baseDifficulty.baseFireRateMultiplier -
                               (baseDifficulty.baseFireRateMultiplier - baseDifficulty.minFireRateMultiplier) * levelScale,

            // Speed multiplier increases
            speedMultiplier: baseDifficulty.baseSpeedMultiplier +
                            (baseDifficulty.maxSpeedMultiplier - baseDifficulty.baseSpeedMultiplier) * levelScale
        };
    }

    /**
     * Calculate predictive aim point for shooting at player
     * Takes into account player velocity and distance
     *
     * @param {number} shooterX - Shooter's X position
     * @param {number} shooterY - Shooter's Y position
     * @param {Object} target - Target object (player)
     * @param {number} projectileSpeed - Speed of projectile
     * @param {number} accuracyOverride - Optional accuracy override (0-1)
     * @returns {Object} {x, y, angle} - Predicted aim point and angle
     */
    calculatePredictiveAim(shooterX, shooterY, target, projectileSpeed, accuracyOverride = null) {
        if (!target || !target.active) {
            // No target, aim straight
            return {
                x: shooterX + 100,
                y: shooterY,
                angle: 0
            };
        }

        const difficulty = this.getCurrentDifficulty();
        const accuracy = accuracyOverride !== null ? accuracyOverride : difficulty.accuracy;
        const prediction = difficulty.prediction;

        // Get player position and velocity
        const targetX = target.x;
        const targetY = target.y;
        const targetVelX = target.body?.velocity.x || 0;
        const targetVelY = target.body?.velocity.y || 0;

        // Calculate distance to target
        const distance = Phaser.Math.Distance.Between(shooterX, shooterY, targetX, targetY);

        // Calculate time for projectile to reach current target position
        const timeToImpact = distance / projectileSpeed;

        // Predict where player will be (scaled by prediction factor)
        const predictedX = targetX + (targetVelX * timeToImpact * prediction);
        const predictedY = targetY + (targetVelY * timeToImpact * prediction);

        // Add inaccuracy (random spread)
        // Lower accuracy = higher spread
        const spreadAmount = (1 - accuracy) * 150; // Max spread of 150 pixels at 0% accuracy
        const spreadX = (Math.random() - 0.5) * spreadAmount;
        const spreadY = (Math.random() - 0.5) * spreadAmount;

        // Final aim point
        const aimX = predictedX + spreadX;
        const aimY = predictedY + spreadY;

        // Calculate angle to aim point
        const angle = Phaser.Math.Angle.Between(shooterX, shooterY, aimX, aimY);

        return {
            x: aimX,
            y: aimY,
            angle: angle,
            prediction: prediction,
            accuracy: accuracy
        };
    }

    /**
     * Apply difficulty modifiers to enemy stats
     * @param {Object} enemy - Enemy object
     */
    applyDifficultyModifiers(enemy) {
        const difficulty = this.getCurrentDifficulty();

        // Apply fire rate modifier if enemy has attack cooldown
        if (enemy.baseAttackCooldown) {
            enemy.attackCooldown = enemy.baseAttackCooldown * difficulty.fireRateMultiplier;
        }

        // Apply speed modifier if enemy has projectile speed
        if (enemy.baseProjectileSpeed) {
            enemy.projectileSpeed = enemy.baseProjectileSpeed * difficulty.speedMultiplier;
        }
    }

    /**
     * Get difficulty description for UI/logging
     * @returns {string} Difficulty tier name
     */
    getDifficultyTier() {
        const level = this.scene.levelSystem?.currentLevel || 1;

        if (level <= 2) return 'Beginner';
        if (level <= 4) return 'Moderate';
        if (level <= 6) return 'Challenging';
        if (level <= 8) return 'Hard';
        return 'Expert';
    }

    /**
     * Get player power scaling bonuses based on level
     * As levels get harder, player also gets stronger!
     * @returns {Object} Player bonuses
     */
    getPlayerPowerScaling() {
        const level = this.scene.levelSystem?.currentLevel || 1;

        // Progressive power bonuses per level
        // Level 1: No bonus (base stats)
        // Level 2: +5% damage, +5% fire rate
        // Level 3: +10% damage, +10% fire rate
        // Level 4: +15% damage, +15% fire rate
        // Level 5: +20% damage, +20% fire rate
        const bonusPerLevel = 0.05; // 5% per level
        const scalingMultiplier = Math.max(0, (level - 1) * bonusPerLevel);

        return {
            level: level,
            damageBonus: scalingMultiplier,     // 0%, 5%, 10%, 15%, 20%
            fireRateBonus: scalingMultiplier    // 0%, 5%, 10%, 15%, 20%
        };
    }

    /**
     * Log current difficulty settings (for debugging)
     */
    logDifficulty() {
        const difficulty = this.getCurrentDifficulty();
        const playerPower = this.getPlayerPowerScaling();

        console.log('⚙️ Difficulty System - Level', difficulty.level);
        console.log('   Tier:', this.getDifficultyTier());
        console.log('   Enemy Accuracy:', `${(difficulty.accuracy * 100).toFixed(0)}%`);
        console.log('   Enemy Prediction:', `${(difficulty.prediction * 100).toFixed(0)}%`);
        console.log('   Enemy Fire Rate:', `${(difficulty.fireRateMultiplier * 100).toFixed(0)}%`);
        console.log('   Enemy Speed:', `${(difficulty.speedMultiplier * 100).toFixed(0)}%`);
        console.log('🔥 Player Power Scaling:');
        console.log('   Damage Bonus:', `+${(playerPower.damageBonus * 100).toFixed(0)}%`);
        console.log('   Fire Rate Bonus:', `+${(playerPower.fireRateBonus * 100).toFixed(0)}%`);
    }
}
