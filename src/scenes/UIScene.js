import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        console.log('✅ UIScene: UI Scene started');

        // Get reference to MainScene
        this.mainScene = this.scene.get('MainScene');

        // Create UI elements
        this.createHealthBar();
        this.createWaveDisplay();

        // FPS display
        this.fpsText = this.add.text(10, 10, 'FPS: 60', {
            font: '16px monospace',
            fill: '#00ff00'
        }).setScrollFactor(0).setDepth(1000);
    }

    createHealthBar() {
        const width = 60;
        const height = 6;

        // Container for health bar
        this.healthBarContainer = this.add.container(0, 0);
        this.healthBarContainer.setDepth(10000);

        // Outer shadow (drop shadow effect)
        this.healthBarOuterShadow = this.add.rectangle(2, 2, width + 6, height + 6, 0x000000, 0.6)
            .setOrigin(0.5, 0.5);

        // Outer glow (epic glow effect)
        this.healthBarGlow = this.add.rectangle(0, 0, width + 8, height + 8, 0xFF0000, 0.4)
            .setOrigin(0.5, 0.5);

        // Main outer border (thick black border)
        this.healthBarOuterBorder = this.add.rectangle(0, 0, width + 4, height + 4, 0x1a1a1a, 1)
            .setOrigin(0.5, 0.5);

        // Secondary border (light border for contrast)
        this.healthBarSecondaryBorder = this.add.rectangle(0, 0, width + 2, height + 2, 0xCCCCCC, 1)
            .setOrigin(0.5, 0.5);

        // Background (dark with slight transparency)
        this.healthBarBg = this.add.rectangle(0, 0, width, height, 0x2a2a2a, 0.95)
            .setOrigin(0.5, 0.5);

        // Background gradient overlay (darker bottom)
        this.healthBarBgGradient = this.add.rectangle(0, 1, width, height / 2, 0x000000, 0.3)
            .setOrigin(0.5, 0.5);

        // Health fill (main health bar)
        this.healthBarFill = this.add.rectangle(-width/2, 0, width, height, 0x00ff00)
            .setOrigin(0, 0.5);

        // Health fill top highlight (bright shine on top)
        this.healthBarTopHighlight = this.add.rectangle(-width/2, -height/2 + 1, width, 2, 0xFFFFFF, 0.5)
            .setOrigin(0, 0.5);

        // Inner glow on health bar (makes it pop)
        this.healthBarInnerGlow = this.add.rectangle(-width/2, 0, width, height - 2, 0xFFFFFF, 0.2)
            .setOrigin(0, 0.5);

        // Add all elements to container in correct order
        this.healthBarContainer.add([
            this.healthBarOuterShadow,
            this.healthBarGlow,
            this.healthBarOuterBorder,
            this.healthBarSecondaryBorder,
            this.healthBarBg,
            this.healthBarBgGradient,
            this.healthBarFill,
            this.healthBarInnerGlow,
            this.healthBarTopHighlight
        ]);

        // Store original width for scaling
        this.healthBarMaxWidth = width;
    }

    createWaveDisplay() {
        const x = this.cameras.main.width - 20;
        const y = 20;

        this.waveText = this.add.text(x, y, 'Wave: 1', {
            font: '24px monospace',
            fill: '#ffff00'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        this.scoreText = this.add.text(x, y + 30, 'Score: 0', {
            font: '18px monospace',
            fill: '#ffffff'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);
    }

    update() {
        // Update FPS
        this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);

        // Update health bar position and appearance
        if (this.mainScene && this.mainScene.player && this.mainScene.cameras.main) {
            const player = this.mainScene.player;
            const healthPercent = player.health / player.maxHealth;

            // Convert world coordinates to screen coordinates
            const camera = this.mainScene.cameras.main;
            const screenX = player.x - camera.scrollX;
            const screenY = player.y - camera.scrollY - 42; // Higher above player's head

            // Position health bar above player's head in screen space
            this.healthBarContainer.x = screenX;
            this.healthBarContainer.y = screenY;

            // Smooth width transition with tween-like effect
            const targetWidth = this.healthBarMaxWidth * healthPercent;
            const currentWidth = this.healthBarFill.displayWidth;
            const lerpSpeed = 0.2;
            const newWidth = currentWidth + (targetWidth - currentWidth) * lerpSpeed;

            this.healthBarFill.displayWidth = newWidth;
            this.healthBarTopHighlight.displayWidth = newWidth;
            this.healthBarInnerGlow.displayWidth = newWidth;

            // Color gradient based on health percentage (vibrant gaming colors)
            let color, glowColor;
            if (healthPercent > 0.6) {
                // Bright green to lime green (100% to 60%)
                const t = (healthPercent - 0.6) / 0.4;
                color = this.interpolateColor(0x7FFF00, 0x00FF00, t);
                glowColor = 0x00FF00;
            } else if (healthPercent > 0.35) {
                // Yellow to orange (60% to 35%)
                const t = (healthPercent - 0.35) / 0.25;
                color = this.interpolateColor(0xFF8C00, 0xFFFF00, t);
                glowColor = 0xFFFF00;
            } else if (healthPercent > 0.15) {
                // Orange to red-orange (35% to 15%)
                const t = (healthPercent - 0.15) / 0.2;
                color = this.interpolateColor(0xFF4500, 0xFF8C00, t);
                glowColor = 0xFF4500;
            } else {
                // Red to dark red (15% to 0%)
                const t = healthPercent / 0.15;
                color = this.interpolateColor(0x8B0000, 0xFF0000, t);
                glowColor = 0xFF0000;
            }

            this.healthBarFill.setFillStyle(color, 1);
            this.healthBarGlow.setFillStyle(glowColor);

            // Dynamic pulsing effects
            if (healthPercent < 0.25 && healthPercent > 0) {
                // Intense pulse when critically low
                const pulse = Math.sin(this.time.now / 120) * 0.2 + 0.8;
                this.healthBarGlow.setAlpha(0.3 + (1 - pulse) * 0.4);
                this.healthBarGlow.setScale(1 + (1 - pulse) * 0.15);
            } else if (healthPercent < 0.5) {
                // Moderate pulse when low
                const pulse = Math.sin(this.time.now / 200) * 0.1 + 0.9;
                this.healthBarGlow.setAlpha(0.25 + (1 - pulse) * 0.15);
                this.healthBarGlow.setScale(1);
            } else {
                // Normal state
                this.healthBarGlow.setAlpha(0.2);
                this.healthBarGlow.setScale(1);
            }
        }

        // Update wave/score
        if (this.mainScene && this.mainScene.gameState) {
            this.waveText.setText(`Wave: ${this.mainScene.gameState.wave}`);
            this.scoreText.setText(`Score: ${this.mainScene.gameState.score}`);
        }
    }

    // Helper function to interpolate between two colors
    interpolateColor(color1, color2, factor) {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;

        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;

        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);

        return (r << 16) | (g << 8) | b;
    }
}
