import Phaser from 'phaser';
import Enemy from './Enemy';
import Shaman from './Shaman';
import Gnoll from './Gnoll';
import HarpoonFish from './HarpoonFish';

/**
 * GoblinHut - Building that spawns goblins
 *
 * Features:
 * - 7 damage states (Goblin_House_1 to Goblin_House_7)
 * - Spawns 2 goblins every 10 seconds
 * - Shows progress bar for spawn timer
 * - Can take damage and updates sprite accordingly
 */
export default class GoblinHut extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, spawnRateMultiplier = 1.0, fireRateMultiplier = 1.0, currentLevel = 1) {
        // Start with full health sprite
        super(scene, x, y, 'goblin-house-1');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Level configuration
        this.currentLevel = currentLevel;

        // Building properties
        this.maxHealth = 210; // 7 states * 30 health each (reduced for faster transitions)
        this.health = this.maxHealth;
        this.isDestroyed = false; // Track if hut is destroyed
        this.currentState = 1; // Track current damage state (1-7)

        // Spawn properties (apply level modifier)
        this.baseSpawnInterval = 10000; // 10 seconds base
        this.spawnInterval = this.baseSpawnInterval * spawnRateMultiplier;
        this.goblinsPerSpawn = 2;
        this.lastSpawnTime = 0;
        this.nextSpawnTime = scene.time.now + this.spawnInterval;

        // Attack properties (ballista shooting) (apply level modifier) (+10% difficulty)
        this.baseAttackCooldown = 2727; // Faster attacks (-10%)
        this.attackCooldown = this.baseAttackCooldown * fireRateMultiplier;
        this.attackRange = 400; // Detection range (slightly longer than player attack range ~350)
        this.lastAttackTime = 0;
        this.attackChargeProgress = 0; // 0 to 1
        this.baseBallistaArrowSpeed = 220; // Base speed for difficulty scaling
        this.ballistaArrowSpeed = this.baseBallistaArrowSpeed; // Faster but still dodgeable
        this.ballistaArrowScale = 1.2; // Slightly bigger than player arrow (was 1.6)
        this.ballistaArrowDamage = 33; // High damage (+10%)
        this.ballistaCritChance = 0.3; // 30% critical hit chance
        this.ballistaCritMultiplier = 2.0; // 2x damage on crit

        // Set up physics body with reduced hitbox
        this.body.setImmovable(true);
        this.body.moves = false; // Prevent physics engine from moving the hut
        this.setScale(1.0);

        // Reduce hitbox to 60% of sprite size (centered)
        const hitboxScale = 0.6;
        const newWidth = this.width * hitboxScale;
        const newHeight = this.height * hitboxScale;
        this.body.setSize(newWidth, newHeight);
        this.body.setOffset(
            (this.width - newWidth) / 2,
            (this.height - newHeight) / 2
        );

        // Create progress bar
        this.createProgressBar();

        // Set depth based on Y position for proper layering with player/enemies
        // GoblinHut sprite is ~200x200, use bottom position for depth sorting
        const spriteHeight = 200;
        const bottomY = y + (spriteHeight / 2);
        this.setDepth(bottomY);

        // Track spawned enemies for aggression system
        this.spawnedEnemies = [];

        // Spawn initial guards (2 goblins + 1 lancer)
        this.spawnInitialGuards();

        // Log spawn rates for this level
        const rates = this.calculateSpawnRates();
        console.log(`🏠 GoblinHut created at ${x}, ${y} (Level ${this.currentLevel})`);
        console.log(`   Spawn rates: Shaman ${(rates.shaman*100).toFixed(0)}%, Gnoll ${(rates.gnoll*100).toFixed(0)}%, HarpoonFish ${(rates.harpoonfish*100).toFixed(0)}%, Skull ${(rates.skull*100).toFixed(0)}%, Lancer ${(rates.lancer*100).toFixed(0)}%, Goblin ${(rates.goblin*100).toFixed(0)}%`);
    }

    /**
     * Calculate dynamic spawn rates based on current level
     * - Level 1: No Shaman/Gnoll/HarpoonFish
     * - Level 2+: Gnoll (8% base) + Shaman (5% base)
     * - Level 3+: HarpoonFish unlocked (3% base) - TOP TIER
     * - All scale +5% per level (HarpoonFish +3% per level)
     */
    calculateSpawnRates() {
        let shamanRate = 0;
        let gnollRate = 0;
        let harpoonFishRate = 0;

        // Shaman unlocks at level 2+ with low base
        if (this.currentLevel >= 2) {
            shamanRate = 0.05 + (this.currentLevel - 2) * 0.05; // 5% base + 5% per level
        }

        // Gnoll unlocks at level 2+
        if (this.currentLevel >= 2) {
            gnollRate = 0.08 + (this.currentLevel - 2) * 0.05; // 8% base + 5% per level
        }

        // HarpoonFish unlocks at level 3+ (TOP TIER)
        if (this.currentLevel >= 3) {
            harpoonFishRate = 0.03 + (this.currentLevel - 3) * 0.03; // 3% base + 3% per level
        }

        // Base rates for other enemies
        const skullRate = 0.07;  // 7% (constant)
        const lancerRate = 0.18; // 18% (constant)

        // Goblin gets whatever is left
        const goblinRate = 1.0 - shamanRate - gnollRate - harpoonFishRate - skullRate - lancerRate;

        return {
            shaman: shamanRate,
            gnoll: gnollRate,
            harpoonfish: harpoonFishRate,
            skull: skullRate,
            lancer: lancerRate,
            goblin: Math.max(0, goblinRate) // Ensure non-negative
        };
    }

    /**
     * Spawn initial guard enemies (mix of goblin, lancer, and rarely skull)
     */
    spawnInitialGuards() {
        // Don't spawn if game is paused (waiting for ability selection on level 1)
        if (!this.scene.gameState.playing) {
            console.log('⏸️ Skipping initial guard spawn - game is paused');
            this.needsInitialSpawn = true; // Flag to spawn later when game starts
            return;
        }

        const guardPositions = [
            { angle: 0, type: 'goblin' },      // Right
            { angle: Math.PI * 2/3, type: 'goblin' },  // Upper left
            { angle: Math.PI * 4/3, type: 'lancer' }   // Lower left
        ];

        // Get dynamic spawn rates for this level
        const rates = this.calculateSpawnRates();

        guardPositions.forEach(({ angle, type }) => {
            // Use dynamic rates based on level
            let finalType = type;
            let isShaman = false;
            let isGnoll = false;
            let isHarpoonFish = false;
            const roll = Math.random();

            // Cumulative probability check
            if (roll < rates.shaman) {
                finalType = 'shaman';
                isShaman = true;
            } else if (roll < rates.shaman + rates.gnoll) {
                finalType = 'gnoll';
                isGnoll = true;
            } else if (roll < rates.shaman + rates.gnoll + rates.harpoonfish) {
                finalType = 'harpoonfish';
                isHarpoonFish = true;
            } else if (roll < rates.shaman + rates.gnoll + rates.harpoonfish + rates.skull) {
                finalType = 'skull';
            } else if (roll < rates.shaman + rates.gnoll + rates.harpoonfish + rates.skull + rates.lancer) {
                finalType = 'lancer';
            } else {
                finalType = 'goblin';
            }

            // Start from HUT CENTER for dramatic ejection
            const startX = this.x;
            const startY = this.y;

            // Create guard enemy AT THE HUT CENTER - Shaman, Gnoll, and HarpoonFish use different classes
            let guard;
            if (isShaman) {
                guard = new Shaman(this.scene, startX, startY);
            } else if (isGnoll) {
                guard = new Gnoll(this.scene, startX, startY);
            } else if (isHarpoonFish) {
                guard = new HarpoonFish(this.scene, startX, startY);
            } else {
                guard = new Enemy(this.scene, startX, startY, finalType);
            }

            // Calculate final position after ejection (100-120 pixels away)
            const ejectionDistance = 100 + Math.random() * 20;
            const finalX = this.x + Math.cos(angle) * ejectionDistance;
            const finalY = this.y + Math.sin(angle) * ejectionDistance;

            // Make guard initially invisible/small
            guard.setScale(0.3);
            guard.setAlpha(0.5);

            // TWEEN to eject the guard OUT with dramatic effect
            this.scene.tweens.add({
                targets: guard,
                x: finalX,
                y: finalY,
                scale: 1.0,
                alpha: 1.0,
                duration: 600,
                ease: 'Back.easeOut' // Overshoot effect for dramatic look
            });

            // Add spawn explosion effect
            this.createSpawnExplosion(startX, startY, angle);

            // 5% chance to spawn as a HUNTER (long-range detection)
            const isHunter = Math.random() < 0.05;
            if (isHunter) {
                guard.setAsHunter(this.x, this.y);
            } else {
                guard.setAsGuard(this.x, this.y); // Normal guard
            }

            this.scene.enemies.add(guard);

            // Track this enemy for aggression system
            this.spawnedEnemies.push(guard);

            // Listen for enemy death to remove from tracking
            guard.once('destroy', () => {
                const index = this.spawnedEnemies.indexOf(guard);
                if (index > -1) {
                    this.spawnedEnemies.splice(index, 1);
                }
            });

            const guardName = finalType === 'shaman' ? '🔮 Shaman' : (finalType === 'skull' ? '💀 Skull' : (finalType === 'lancer' ? '🗡️ Lancer' : '👹 Goblin'));
            console.log(`${guardName} guard spawned at hut (ejected to ${Math.floor(finalX)}, ${Math.floor(finalY)})`);
        });
    }

    createProgressBar() {
        const barWidth = 120;
        const barHeight = 12;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 25; // Above the hut

        // Glow effect (drawn first, behind everything)
        this.progressBarGlow = this.scene.add.graphics();
        this.progressBarGlow.setDepth(99);

        // Background bar (dark with border)
        this.progressBarBg = this.scene.add.graphics();
        this.progressBarBg.setDepth(100);

        // Progress bar (dynamic color)
        this.progressBar = this.scene.add.graphics();
        this.progressBar.setDepth(101);

        // Store bar properties for updates
        this.barProps = {
            x: barX,
            y: barY,
            width: barWidth,
            height: barHeight
        };

        // Track last particle spawn time
        this.lastParticleTime = 0;

        // Create attack charge bar (above spawn progress bar)
        this.createAttackChargeBar();
    }

    /**
     * Create the attack charge bar (ballista charging)
     */
    createAttackChargeBar() {
        const barWidth = 100;
        const barHeight = 10;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 42; // Above the spawn bar

        // Background bar
        this.attackBarBg = this.scene.add.graphics();
        this.attackBarBg.setDepth(100);

        // Progress bar (red/orange for attack)
        this.attackBar = this.scene.add.graphics();
        this.attackBar.setDepth(101);

        // Glow effect for attack bar
        this.attackBarGlow = this.scene.add.graphics();
        this.attackBarGlow.setDepth(99);

        // Store bar properties for updates
        this.attackBarProps = {
            x: barX,
            y: barY,
            width: barWidth,
            height: barHeight
        };
    }

    updateProgressBar() {
        const now = this.scene.time.now;
        const elapsed = now - (this.nextSpawnTime - this.spawnInterval);
        const progress = Math.min(elapsed / this.spawnInterval, 1.0);

        // Dynamic color based on progress
        let barColor, glowColor;
        if (progress < 0.3) {
            // 0-30%: Dark green
            barColor = 0x00cc00;
            glowColor = 0x00ff00;
        } else if (progress < 0.7) {
            // 30-70%: Yellow/gold
            barColor = 0xffcc00;
            glowColor = 0xffff00;
        } else if (progress < 0.9) {
            // 70-90%: Orange
            barColor = 0xff8800;
            glowColor = 0xffaa00;
        } else {
            // 90-100%: Bright red
            barColor = 0xff0000;
            glowColor = 0xff3333;
        }

        // Apply shake when almost ready (>90%)
        let offsetX = 0;
        let offsetY = 0;
        if (progress > 0.9) {
            const shake = Math.sin(now / 100) * 2; // Subtle shake
            offsetY = shake;
        }

        // Clear all graphics
        this.progressBarGlow.clear();
        this.progressBarBg.clear();
        this.progressBar.clear();

        const barX = this.barProps.x + offsetX;
        const barY = this.barProps.y + offsetY;

        // Draw glow effect (larger, behind, semi-transparent)
        if (progress > 0.5) {
            const glowIntensity = (progress - 0.5) * 2; // 0 to 1
            this.progressBarGlow.fillStyle(glowColor, 0.3 * glowIntensity);
            this.progressBarGlow.fillRect(
                barX - 4,
                barY - 4,
                (this.barProps.width + 8) * progress,
                this.barProps.height + 8
            );
        }

        // Draw background with border
        this.progressBarBg.lineStyle(2, 0x666666, 1);
        this.progressBarBg.fillStyle(0x000000, 0.7);
        this.progressBarBg.fillRect(barX, barY, this.barProps.width, this.barProps.height);
        this.progressBarBg.strokeRect(barX, barY, this.barProps.width, this.barProps.height);

        // Draw progress bar with gradient effect
        this.progressBar.fillStyle(barColor, 0.9);
        this.progressBar.fillRect(
            barX + 2,
            barY + 2,
            (this.barProps.width - 4) * progress,
            this.barProps.height - 4
        );

        // Add highlight on top
        this.progressBar.fillStyle(0xffffff, 0.3);
        this.progressBar.fillRect(
            barX + 2,
            barY + 2,
            (this.barProps.width - 4) * progress,
            2 // Thin highlight
        );

        // Emit particles when >80%
        if (progress > 0.8 && now - this.lastParticleTime > 200) {
            this.emitProgressParticles(barX + this.barProps.width * progress, barY);
            this.lastParticleTime = now;
        }
    }

    /**
     * Update attack charge bar
     */
    updateAttackChargeBar() {
        const progress = this.attackChargeProgress;

        // Clear graphics
        this.attackBarGlow.clear();
        this.attackBarBg.clear();
        this.attackBar.clear();

        const barX = this.attackBarProps.x;
        const barY = this.attackBarProps.y;

        // Dynamic color based on progress
        let barColor, glowColor;
        if (progress < 0.5) {
            // 0-50%: Orange
            barColor = 0xff8800;
            glowColor = 0xffaa00;
        } else if (progress < 0.9) {
            // 50-90%: Red-orange
            barColor = 0xff4400;
            glowColor = 0xff6600;
        } else {
            // 90-100%: Bright red (ready to fire!)
            barColor = 0xff0000;
            glowColor = 0xff3333;
        }

        // Draw glow effect when charging
        if (progress > 0.3) {
            const glowIntensity = (progress - 0.3) / 0.7; // 0 to 1
            this.attackBarGlow.fillStyle(glowColor, 0.4 * glowIntensity);
            this.attackBarGlow.fillRect(
                barX - 3,
                barY - 3,
                (this.attackBarProps.width + 6) * progress,
                this.attackBarProps.height + 6
            );
        }

        // Draw background with border
        this.attackBarBg.lineStyle(2, 0x444444, 1);
        this.attackBarBg.fillStyle(0x000000, 0.8);
        this.attackBarBg.fillRect(barX, barY, this.attackBarProps.width, this.attackBarProps.height);
        this.attackBarBg.strokeRect(barX, barY, this.attackBarProps.width, this.attackBarProps.height);

        // Draw progress bar
        this.attackBar.fillStyle(barColor, 0.95);
        this.attackBar.fillRect(
            barX + 2,
            barY + 2,
            (this.attackBarProps.width - 4) * progress,
            this.attackBarProps.height - 4
        );

        // Add highlight on top when >50% charged
        if (progress > 0.5) {
            this.attackBar.fillStyle(0xffffff, 0.4);
            this.attackBar.fillRect(
                barX + 2,
                barY + 2,
                (this.attackBarProps.width - 4) * progress,
                2 // Thin highlight
            );
        }
    }

    /**
     * Emit small particles from progress bar when charging
     */
    emitProgressParticles(x, y) {
        for (let i = 0; i < 2; i++) {
            const particle = this.scene.add.circle(
                x + (Math.random() - 0.5) * 10,
                y + this.barProps.height / 2,
                2,
                0xffaa00
            );
            particle.setAlpha(0.8);
            particle.setDepth(102);

            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 20,
                x: particle.x + (Math.random() - 0.5) * 20,
                alpha: 0,
                scale: 0.3,
                duration: 600,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    /**
     * Take damage and update sprite based on health
     */
    takeDamage(amount) {
        this.health -= amount;
        this.health = Math.max(0, this.health);

        // Alert all spawned enemies when hut is attacked
        this.alertAllEnemies();

        // Show damage number
        if (this.scene.damageNumberSystem) {
            this.scene.damageNumberSystem.spawnDamageNumber(
                this.x,
                this.y - 30, // Offset up a bit from center
                Math.floor(amount),
                false, // not critical
                false  // not player damage
            );
        }

        // Calculate damage state (1 = full health, 7 = destroyed)
        const healthPercent = this.health / this.maxHealth;
        let state;

        if (healthPercent > 0.857) state = 1; // 100% - 86%
        else if (healthPercent > 0.714) state = 2; // 85% - 71%
        else if (healthPercent > 0.571) state = 3; // 70% - 57%
        else if (healthPercent > 0.428) state = 4; // 56% - 43%
        else if (healthPercent > 0.285) state = 5; // 42% - 29%
        else if (healthPercent > 0.142) state = 6; // 28% - 14%
        else state = 7; // 13% - 0% (destroyed)

        // Check if state changed (more damaged)
        if (state > this.currentState) {
            // State changed! Emit destruction particles
            this.emitDestructionParticles();
            this.currentState = state;
        }

        // Update sprite
        this.setTexture(`goblin-house-${state}`);

        // Flash red when damaged
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        // If destroyed, create explosion and drop gold
        if (this.health <= 0 && !this.isDestroyed) {
            this.isDestroyed = true;

            // Create big explosion effect
            this.createDestructionExplosion();

            // Drop 3-5 skulls
            const skullCount = Phaser.Math.Between(3, 5);
            this.dropSkulls(skullCount);

            // Hide progress bars immediately
            if (this.progressBar) {
                this.progressBar.destroy();
            }
            if (this.progressBarBg) {
                this.progressBarBg.destroy();
            }
            if (this.progressBarGlow) {
                this.progressBarGlow.destroy();
            }
            if (this.attackBar) {
                this.attackBar.destroy();
            }
            if (this.attackBarBg) {
                this.attackBarBg.destroy();
            }
            if (this.attackBarGlow) {
                this.attackBarGlow.destroy();
            }

            // Destroy the hut sprite after a short delay (for explosion to be visible)
            this.scene.time.delayedCall(500, () => {
                this.destroy();
            });

            console.log(`💥 GoblinHut destroyed! Dropping ${skullCount} skulls.`);
        }

        console.log(`🏠 GoblinHut damaged: ${Math.floor(this.health)}/${this.maxHealth} HP - State ${state}`);
    }

    /**
     * Create massive explosion effect when hut is completely destroyed
     */
    createDestructionExplosion() {
        // Massive explosion flash
        const explosion = this.scene.add.circle(this.x, this.y, 40, 0xffffff, 0.9);
        explosion.setDepth(100);

        this.scene.tweens.add({
            targets: explosion,
            scale: 6,
            alpha: 0,
            duration: 600,
            ease: 'Power3',
            onComplete: () => explosion.destroy()
        });

        // Multiple expanding rings (orange/red/yellow)
        const colors = [0xff0000, 0xff6600, 0xffaa00, 0xffff00];
        for (let i = 0; i < 4; i++) {
            const ring = this.scene.add.graphics();
            ring.lineStyle(4, colors[i], 0.8);
            ring.strokeCircle(this.x, this.y, 20 + i * 10);
            ring.setDepth(99);

            this.scene.tweens.add({
                targets: ring,
                scaleX: 5,
                scaleY: 5,
                alpha: 0,
                duration: 700,
                delay: i * 50,
                ease: 'Power2',
                onComplete: () => ring.destroy()
            });
        }

        // Lots of debris particles
        const debrisCount = 30;
        for (let i = 0; i < debrisCount; i++) {
            const angle = (Math.PI * 2 / debrisCount) * i + (Math.random() - 0.5) * 0.5;
            const speed = 100 + Math.random() * 200;
            const size = 4 + Math.random() * 8;

            // Brown/gray debris
            const debris = this.scene.add.rectangle(
                this.x,
                this.y,
                size,
                size,
                Math.random() > 0.5 ? 0x8B4513 : 0x696969
            );
            debris.setAlpha(0.9);
            debris.setDepth(98);

            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 100; // Bias upward

            this.scene.tweens.add({
                targets: debris,
                x: debris.x + vx,
                y: debris.y + vy,
                angle: Math.random() * 360,
                alpha: 0,
                duration: 1000 + Math.random() * 500,
                ease: 'Cubic.easeOut',
                onComplete: () => debris.destroy()
            });
        }

        // Fire particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const fireColors = [0xff0000, 0xff6600, 0xffaa00];
            const color = fireColors[Math.floor(Math.random() * fireColors.length)];

            const fire = this.scene.add.circle(
                this.x,
                this.y,
                5 + Math.random() * 10,
                color
            );
            fire.setAlpha(0.8);
            fire.setDepth(97);

            this.scene.tweens.add({
                targets: fire,
                x: this.x + Math.cos(angle) * distance,
                y: this.y + Math.sin(angle) * distance - 60,
                scale: 0.2,
                alpha: 0,
                duration: 600 + Math.random() * 400,
                ease: 'Power2',
                onComplete: () => fire.destroy()
            });
        }

        // Screen flash
        const flash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xff6600,
            0.5
        );
        flash.setScrollFactor(0);
        flash.setDepth(1000);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => flash.destroy()
        });

        // Camera shake
        this.scene.cameras.main.shake(400, 0.012);
    }

    /**
     * Drop skulls when hut is destroyed (same as enemy skulls)
     */
    dropSkulls(count) {
        for (let i = 0; i < count; i++) {
            // Random position around the hut (scattered)
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.8;
            const distance = 50 + Math.random() * 60;
            const skullX = this.x + Math.cos(angle) * distance;
            const skullY = this.y + Math.sin(angle) * distance;

            // Create skull sprite with physics (same as Enemy.js)
            const skull = this.scene.physics.add.sprite(skullX, skullY, 'death-skull', 0);
            this.scene.skulls.add(skull);

            skull.setScale(1.0); // Same as enemy skulls
            skull.setDepth(0); // Ground level
            skull.body.setSize(80, 80); // Same hitbox as enemy skulls
            skull.body.setOffset(24, 24); // Center the hitbox

            // Play the bouncing skull animation
            skull.play('death-skull-bounce');

            // When animation completes, make it collectible
            skull.once('animationcomplete', () => {
                skull.setFrame(6); // Last frame (settled)
                skull.setData('collectible', true);
            });
        }
    }

    /**
     * Emit smoke/destruction particles when hut takes significant damage
     */
    emitDestructionParticles() {
        // Create temporary particles using graphics
        const particleCount = 8;

        for (let i = 0; i < particleCount; i++) {
            // Random angle for particle direction
            const angle = (Math.PI * 2 / particleCount) * i + (Math.random() - 0.5) * 0.5;
            const speed = 50 + Math.random() * 100;

            // Create particle graphic (small brown/gray square for debris)
            const particle = this.scene.add.rectangle(
                this.x,
                this.y,
                8,
                8,
                Math.random() > 0.5 ? 0x8B4513 : 0x696969 // Brown or gray
            );
            particle.setAlpha(0.8);
            particle.setDepth(50);

            // Velocity
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 50; // Bias upward

            // Animate particle
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + vx,
                y: particle.y + vy,
                alpha: 0,
                scale: 0.3,
                duration: 800,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // Add some smoke puffs
        for (let i = 0; i < 3; i++) {
            const smoke = this.scene.add.circle(
                this.x + (Math.random() - 0.5) * 40,
                this.y + (Math.random() - 0.5) * 40,
                10,
                0x666666
            );
            smoke.setAlpha(0.5);
            smoke.setDepth(45);

            this.scene.tweens.add({
                targets: smoke,
                y: smoke.y - 80,
                scale: 2.5,
                alpha: 0,
                duration: 1200,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    smoke.destroy();
                }
            });
        }
    }

    /**
     * Spawn goblins at this hut's location
     * 10% skull, 25% lancer, 65% goblin
     * Spawned enemies are guards and won't chase until player approaches
     */
    spawnGoblins() {
        // PERFORMANCE: Check if we can spawn (respects global enemy limit)
        if (!this.scene.canSpawnEnemy()) {
            console.log(`⚠️ Hut spawn blocked - MAX_ENEMIES (${this.scene.MAX_ENEMIES}) reached`);
            // Reset timer to try again later
            this.nextSpawnTime = this.scene.time.now + this.spawnInterval;
            return;
        }

        let spawnedCount = 0;
        for (let i = 0; i < this.goblinsPerSpawn; i++) {
            // Check limit before each spawn (in case we hit limit mid-spawn)
            if (!this.scene.canSpawnEnemy()) {
                console.log(`⚠️ Spawned ${spawnedCount}/${this.goblinsPerSpawn} - hit enemy limit`);
                break;
            }

            // Calculate spawn angle
            const baseAngle = (Math.PI * 2 / this.goblinsPerSpawn) * i;
            // Add random angle offset of ±45 degrees to prevent exact overlap
            const angleOffset = (Math.random() - 0.5) * (Math.PI / 2);
            const angle = baseAngle + angleOffset;

            // Get dynamic spawn rates for this level
            const rates = this.calculateSpawnRates();

            // Determine enemy type using dynamic rates
            let enemyType;
            let isShaman = false;
            let isGnoll = false;
            let isHarpoonFish = false;
            const roll = Math.random();

            // Cumulative probability check
            if (roll < rates.shaman) {
                enemyType = 'shaman';
                isShaman = true;
            } else if (roll < rates.shaman + rates.gnoll) {
                enemyType = 'gnoll';
                isGnoll = true;
            } else if (roll < rates.shaman + rates.gnoll + rates.harpoonfish) {
                enemyType = 'harpoonfish';
                isHarpoonFish = true;
            } else if (roll < rates.shaman + rates.gnoll + rates.harpoonfish + rates.skull) {
                enemyType = 'skull';
            } else if (roll < rates.shaman + rates.gnoll + rates.harpoonfish + rates.skull + rates.lancer) {
                enemyType = 'lancer';
            } else {
                enemyType = 'goblin';
            }

            // Start from HUT CENTER for dramatic ejection
            const startX = this.x;
            const startY = this.y;

            // Create enemy AT THE HUT CENTER - Shaman, Gnoll, and HarpoonFish use different classes
            let enemy;
            if (isShaman) {
                enemy = new Shaman(this.scene, startX, startY);
            } else if (isGnoll) {
                enemy = new Gnoll(this.scene, startX, startY);
            } else if (isHarpoonFish) {
                enemy = new HarpoonFish(this.scene, startX, startY);
            } else {
                enemy = new Enemy(this.scene, startX, startY, enemyType);
            }

            // Calculate final position after ejection (100-120 pixels away)
            const ejectionDistance = 100 + Math.random() * 20;
            const finalX = this.x + Math.cos(angle) * ejectionDistance;
            const finalY = this.y + Math.sin(angle) * ejectionDistance;

            // Make enemy initially invisible/small
            enemy.setScale(0.3);
            enemy.setAlpha(0.5);

            // TWEEN to eject the enemy OUT with dramatic effect
            this.scene.tweens.add({
                targets: enemy,
                x: finalX,
                y: finalY,
                scale: 1.0,
                alpha: 1.0,
                duration: 600,
                ease: 'Back.easeOut' // Overshoot effect for dramatic look
            });

            // Add spawn explosion effect
            this.createSpawnExplosion(startX, startY, angle);

            // 5% chance to spawn as a HUNTER (long-range detection)
            const isHunter = Math.random() < 0.05;
            if (isHunter) {
                enemy.setAsHunter(this.x, this.y);
            } else {
                enemy.setAsGuard(this.x, this.y); // Normal guard
            }

            this.scene.enemies.add(enemy);
            spawnedCount++;

            // Track this enemy for aggression system
            this.spawnedEnemies.push(enemy);

            // Listen for enemy death to remove from tracking
            enemy.once('destroy', () => {
                const index = this.spawnedEnemies.indexOf(enemy);
                if (index > -1) {
                    this.spawnedEnemies.splice(index, 1);
                }
            });

            const enemyName = enemyType === 'shaman' ? '🔮 Shaman' : (enemyType === 'gnoll' ? '🦴 Gnoll' : (enemyType === 'harpoonfish' ? '🔱 HarpoonFish' : (enemyType === 'skull' ? '💀 Skull' : (enemyType === 'lancer' ? '🗡️ Lancer' : '👹 Goblin'))));
            console.log(`${enemyName} guard spawned from hut (ejected to ${Math.floor(finalX)}, ${Math.floor(finalY)})`);
        }

        // Reset spawn timer
        this.nextSpawnTime = this.scene.time.now + this.spawnInterval;
    }

    /**
     * Alert all spawned enemies to attack the player
     * Called when the hut is attacked
     */
    alertAllEnemies() {
        if (!this.scene.player) return;

        let alertedCount = 0;
        this.spawnedEnemies.forEach(enemy => {
            if (enemy && enemy.active && !enemy.isDying) {
                // Make enemy aggressive (activate guards and force them to chase)
                if (enemy.setAggressive) {
                    enemy.setAggressive(this.scene.player.x, this.scene.player.y);
                    alertedCount++;
                }
            }
        });

        if (alertedCount > 0) {
            console.log(`🚨 ALERT! ${alertedCount} enemies from hut are now aggressive!`);
        }
    }

    /**
     * Fire a ballista arrow at the player with predictive aiming
     */
    fireBallistaArrow() {
        // Import Projectile class
        const Projectile = this.scene.projectiles.classType;

        // Calculate angle to player
        const player = this.scene.player;
        if (!player || !player.active) return;

        // Use difficulty system for predictive aim (if available)
        let angle;
        let aimPoint;
        if (this.scene.difficultySystem) {
            // Apply difficulty scaling to projectile speed
            const difficulty = this.scene.difficultySystem.getCurrentDifficulty();
            this.ballistaArrowSpeed = this.baseBallistaArrowSpeed * difficulty.speedMultiplier;

            // Calculate predictive aim
            aimPoint = this.scene.difficultySystem.calculatePredictiveAim(
                this.x,
                this.y,
                player,
                this.ballistaArrowSpeed
            );
            angle = aimPoint.angle;

            // Log aiming details on critical
            if (Math.random() < this.ballistaCritChance) {
                console.log(`🎯 Ballista predictive aim: accuracy=${(aimPoint.accuracy * 100).toFixed(0)}%, prediction=${(aimPoint.prediction * 100).toFixed(0)}%`);
            }
        } else {
            // Fallback to direct aim
            angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        }

        // Create ballista arrow at hut position
        const projectile = new Projectile(
            this.scene,
            this.x,
            this.y,
            'arrow'
        );

        // Add to group for tracking
        this.scene.projectiles.add(projectile);

        // Set frame 0 (flying arrow)
        projectile.setFrame(0);

        // Check for critical hit
        const isCritical = Math.random() < this.ballistaCritChance;
        const finalDamage = isCritical ? this.ballistaArrowDamage * this.ballistaCritMultiplier : this.ballistaArrowDamage;

        // Make it thicker and faster
        projectile.setScale(this.ballistaArrowScale);
        projectile.damage = finalDamage;
        projectile.isCritical = isCritical;

        // Set velocity
        const velocityX = Math.cos(angle) * this.ballistaArrowSpeed;
        const velocityY = Math.sin(angle) * this.ballistaArrowSpeed;
        projectile.setVelocity(velocityX, velocityY);

        // Rotate arrow to point in direction of movement
        projectile.rotation = angle;

        // Mark as enemy projectile (so it doesn't hit enemies)
        projectile.isEnemyProjectile = true;

        // Apply distinct visual based on critical or normal
        if (isCritical) {
            // CRITICAL: Bigger size with glowing arrow effect
            projectile.setScale(this.ballistaArrowScale * 1.3); // 30% bigger for crits

            // Make the arrow itself glow white
            projectile.setTint(0xFFFFFF);
            projectile.setBlendMode(Phaser.BlendModes.ADD); // Glow effect

            // Add pulsing animation to the arrow itself
            this.scene.tweens.add({
                targets: projectile,
                alpha: { from: 1.0, to: 0.7 },
                duration: 200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        } else {
            // NORMAL: Standard size, no effects
            projectile.setScale(this.ballistaArrowScale);
            projectile.clearTint();
            projectile.setBlendMode(Phaser.BlendModes.NORMAL);
        }

        const critText = isCritical ? ' 💥 CRITICAL!' : '';
        console.log(`🏹 GoblinHut fired ballista arrow at player (damage: ${finalDamage})${critText}`);

        // Reset attack charge
        this.attackChargeProgress = 0;
        this.lastAttackTime = this.scene.time.now;
    }

    /**
     * Update spawn timer and progress bar
     */
    update(time) {
        // Don't spawn if destroyed
        if (this.isDestroyed) return;

        // CRITICAL: Don't spawn or attack if game is paused (menu open, ability selection, etc.)
        if (!this.scene.gameState.playing) {
            return; // Completely pause hut activity
        }

        // Check if it's time to spawn
        if (time >= this.nextSpawnTime) {
            this.spawnGoblins();
        }

        // Update progress bar
        this.updateProgressBar();

        // Update attack system
        this.updateAttackSystem(time);

        // Update attack charge bar
        this.updateAttackChargeBar();
    }

    /**
     * Update attack system - detect player and charge ballista
     */
    updateAttackSystem(time) {
        const player = this.scene.player;
        if (!player || !player.active) {
            // Reset charge if player is gone
            this.attackChargeProgress = 0;
            return;
        }

        // Calculate distance to player
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Check if player is in range
        if (distance <= this.attackRange) {
            // Player in range, charge the attack
            const timeSinceLastAttack = time - this.lastAttackTime;

            // Calculate charge progress (0 to 1)
            this.attackChargeProgress = Math.min(timeSinceLastAttack / this.attackCooldown, 1.0);

            // Fire when fully charged
            if (this.attackChargeProgress >= 1.0) {
                this.fireBallistaArrow();
            }
        } else {
            // Player out of range, reset charge slowly
            this.attackChargeProgress = Math.max(0, this.attackChargeProgress - 0.02);
        }
    }

    /**
     * Create visual explosion effect when enemy spawns
     */
    createSpawnExplosion(x, y, angle) {
        // Flash at spawn point
        const flash = this.scene.add.circle(x, y, 15, 0xff6600, 0.8);
        flash.setDepth(100);

        this.scene.tweens.add({
            targets: flash,
            scale: 2.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Smoke puff
        const smoke = this.scene.add.circle(x, y, 10, 0x666666, 0.6);
        smoke.setDepth(99);

        this.scene.tweens.add({
            targets: smoke,
            y: smoke.y - 30,
            scale: 2.0,
            alpha: 0,
            duration: 500,
            ease: 'Sine.easeOut',
            onComplete: () => smoke.destroy()
        });

        // Directional particles (shoot out in ejection direction)
        for (let i = 0; i < 5; i++) {
            const particleAngle = angle + (Math.random() - 0.5) * 0.4;
            const speed = 50 + Math.random() * 50;

            const particle = this.scene.add.circle(x, y, 3, 0xff8800, 0.9);
            particle.setDepth(98);

            const vx = Math.cos(particleAngle) * speed;
            const vy = Math.sin(particleAngle) * speed;

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + vx,
                y: particle.y + vy,
                alpha: 0,
                scale: 0.2,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Clean up when destroyed
     */
    destroy() {
        if (this.progressBar) this.progressBar.destroy();
        if (this.progressBarBg) this.progressBarBg.destroy();
        if (this.progressBarGlow) this.progressBarGlow.destroy();
        if (this.attackBar) this.attackBar.destroy();
        if (this.attackBarBg) this.attackBarBg.destroy();
        if (this.attackBarGlow) this.attackBarGlow.destroy();

        console.log('💥 GoblinHut destroyed!');
        super.destroy();
    }
}
