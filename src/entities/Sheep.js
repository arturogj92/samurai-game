import Phaser from 'phaser';

/**
 * Sheep - Animated creature decoration with collision
 *
 * Features:
 * - Multiple animations (idle, grass, move)
 * - Random behavior changes
 * - Depth sorting for proper layering
 * - Static physics body for collision detection
 */
export default class Sheep extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'sheep-idle', 0);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = static body

        // Sheep properties
        this.setScale(0.8); // Scale down a bit
        this.currentBehavior = 'idle';

        // Set depth based on Y position for proper layering
        // Sheep use their base Y position for depth sorting
        this.setDepth(y);

        // Configure collision body - sheep sprites are 128x128
        this.body.setSize(50, 40); // Smaller collision area (reduced)
        this.body.setOffset(39, 65); // Position at bottom of sheep

        // Create animations
        this.createAnimations(scene);

        // Start with random animation
        const behaviors = ['idle', 'grass'];
        const randomBehavior = behaviors[Phaser.Math.Between(0, behaviors.length - 1)];
        this.playAnimation(randomBehavior);

        // Change behavior randomly
        scene.time.addEvent({
            delay: Phaser.Math.Between(3000, 6000),
            callback: () => this.changeBehavior(scene),
            loop: true
        });

        console.log(`🐑 Sheep created at (${Math.floor(x)}, ${Math.floor(y)})`);
    }

    createAnimations(scene) {
        // Sheep Idle animation (6 frames)
        if (!scene.anims.exists('sheep-idle-anim')) {
            scene.anims.create({
                key: 'sheep-idle-anim',
                frames: scene.anims.generateFrameNumbers('sheep-idle', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Sheep Grass animation (12 frames)
        if (!scene.anims.exists('sheep-grass-anim')) {
            scene.anims.create({
                key: 'sheep-grass-anim',
                frames: scene.anims.generateFrameNumbers('sheep-grass', { start: 0, end: 11 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Sheep Move animation (4 frames)
        if (!scene.anims.exists('sheep-move-anim')) {
            scene.anims.create({
                key: 'sheep-move-anim',
                frames: scene.anims.generateFrameNumbers('sheep-move', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
    }

    playAnimation(behavior) {
        this.currentBehavior = behavior;

        switch(behavior) {
            case 'idle':
                this.play('sheep-idle-anim');
                break;
            case 'grass':
                this.play('sheep-grass-anim');
                break;
            case 'move':
                this.play('sheep-move-anim');
                break;
        }
    }

    changeBehavior(scene) {
        // Random chance to change behavior
        if (Phaser.Math.Between(0, 100) < 60) {
            const behaviors = ['idle', 'grass'];
            const newBehavior = behaviors[Phaser.Math.Between(0, behaviors.length - 1)];

            if (newBehavior !== this.currentBehavior) {
                this.playAnimation(newBehavior);
            }
        }

        // Schedule next behavior change
        const nextChangeTime = Phaser.Math.Between(3000, 6000);
        scene.time.delayedCall(nextChangeTime, () => this.changeBehavior(scene));
    }

    /**
     * Get the collision radius for this sheep
     * Used for preventing overlapping placement
     */
    getCollisionRadius() {
        return 50;
    }
}
