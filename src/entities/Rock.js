import Phaser from 'phaser';

/**
 * Rock - Static terrain decoration with collision
 *
 * Features:
 * - Random rock type (1-4)
 * - Static sprite (no animation)
 * - Depth sorting for proper layering
 * - Static physics body for collision detection
 */
export default class Rock extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, rockType = null) {
        // If no rock type specified, pick random (1-4)
        const type = rockType || Phaser.Math.Between(1, 4);
        const textureKey = `rock-${type}`;

        super(scene, x, y, textureKey);

        // Add to scene - staticGroup will handle physics
        scene.add.existing(this);

        // Rock properties
        this.rockType = type;
        this.setScale(1.0);

        // Set depth based on Y position for proper layering
        this.setDepth(y); // Same Y-based sorting as other objects

        console.log(`🪨 Rock type ${type} created at (${Math.floor(x)}, ${Math.floor(y)})`);
    }

    /**
     * Setup physics body - called AFTER adding to staticGroup
     */
    setupPhysics() {
        if (!this.body) {
            console.warn('⚠️ Rock: No physics body found! Make sure rock is added to staticGroup first.');
            return;
        }

        // Configure collision body - rocks are 64x64
        this.body.setSize(30, 30); // Very small collision area (reduced)
        this.body.setOffset(17, 17); // Center the collision body

        console.log(`🔧 Rock physics configured: size 30x30 at offset (17, 17)`);
    }

    /**
     * Get the collision radius for this rock
     * Used for preventing overlapping placement
     */
    getCollisionRadius() {
        // Rocks are 64x64
        return 30;
    }
}
