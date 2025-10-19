import Phaser from 'phaser';

/**
 * Tree - Animated terrain decoration with collision
 *
 * Features:
 * - Random tree type (1-4)
 * - Animated sprite (12 frame animation)
 * - Depth sorting for proper layering
 * - Static physics body for collision detection
 */
export default class Tree extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, treeType = null) {
        // For now, only use tree-1 until we verify it works
        const type = 1;
        const textureKey = `tree-${type}`;

        super(scene, x, y, textureKey, 0);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = static body

        // Tree properties
        this.treeType = type;
        this.textureKey = textureKey;
        this.setScale(1.0);

        // Set depth based on Y position for proper layering
        // Trees use their base Y position for depth sorting
        // When player Y < tree Y: player appears behind tree (correct!)
        // When player Y > tree Y: player appears in front of tree (correct!)
        this.setDepth(y);

        // Configure collision body - smaller circle around trunk base
        // Tree sprite is 120x200, but we only want collision on the trunk
        this.body.setSize(25, 25); // Very small collision area at the base (reduced)
        this.body.setOffset(47, 150); // Position at bottom/trunk of tree

        // Create animation immediately if it doesn't exist
        this.createAnimation(scene);

        // Start animation with slight random offset for variety
        const randomDelay = Phaser.Math.Between(0, 1000);
        scene.time.delayedCall(randomDelay, () => {
            // Double-check animation exists before playing
            if (scene.anims.exists(`${this.textureKey}-sway`)) {
                this.play(`${this.textureKey}-sway`);
            }
        });

        console.log(`🌳 Tree type ${type} created at (${Math.floor(x)}, ${Math.floor(y)})`);
    }

    createAnimation(scene) {
        const animKey = `${this.textureKey}-sway`;

        // Only create if it doesn't already exist
        if (!scene.anims.exists(animKey)) {
            try {
                // Tree1 sprite: 1536x256 with 8 frames of 120x200 each
                // Frames start at offset(40,45) with spacing(72,0)
                console.log(`🔍 Creating animation for ${this.textureKey}`);

                scene.anims.create({
                    key: animKey,
                    frames: scene.anims.generateFrameNumbers(this.textureKey, { start: 0, end: 7 }),
                    frameRate: 12, // Faster sway animation
                    repeat: -1 // Loop forever
                });

                console.log(`✅ Created animation: ${animKey} with 8 frames (0-7)`);
            } catch (error) {
                console.error(`❌ Failed to create tree animation for ${this.textureKey}:`, error);
                console.error('Error details:', error);
            }
        } else {
            console.log(`ℹ️ Animation ${animKey} already exists, skipping creation`);
        }
    }

    /**
     * Get the collision radius for this tree
     * Used for preventing overlapping placement
     */
    getCollisionRadius() {
        // Trees are 128x128, but we want a smaller collision area
        // focusing on the trunk/base
        return 50;
    }
}
