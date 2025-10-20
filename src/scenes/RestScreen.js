import Phaser from 'phaser';

/**
 * RestScreen - Scene shown between levels
 *
 * Features:
 * - Display level completion statistics
 * - Show next level preview
 * - Continue button to advance to next level
 * - Victory screen if final level completed
 */
export default class RestScreen extends Phaser.Scene {
    constructor() {
        super({ key: 'RestScreen' });
    }

    init(data) {
        // Receive data from MainScene
        this.levelSystem = data.levelSystem;
        this.isFinalLevel = data.isFinalLevel || false;
    }

    create() {
        console.log('✅ RestScreen: Scene started');

        const { width, height } = this.cameras.main;

        // Create semi-transparent dark overlay
        const overlay = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.85
        );
        overlay.setScrollFactor(0);

        if (this.isFinalLevel) {
            // FINAL VICTORY SCREEN
            this.createFinalVictoryScreen();
        } else {
            // LEVEL COMPLETE SCREEN
            this.createLevelCompleteScreen();
        }
    }

    createFinalVictoryScreen() {
        const { width, height } = this.cameras.main;

        // VICTORY title with animation
        const victoryText = this.add.text(
            width / 2,
            100,
            '🏆 VICTORY! 🏆',
            {
                fontSize: '64px',
                fontFamily: 'Arial',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 8,
                fontStyle: 'bold'
            }
        );
        victoryText.setOrigin(0.5);

        // Pulse animation
        this.tweens.add({
            targets: victoryText,
            scale: { from: 1.0, to: 1.1 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Get stats
        const stats = this.levelSystem.getStats();
        const levelConfig = this.levelSystem.getCurrentLevelConfig();

        // Subtitle
        const subtitleText = this.add.text(
            width / 2,
            180,
            `You have conquered all 5 levels!`,
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                align: 'center'
            }
        );
        subtitleText.setOrigin(0.5);

        // Statistics
        const statsText = this.add.text(
            width / 2,
            260,
            `📊 FINAL LEVEL STATS 📊

Level: ${levelConfig.level} - ${levelConfig.name}
⏱️  Time: ${stats.formattedTime}
💀 Enemies Killed: ${stats.enemiesKilled}
💰 Gold Collected: ${stats.goldCollected}
⚔️  Damage Dealt: ${Math.floor(stats.damageDealt)}
❤️  Damage Taken: ${Math.floor(stats.damageTaken)}`,
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                align: 'center',
                lineSpacing: 10
            }
        );
        statsText.setOrigin(0.5);

        // Play Again button
        const buttonY = height - 120;
        this.createButton(
            width / 2,
            buttonY,
            'PLAY AGAIN',
            () => {
                // Reset to level 1 and restart
                this.levelSystem.resetToLevel1();
                this.scene.start('MainScene', { levelSystem: this.levelSystem });
            },
            0x00AA00
        );
    }

    createLevelCompleteScreen() {
        const { width, height } = this.cameras.main;

        // Get level info
        const currentLevelConfig = this.levelSystem.getCurrentLevelConfig();
        const stats = this.levelSystem.getStats();

        // Title
        const titleText = this.add.text(
            width / 2,
            80,
            '✅ LEVEL COMPLETE!',
            {
                fontSize: '56px',
                fontFamily: 'Arial',
                color: '#00FF00',
                stroke: '#000000',
                strokeThickness: 6,
                fontStyle: 'bold'
            }
        );
        titleText.setOrigin(0.5);

        // Level name
        const levelNameText = this.add.text(
            width / 2,
            150,
            `Level ${currentLevelConfig.level}: ${currentLevelConfig.name}`,
            {
                fontSize: '28px',
                fontFamily: 'Arial',
                color: '#FFFF00',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        levelNameText.setOrigin(0.5);

        // Statistics
        const statsText = this.add.text(
            width / 2,
            220,
            `📊 LEVEL STATS 📊

⏱️  Time: ${stats.formattedTime}
💀 Enemies Killed: ${stats.enemiesKilled}
💰 Gold Collected: ${stats.goldCollected}
⚔️  Damage Dealt: ${Math.floor(stats.damageDealt)}
❤️  Damage Taken: ${Math.floor(stats.damageTaken)}`,
            {
                fontSize: '22px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                align: 'center',
                lineSpacing: 8
            }
        );
        statsText.setOrigin(0.5);

        // Next level preview (if not final)
        if (this.levelSystem.hasNextLevel()) {
            const nextLevel = this.levelSystem.currentLevel + 1;
            const nextLevelConfig = this.levelSystem.getLevelConfig(nextLevel);

            const nextLevelText = this.add.text(
                width / 2,
                400,
                `🔜 NEXT: Level ${nextLevelConfig.level} - ${nextLevelConfig.name}

${nextLevelConfig.description}
🏠 Huts: ${nextLevelConfig.hutCount}
⚡ Difficulty: ${this.getDifficultyText(nextLevelConfig)}`,
                {
                    fontSize: '20px',
                    fontFamily: 'Arial',
                    color: '#FFA500',
                    align: 'center',
                    lineSpacing: 6
                }
            );
            nextLevelText.setOrigin(0.5);
        }

        // Buttons row: Upgrade Stats, Upgrade Abilities, Continue
        const buttonY = height - 100;
        const buttonSpacing = 200;
        const centerX = width / 2;

        // Upgrade Stats button
        this.createButton(
            centerX - buttonSpacing,
            buttonY,
            '💪 STATS',
            () => {
                // Get the MainScene instance to access upgrade UI
                const mainScene = this.scene.get('MainScene');
                if (mainScene && mainScene.upgradeShopUI) {
                    // Pause this scene and open upgrade shop
                    mainScene.upgradeShopUI.open();
                }
            },
            0x8B00FF
        );

        // Upgrade Abilities button
        this.createButton(
            centerX,
            buttonY,
            '✨ ABILITIES',
            () => {
                // Get the MainScene instance to access ability upgrade UI
                const mainScene = this.scene.get('MainScene');
                if (mainScene && mainScene.abilityUpgradeUI) {
                    mainScene.abilityUpgradeUI.open();
                }
            },
            0xFF1493
        );

        // Continue button
        this.createButton(
            centerX + buttonSpacing,
            buttonY,
            '➡️  NEXT',
            () => {
                // Advance to next level
                const advanced = this.levelSystem.nextLevel();
                if (advanced) {
                    this.scene.start('MainScene', { levelSystem: this.levelSystem });
                }
            },
            0x0066FF
        );
    }

    /**
     * Helper to get difficulty text based on modifiers
     */
    getDifficultyText(levelConfig) {
        if (levelConfig.spawnRateMultiplier === 1.0 && levelConfig.fireRateMultiplier === 1.0) {
            return 'Normal';
        }
        if (levelConfig.spawnRateMultiplier >= 0.5) {
            return 'Hard';
        }
        if (levelConfig.spawnRateMultiplier >= 0.3) {
            return 'Very Hard';
        }
        return 'EXTREME';
    }

    /**
     * Create an interactive button
     */
    createButton(x, y, text, onClick, color = 0x0066FF, width = 160) {
        // Button background
        const buttonBg = this.add.rectangle(x, y, width, 70, color);
        buttonBg.setInteractive({ useHandCursor: true });

        // Button text
        const buttonText = this.add.text(x, y, text, {
            fontSize: width > 200 ? '32px' : '20px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        // Hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(color + 0x333333); // Lighten
            buttonBg.setScale(1.05);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(color);
            buttonBg.setScale(1.0);
        });

        // Click handler
        buttonBg.on('pointerdown', onClick);

        return { bg: buttonBg, text: buttonText };
    }
}
