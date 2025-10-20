import Phaser from 'phaser';

/**
 * LevelCompletePanel - EPIC side panel showing level completion stats
 * Appears on the right side without blocking gameplay
 */
export default class LevelCompletePanel {
    constructor(scene, levelSystem) {
        this.scene = scene;
        this.levelSystem = levelSystem;
        this.container = null;
        this.isVisible = false;
        this.particles = [];
    }

    show() {
        if (this.isVisible) return;
        this.isVisible = true;

        // Keep health bar visible during rest screen
        // (Previously hidden, but now stays visible for better UX)

        const { width, height } = this.scene.cameras.main;
        const stats = this.levelSystem.getStats();
        const currentLevel = this.levelSystem.getCurrentLevelConfig();
        const isFinalLevel = this.levelSystem.isFinalLevel();

        // Main container (fixed to camera)
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(10000);

        // Panel dimensions - MUCH SMALLER NOW
        const panelWidth = 300;
        const panelHeight = Math.min(550, height - 100);
        const panelX = width - panelWidth - 15;
        const panelY = (height - panelHeight) / 2;

        // EPIC BACKGROUND with multiple layers
        const bg = this.scene.add.graphics();

        // Outer glow
        bg.fillStyle(0x00ff00, 0.2);
        bg.fillRoundedRect(panelX - 4, panelY - 4, panelWidth + 8, panelHeight + 8, 20);

        // Main dark background
        bg.fillStyle(0x000000, 0.95);
        bg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);

        // Double border for clean look
        bg.lineStyle(3, 0x00ff00, 1); // Green outer
        bg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);

        bg.lineStyle(2, 0xffff00, 0.8); // Yellow inner
        bg.strokeRoundedRect(panelX + 3, panelY + 3, panelWidth - 6, panelHeight - 6, 14);

        this.container.add(bg);

        // Add animated corner accents
        this.addCornerAccents(panelX, panelY, panelWidth, panelHeight);

        let yOffset = panelY + 20;

        // EPIC Title with glow
        const titleText = isFinalLevel ? '🏆 VICTORY 🏆' : '✨ LEVEL UP ✨';
        const title = this.scene.add.text(
            panelX + panelWidth / 2,
            yOffset,
            titleText,
            {
                fontSize: isFinalLevel ? '26px' : '24px',
                fontFamily: 'Arial, sans-serif',
                color: isFinalLevel ? '#FFD700' : '#00ff00',
                fontStyle: 'bold',
                align: 'center',
                stroke: isFinalLevel ? '#ff6600' : '#ffff00',
                strokeThickness: 3,
                shadow: {
                    offsetX: 0,
                    offsetY: 0,
                    color: isFinalLevel ? '#FFD700' : '#00ff00',
                    blur: 10,
                    fill: true
                }
            }
        );
        title.setOrigin(0.5, 0);
        this.container.add(title);

        yOffset += 35;

        // Level name - more compact
        const levelName = this.scene.add.text(
            panelX + panelWidth / 2,
            yOffset,
            `Lv.${currentLevel.level} - ${currentLevel.name}`,
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffff00',
                align: 'center',
                fontStyle: 'bold'
            }
        );
        levelName.setOrigin(0.5, 0);
        this.container.add(levelName);

        yOffset += 30;

        // EPIC Divider line
        const divider1 = this.scene.add.graphics();
        divider1.lineStyle(2, 0x00ff00, 1);
        divider1.lineBetween(panelX + 20, yOffset, panelX + panelWidth / 2 - 10, yOffset);
        divider1.lineStyle(2, 0xffff00, 1);
        divider1.lineBetween(panelX + panelWidth / 2 + 10, yOffset, panelX + panelWidth - 20, yOffset);
        this.container.add(divider1);

        yOffset += 20;

        // Statistics section - more compact
        const statsTitle = this.scene.add.text(
            panelX + panelWidth / 2,
            yOffset,
            '⚡ STATS ⚡',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#ffff00',
                fontStyle: 'bold',
                align: 'center',
                stroke: '#00ff00',
                strokeThickness: 2
            }
        );
        statsTitle.setOrigin(0.5, 0);
        this.container.add(statsTitle);

        yOffset += 28;

        // Individual stats - COMPACT & EPIC (solo las importantes)
        const statsList = [
            { icon: '⏱️', label: 'Time', value: stats.formattedTime, color: '#00ff00', bgColor: 0x003300 },
            { icon: '💀', label: 'Kills', value: stats.enemiesKilled.toString(), color: '#ff0000', bgColor: 0x330000 },
            { icon: '⚔️', label: 'Damage', value: Math.floor(stats.damageDealt).toString(), color: '#ffaa00', bgColor: 0x332200 }
        ];

        statsList.forEach((stat, index) => {
            // Compact stat row with glow
            const rowBg = this.scene.add.graphics();

            // Subtle glow
            rowBg.fillStyle(stat.bgColor, 0.3);
            rowBg.fillRoundedRect(panelX + 18, yOffset - 1, panelWidth - 36, 38, 6);

            // Main background
            rowBg.fillStyle(0x0a0a0a, 0.8);
            rowBg.fillRoundedRect(panelX + 20, yOffset, panelWidth - 40, 36, 6);

            // Border accent
            rowBg.lineStyle(1, stat.bgColor, 0.6);
            rowBg.strokeRoundedRect(panelX + 20, yOffset, panelWidth - 40, 36, 6);

            this.container.add(rowBg);

            // Icon and compact label
            const statLabel = this.scene.add.text(
                panelX + 32,
                yOffset + 18,
                `${stat.icon} ${stat.label}`,
                {
                    fontSize: '15px',
                    fontFamily: 'Arial',
                    color: '#aaaaaa',
                    fontStyle: 'bold'
                }
            );
            statLabel.setOrigin(0, 0.5);
            this.container.add(statLabel);

            // Value with glow
            const statValue = this.scene.add.text(
                panelX + panelWidth - 32,
                yOffset + 18,
                stat.value,
                {
                    fontSize: '18px',
                    fontFamily: 'Arial',
                    color: stat.color,
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 2,
                    shadow: {
                        offsetX: 0,
                        offsetY: 0,
                        color: stat.color,
                        blur: 8,
                        fill: true
                    }
                }
            );
            statValue.setOrigin(1, 0.5);
            this.container.add(statValue);

            yOffset += 42;
        });

        yOffset += 10;

        // Next level preview - COMPACT
        if (!isFinalLevel) {
            yOffset += 5;

            const nextLevel = this.levelSystem.currentLevel + 1;
            const nextConfig = this.levelSystem.getLevelConfig(nextLevel);

            const nextTitle = this.scene.add.text(
                panelX + panelWidth / 2,
                yOffset,
                `⚡ NEXT: Lv.${nextConfig.level} ⚡`,
                {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    color: '#ffff00',
                    fontStyle: 'bold',
                    align: 'center',
                    stroke: '#00ff00',
                    strokeThickness: 2
                }
            );
            nextTitle.setOrigin(0.5, 0);
            this.container.add(nextTitle);

            yOffset += 26;

            const nextInfo = this.scene.add.text(
                panelX + panelWidth / 2,
                yOffset,
                `${nextConfig.name}\n🏠 x${nextConfig.hutCount}`,
                {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    color: '#aaaaaa',
                    align: 'center',
                    lineSpacing: 2
                }
            );
            nextInfo.setOrigin(0.5, 0);
            this.container.add(nextInfo);
        }

        // UPGRADE BUTTONS - Compact row
        const upgradeButtonsY = panelY + panelHeight - 220;
        this.createUpgradeButtons(panelX, upgradeButtonsY, panelWidth);

        // SHOP button
        const shopButtonY = panelY + panelHeight - 120;
        this.createShopButton(panelX, shopButtonY, panelWidth);

        // EPIC Continue button (FIXED - using Zone for proper interactivity)
        const buttonY = panelY + panelHeight - 60;
        const buttonText = isFinalLevel ? '🔄 PLAY AGAIN' : 'CONTINUE ⚡';

        // Button background graphics
        const buttonBg = this.scene.add.graphics();
        buttonBg.fillStyle(0x00aa00, 1);
        buttonBg.fillRoundedRect(panelX + 30, buttonY, panelWidth - 60, 50, 10);

        // Glow effect
        buttonBg.lineStyle(2, 0xffff00, 1);
        buttonBg.strokeRoundedRect(panelX + 30, buttonY, panelWidth - 60, 50, 10);

        this.container.add(buttonBg);

        // Button label
        const buttonLabel = this.scene.add.text(
            panelX + panelWidth / 2,
            buttonY + 25,
            buttonText,
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        buttonLabel.setOrigin(0.5);
        this.container.add(buttonLabel);

        // Interactive zone (THIS IS THE FIX!)
        const buttonZone = this.scene.add.zone(panelX + panelWidth / 2, buttonY + 25, panelWidth - 60, 50);
        buttonZone.setInteractive({ useHandCursor: true });
        buttonZone.setScrollFactor(0);
        buttonZone.setDepth(10001);

        // Store references for hover effects
        this.buttonBg = buttonBg;
        this.buttonLabel = buttonLabel;
        this.buttonZone = buttonZone;
        this.buttonBaseX = panelX;
        this.buttonBaseY = buttonY;
        this.buttonWidth = panelWidth;

        // Button hover effects
        buttonZone.on('pointerover', () => {
            buttonBg.clear();
            // Brighter glow on hover
            buttonBg.fillStyle(0x00ff00, 1);
            buttonBg.fillRoundedRect(panelX + 30, buttonY, panelWidth - 60, 50, 10);
            buttonBg.lineStyle(3, 0xffff00, 1);
            buttonBg.strokeRoundedRect(panelX + 30, buttonY, panelWidth - 60, 50, 10);

            buttonLabel.setScale(1.05);
        });

        buttonZone.on('pointerout', () => {
            buttonBg.clear();
            // Reset to normal
            buttonBg.fillStyle(0x00aa00, 1);
            buttonBg.fillRoundedRect(panelX + 30, buttonY, panelWidth - 60, 50, 10);
            buttonBg.lineStyle(2, 0xffff00, 1);
            buttonBg.strokeRoundedRect(panelX + 30, buttonY, panelWidth - 60, 50, 10);

            buttonLabel.setScale(1.0);
        });

        // Button click handler
        buttonZone.on('pointerdown', () => {
            console.log('🔥 CONTINUE BUTTON CLICKED!');
            this.onContinue();
        });

        // Slide in animation
        this.container.setX(400);
        this.container.setAlpha(0);
        buttonZone.setX(buttonZone.x + 400);
        buttonZone.setAlpha(0);

        this.scene.tweens.add({
            targets: [this.container, buttonZone],
            x: `-=400`,
            alpha: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
    }

    addCornerAccents(x, y, w, h) {
        // Animated corner decorations for EPIC effect
        const cornerSize = 20;
        const corners = this.scene.add.graphics();

        // Top-left (green)
        corners.lineStyle(3, 0x00ff00, 1);
        corners.lineBetween(x, y + cornerSize, x, y);
        corners.lineBetween(x, y, x + cornerSize, y);

        // Top-right (yellow)
        corners.lineStyle(3, 0xffff00, 1);
        corners.lineBetween(x + w - cornerSize, y, x + w, y);
        corners.lineBetween(x + w, y, x + w, y + cornerSize);

        // Bottom-left (yellow)
        corners.lineStyle(3, 0xffff00, 1);
        corners.lineBetween(x, y + h - cornerSize, x, y + h);
        corners.lineBetween(x, y + h, x + cornerSize, y + h);

        // Bottom-right (green)
        corners.lineStyle(3, 0x00ff00, 1);
        corners.lineBetween(x + w - cornerSize, y + h, x + w, y + h);
        corners.lineBetween(x + w, y + h, x + w, y + h - cornerSize);

        this.container.add(corners);

        // Pulsing animation on corners
        this.scene.tweens.add({
            targets: corners,
            alpha: { from: 1, to: 0.5 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createUpgradeButtons(panelX, buttonY, panelWidth) {
        const buttonWidth = (panelWidth - 70) / 2; // Two buttons side by side with gap
        const gap = 10;

        // STATS button (left)
        const statsBg = this.scene.add.graphics();
        statsBg.fillStyle(0x7700AA, 1);
        statsBg.fillRoundedRect(panelX + 30, buttonY, buttonWidth, 40, 6);
        statsBg.lineStyle(2, 0x9933FF, 1);
        statsBg.strokeRoundedRect(panelX + 30, buttonY, buttonWidth, 40, 6);
        this.container.add(statsBg);

        const statsLabel = this.scene.add.text(
            panelX + 30 + buttonWidth / 2,
            buttonY + 20,
            '💪 STATS',
            {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        statsLabel.setOrigin(0.5);
        this.container.add(statsLabel);

        const statsZone = this.scene.add.zone(panelX + 30 + buttonWidth / 2, buttonY + 20, buttonWidth, 40);
        statsZone.setInteractive({ useHandCursor: true });
        statsZone.setScrollFactor(0);
        statsZone.setDepth(10001);

        statsZone.on('pointerover', () => {
            statsBg.clear();
            statsBg.fillStyle(0x9933FF, 1);
            statsBg.fillRoundedRect(panelX + 30, buttonY, buttonWidth, 40, 6);
            statsBg.lineStyle(3, 0xAA55FF, 1);
            statsBg.strokeRoundedRect(panelX + 30, buttonY, buttonWidth, 40, 6);
            statsLabel.setScale(1.05);
        });

        statsZone.on('pointerout', () => {
            statsBg.clear();
            statsBg.fillStyle(0x7700AA, 1);
            statsBg.fillRoundedRect(panelX + 30, buttonY, buttonWidth, 40, 6);
            statsBg.lineStyle(2, 0x9933FF, 1);
            statsBg.strokeRoundedRect(panelX + 30, buttonY, buttonWidth, 40, 6);
            statsLabel.setScale(1.0);
        });

        statsZone.on('pointerdown', () => {
            console.log('💪 STATS UPGRADE CLICKED!');
            if (this.scene.upgradeShopUI) {
                this.scene.upgradeShopUI.open();
            }
        });

        // ABILITIES button (right)
        const abilitiesX = panelX + 30 + buttonWidth + gap;
        const abilitiesBg = this.scene.add.graphics();
        abilitiesBg.fillStyle(0xAA0077, 1);
        abilitiesBg.fillRoundedRect(abilitiesX, buttonY, buttonWidth, 40, 6);
        abilitiesBg.lineStyle(2, 0xFF33AA, 1);
        abilitiesBg.strokeRoundedRect(abilitiesX, buttonY, buttonWidth, 40, 6);
        this.container.add(abilitiesBg);

        const abilitiesLabel = this.scene.add.text(
            abilitiesX + buttonWidth / 2,
            buttonY + 20,
            '✨ SKILLS',
            {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        abilitiesLabel.setOrigin(0.5);
        this.container.add(abilitiesLabel);

        const abilitiesZone = this.scene.add.zone(abilitiesX + buttonWidth / 2, buttonY + 20, buttonWidth, 40);
        abilitiesZone.setInteractive({ useHandCursor: true });
        abilitiesZone.setScrollFactor(0);
        abilitiesZone.setDepth(10001);

        abilitiesZone.on('pointerover', () => {
            abilitiesBg.clear();
            abilitiesBg.fillStyle(0xFF1493, 1);
            abilitiesBg.fillRoundedRect(abilitiesX, buttonY, buttonWidth, 40, 6);
            abilitiesBg.lineStyle(3, 0xFF55BB, 1);
            abilitiesBg.strokeRoundedRect(abilitiesX, buttonY, buttonWidth, 40, 6);
            abilitiesLabel.setScale(1.05);
        });

        abilitiesZone.on('pointerout', () => {
            abilitiesBg.clear();
            abilitiesBg.fillStyle(0xAA0077, 1);
            abilitiesBg.fillRoundedRect(abilitiesX, buttonY, buttonWidth, 40, 6);
            abilitiesBg.lineStyle(2, 0xFF33AA, 1);
            abilitiesBg.strokeRoundedRect(abilitiesX, buttonY, buttonWidth, 40, 6);
            abilitiesLabel.setScale(1.0);
        });

        abilitiesZone.on('pointerdown', () => {
            console.log('✨ ABILITY UPGRADES CLICKED!');
            if (this.scene.abilityUpgradeUI) {
                this.scene.abilityUpgradeUI.open();
            }
        });

        // Store zones for cleanup
        if (!this.upgradeZones) this.upgradeZones = [];
        this.upgradeZones.push(statsZone, abilitiesZone);
    }

    createShopButton(panelX, buttonY, panelWidth) {
        // Shop button background
        const shopBg = this.scene.add.graphics();
        shopBg.fillStyle(0xaa7700, 1);
        shopBg.fillRoundedRect(panelX + 30, buttonY, panelWidth - 60, 45, 8);

        // Glow effect
        shopBg.lineStyle(2, 0xFFD700, 1);
        shopBg.strokeRoundedRect(panelX + 30, buttonY, panelWidth - 60, 45, 8);

        this.container.add(shopBg);

        // Shop button label
        const shopLabel = this.scene.add.text(
            panelX + panelWidth / 2,
            buttonY + 22.5,
            '🛒 ABILITY SHOP',
            {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        shopLabel.setOrigin(0.5);
        this.container.add(shopLabel);

        // Interactive zone for shop button
        const shopZone = this.scene.add.zone(panelX + panelWidth / 2, buttonY + 22.5, panelWidth - 60, 45);
        shopZone.setInteractive({ useHandCursor: true });
        shopZone.setScrollFactor(0);
        shopZone.setDepth(10001);

        // Hover effects
        shopZone.on('pointerover', () => {
            shopBg.clear();
            shopBg.fillStyle(0xcc8800, 1);
            shopBg.fillRoundedRect(panelX + 30, buttonY, panelWidth - 60, 45, 8);
            shopBg.lineStyle(3, 0xFFD700, 1);
            shopBg.strokeRoundedRect(panelX + 30, buttonY, panelWidth - 60, 45, 8);
            shopLabel.setScale(1.05);
        });

        shopZone.on('pointerout', () => {
            shopBg.clear();
            shopBg.fillStyle(0xaa7700, 1);
            shopBg.fillRoundedRect(panelX + 30, buttonY, panelWidth - 60, 45, 8);
            shopBg.lineStyle(2, 0xFFD700, 1);
            shopBg.strokeRoundedRect(panelX + 30, buttonY, panelWidth - 60, 45, 8);
            shopLabel.setScale(1.0);
        });

        // Click handler
        shopZone.on('pointerdown', () => {
            console.log('🛒 SHOP BUTTON CLICKED!');
            // Open the ability shop
            if (this.scene.abilityShopUI) {
                this.scene.abilityShopUI.open();
            }
        });

        // Store reference for cleanup
        this.shopZone = shopZone;
    }

    onContinue() {
        if (!this.container) return;

        // Slide out animation
        this.scene.tweens.add({
            targets: [this.container, this.buttonZone],
            x: `+=400`,
            alpha: 0,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.hide();

                // Check if final level
                if (this.levelSystem.isFinalLevel()) {
                    // Reset to level 1
                    this.levelSystem.resetToLevel1();
                    this.scene.scene.restart();
                } else {
                    // Advance to next level
                    this.levelSystem.nextLevel();
                    this.scene.startNextLevel();
                }
            }
        });
    }

    hide() {
        // Health bar stays visible now, no need to show/hide

        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        if (this.buttonZone) {
            this.buttonZone.destroy();
            this.buttonZone = null;
        }
        if (this.shopZone) {
            this.shopZone.destroy();
            this.shopZone = null;
        }
        // Clean up upgrade zones
        if (this.upgradeZones) {
            this.upgradeZones.forEach(zone => {
                if (zone) zone.destroy();
            });
            this.upgradeZones = [];
        }
        // Clean up particle references
        this.particles.forEach(p => {
            if (p && p.destroy) p.destroy();
        });
        this.particles = [];
        this.isVisible = false;
    }
}
