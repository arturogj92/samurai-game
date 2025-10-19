import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'goblin') {
        super(scene, x, y, 'goblin-torch', 0);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.enemyType = type;
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 80; // Slower than player
        this.damage = 10;
        this.attackCooldown = 1000; // ms
        this.lastAttackTime = 0;

        // Setup physics
        this.setCollideWorldBounds(true);
        this.setScale(0.75); // Scale down from 192 to ~144

        // Very small hitbox - just the body/torso (sprite is 192x192)
        this.body.setSize(35, 50); // Very tight hitbox around character body
        this.body.setOffset(78, 90); // Center on the character's torso (adjusted for 192x192)

        // Create animations for this enemy
        this.createAnimations();

        // Start with idle animation
        this.play(`${type}-idle-anim`);

        // State
        this.isDying = false;
        this.deathStartTime = 0;

        // Debug: Create hitbox visualization (will be drawn in update)
        // DISABLED for now - causing errors
        // this.debugGraphics = scene.add.graphics();
    }

    createAnimations() {
        const type = this.enemyType;

        // Goblin Torch spritesheet animations
        // Spritesheet is 7 columns x 5 rows, 192x192 frames
        // Row 0 (0-6): Idle
        // Row 1 (7-13): Walk
        // Row 2 (14-20): Attack

        // Only create animations if they don't exist yet
        if (!this.scene.anims.exists(`${type}-idle-anim`)) {
            // Idle (Row 0)
            this.scene.anims.create({
                key: `${type}-idle-anim`,
                frames: this.scene.anims.generateFrameNumbers('goblin-torch', { start: 0, end: 6 }),
                frameRate: 6,
                repeat: -1
            });
        }

        if (!this.scene.anims.exists(`${type}-walk-anim`)) {
            // Walk (Row 1) - only 6 frames (7-12), frame 13 is empty
            this.scene.anims.create({
                key: `${type}-walk-anim`,
                frames: this.scene.anims.generateFrameNumbers('goblin-torch', { start: 7, end: 12 }),
                frameRate: 10,
                repeat: -1
            });
        }

        if (!this.scene.anims.exists(`${type}-attack-anim`)) {
            // Attack (Row 2) - Row 2 appears to have frames with attack effects, use all
            this.scene.anims.create({
                key: `${type}-attack-anim`,
                frames: this.scene.anims.generateFrameNumbers('goblin-torch', { start: 14, end: 19 }),
                frameRate: 12,
                repeat: 0
            });
        }
    }

    update(time, delta) {
        // Update debug graphics position to match hitbox
        // DISABLED for now - causing errors
        /*
        if (this.debugGraphics && this.body) {
            this.debugGraphics.clear();
            this.debugGraphics.lineStyle(2, 0x00ff00, 1); // Green line, 2px thick
            this.debugGraphics.strokeRect(
                this.body.x,
                this.body.y,
                this.body.width,
                this.body.height
            );
        }
        */

        if (this.isDying) return;

        // Check if enemy is dead
        if (this.health <= 0) {
            this.startDeath(time);
            return;
        }

        // Move towards player
        const player = this.scene.player;
        if (!player) return;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // If close enough, attack. Otherwise, move towards player
        if (distance < 50) {
            this.setVelocity(0, 0);
            this.attackPlayer(time);
        } else {
            // Move towards player
            const velocityX = Math.cos(angle) * this.speed;
            const velocityY = Math.sin(angle) * this.speed;
            this.setVelocity(velocityX, velocityY);

            // Flip sprite based on direction
            this.setFlipX(velocityX < 0);

            // Play walk animation (only change if different)
            if (this.anims.currentAnim?.key !== `${this.enemyType}-walk-anim`) {
                this.play(`${this.enemyType}-walk-anim`);
            }
        }
    }

    attackPlayer(time) {
        if (time - this.lastAttackTime < this.attackCooldown) {
            // In cooldown - play idle animation to prevent flickering
            if (this.anims.currentAnim?.key !== `${this.enemyType}-idle-anim`) {
                this.play(`${this.enemyType}-idle-anim`);
            }
            return;
        }

        this.lastAttackTime = time;

        // Play attack animation
        this.play(`${this.enemyType}-attack-anim`, true);

        // Deal damage to player
        if (this.scene.player && !this.scene.player.isInvulnerable) {
            this.scene.player.takeDamage(this.damage);
        }
    }

    takeDamage(amount) {
        if (this.isDying) return;

        this.health -= amount;

        // Flash red when hit
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        if (this.health <= 0) {
            this.startDeath(this.scene.time.now);
        }
    }

    startDeath(time) {
        if (this.isDying) return;

        this.isDying = true;
        this.deathStartTime = time;
        this.setVelocity(0, 0);

        // Hide debug graphics
        // DISABLED for now
        /*
        if (this.debugGraphics) {
            this.debugGraphics.destroy();
            this.debugGraphics = null;
        }
        */

        // Fade out
        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            duration: 500,
            onComplete: () => {
                // Don't destroy immediately, keep corpse visible
                this.setActive(false);
                this.body.enable = false;
            }
        });

        // Update game state
        if (this.scene.gameState) {
            this.scene.gameState.enemiesKilled++;
            this.scene.gameState.score += 10;
            this.scene.gameState.enemiesThisWave--;

            // Random chance for bamboo seed
            if (Math.random() < 0.1) {
                this.scene.gameState.resources.bambooSeeds++;
            }
        }
    }
}
