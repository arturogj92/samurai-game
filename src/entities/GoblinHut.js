import Phaser from 'phaser';
import Enemy from './Enemy';

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
    constructor(scene, x, y) {
        // Start with full health sprite
        super(scene, x, y, 'goblin-house-1');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Building properties
        this.maxHealth = 210; // 7 states * 30 health each (reduced for faster transitions)
        this.health = this.maxHealth;
        this.isDestroyed = false; // Track if hut is destroyed
        this.currentState = 1; // Track current damage state (1-7)

        // Spawn properties
        this.spawnInterval = 10000; // 10 seconds
        this.goblinsPerSpawn = 2;
        this.lastSpawnTime = 0;
        this.nextSpawnTime = scene.time.now + this.spawnInterval;

        // Set up physics body with reduced hitbox
        this.body.setImmovable(true);
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

        // Set depth so it appears behind player
        this.setDepth(10);

        // Spawn initial guards (2 goblins + 1 lancer)
        this.spawnInitialGuards();

        console.log('🏠 GoblinHut created at', x, y);
    }

    /**
     * Spawn initial guard enemies (2 goblins + 1 lancer)
     */
    spawnInitialGuards() {
        const guardPositions = [
            { angle: 0, type: 'goblin' },      // Right
            { angle: Math.PI * 2/3, type: 'goblin' },  // Upper left
            { angle: Math.PI * 4/3, type: 'lancer' }   // Lower left
        ];

        const guardDistance = 120; // Distance from hut

        guardPositions.forEach(({ angle, type }) => {
            const guardX = this.x + Math.cos(angle) * guardDistance;
            const guardY = this.y + Math.sin(angle) * guardDistance;

            // Create guard enemy
            const guard = new Enemy(this.scene, guardX, guardY, type);
            guard.setAsGuard(this.x, this.y); // Mark as guard at hut position
            this.scene.enemies.add(guard);

            const guardName = type === 'lancer' ? '🗡️ Lancer' : '👹 Goblin';
            console.log(`${guardName} guard spawned at hut (${Math.floor(guardX)}, ${Math.floor(guardY)})`);
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
     * 30% chance to spawn a Lancer instead of a Goblin
     * Spawned enemies are guards and won't chase until player approaches
     */
    spawnGoblins() {
        for (let i = 0; i < this.goblinsPerSpawn; i++) {
            // Spawn enemies in a circle around the hut
            const angle = (Math.PI * 2 / this.goblinsPerSpawn) * i;
            const distance = 100; // Distance from hut
            const spawnX = this.x + Math.cos(angle) * distance;
            const spawnY = this.y + Math.sin(angle) * distance;

            // 30% chance to spawn a lancer, 70% chance to spawn a goblin
            const enemyType = Math.random() < 0.3 ? 'lancer' : 'goblin';

            // Create enemy
            const enemy = new Enemy(this.scene, spawnX, spawnY, enemyType);
            enemy.setAsGuard(this.x, this.y); // Mark as guard at hut position
            this.scene.enemies.add(enemy);

            const enemyName = enemyType === 'lancer' ? '🗡️ Lancer' : '👹 Goblin';
            console.log(`${enemyName} guard spawned from hut at (${Math.floor(spawnX)}, ${Math.floor(spawnY)})`);
        }

        // Reset spawn timer
        this.nextSpawnTime = this.scene.time.now + this.spawnInterval;
    }

    /**
     * Update spawn timer and progress bar
     */
    update(time) {
        // Don't spawn if destroyed
        if (this.isDestroyed) return;

        // Check if it's time to spawn
        if (time >= this.nextSpawnTime) {
            this.spawnGoblins();
        }

        // Update progress bar
        this.updateProgressBar();
    }

    /**
     * Clean up when destroyed
     */
    destroy() {
        if (this.progressBar) this.progressBar.destroy();
        if (this.progressBarBg) this.progressBarBg.destroy();

        console.log('💥 GoblinHut destroyed!');
        super.destroy();
    }
}
