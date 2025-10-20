/**
 * AbilityUpgradeUI.js
 * UI for upgrading owned abilities with epic level 3+ effects
 * Shows current level, next level preview, and special effects
 */

import { ABILITY_POOL } from '../config/AbilityPool.js';

export default class AbilityUpgradeUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.isOpen = false;
        this.interactiveZones = [];
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        console.log('✨ Opening Ability Upgrade UI');

        // Pause game
        this.scene.physics.pause();
        this.scene.gameState.playing = false;

        // Main container
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(26000);

        const { width, height } = this.scene.cameras.main;

        // Background overlay
        const bgOverlay = this.scene.add.graphics();
        bgOverlay.fillStyle(0x000000, 0.92);
        bgOverlay.fillRect(0, 0, width, height);
        bgOverlay.setScrollFactor(0);
        this.container.add(bgOverlay);

        // Panel dimensions
        const panelWidth = 950;
        const panelHeight = 700;
        const panelX = width / 2;
        const panelY = height / 2;

        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0xFF1493, 0.3);
        panelBg.fillRoundedRect(panelX - panelWidth/2 - 4, panelY - panelHeight/2 - 4, panelWidth + 8, panelHeight + 8, 20);
        panelBg.fillStyle(0x1a1a2e, 1);
        panelBg.fillRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 16);
        panelBg.lineStyle(4, 0xFF1493, 1);
        panelBg.strokeRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 16);
        this.container.add(panelBg);

        // Title
        const titleText = this.scene.add.text(panelX, panelY - panelHeight/2 + 40, '✨ ABILITY UPGRADES ✨', {
            fontSize: '36px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FF1493',
            stroke: '#000000',
            strokeThickness: 5
        });
        titleText.setOrigin(0.5);
        this.container.add(titleText);

        // Subtitle
        const subtitleText = this.scene.add.text(panelX, panelY - panelHeight/2 + 80, 'Enhance your abilities with epic effects!', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#FFAAFF',
            stroke: '#000000',
            strokeThickness: 2
        });
        subtitleText.setOrigin(0.5);
        this.container.add(subtitleText);

        // Gold display
        const goldText = this.scene.add.text(panelX, panelY - panelHeight/2 + 110, `Your Gold: ${this.scene.gameState.resources.gold} 💰`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
        });
        goldText.setOrigin(0.5);
        this.container.add(goldText);

        // Get owned abilities
        const ownedAbilities = this.scene.abilityUpgradeSystem.getOwnedAbilitiesWithLevels();

        if (ownedAbilities.length === 0) {
            this.showNoAbilitiesMessage(panelX, panelY);
        } else {
            this.createAbilityCards(panelX, panelY - 50, ownedAbilities);
        }

        // Close button
        this.createCloseButton(panelX, panelY + panelHeight/2 - 40);
    }

    showNoAbilitiesMessage(x, y) {
        const messageText = this.scene.add.text(x, y, 'You don\'t own any abilities yet!\nPurchase abilities first in the Ability Shop.', {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            align: 'center',
            lineSpacing: 10
        });
        messageText.setOrigin(0.5);
        this.container.add(messageText);
    }

    createAbilityCards(centerX, startY, abilities) {
        const cardWidth = 280;
        const cardHeight = 220;
        const spacing = 20;
        const columns = 3;

        abilities.forEach((abilityData, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;

            const totalRowWidth = (cardWidth * columns) + (spacing * (columns - 1));
            const startX = centerX - totalRowWidth / 2 + cardWidth / 2;

            const cardX = startX + (col * (cardWidth + spacing));
            const cardY = startY + (row * (cardHeight + spacing));

            this.createAbilityCard(cardX, cardY, cardWidth, cardHeight, abilityData);
        });
    }

    createAbilityCard(x, y, width, height, abilityData) {
        const ability = ABILITY_POOL[abilityData.id];
        const currentData = abilityData.currentData;
        const nextData = abilityData.nextData;
        const canUpgrade = abilityData.canUpgrade;
        const canAfford = nextData && this.scene.gameState.resources.gold >= nextData.price;
        const isMaxLevel = abilityData.currentLevel === abilityData.maxLevel;

        const cardContainer = this.scene.add.container(x, y);
        this.container.add(cardContainer);

        // Card background - use special colors for level 3+
        let bgColor = 0x2a2a4a;
        let borderColor = 0x666666;

        if (currentData && currentData.color) {
            // Epic/Legendary ability - use special color
            const hexColor = parseInt(currentData.color.replace('#', ''), 16);
            bgColor = hexColor;
            borderColor = 0xFFFFFF;
        } else if (canUpgrade && canAfford) {
            bgColor = 0x2a4a2a;
            borderColor = 0x00FF00;
        } else if (isMaxLevel) {
            bgColor = 0x3a3a2a;
            borderColor = 0xFFD700;
        }

        const cardBg = this.scene.add.rectangle(0, 0, width, height, bgColor, currentData && currentData.color ? 0.3 : 1);
        cardBg.setStrokeStyle(3, borderColor);
        cardContainer.add(cardBg);

        // Ability icon
        const icon = this.scene.add.image(0, -75, ability.icon);
        icon.setDisplaySize(70, 70);
        cardContainer.add(icon);

        // Ability name with level indicator
        const nameText = this.scene.add.text(0, -25, currentData ? currentData.name : ability.name, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: currentData && currentData.color ? currentData.color : '#FFD700',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: width - 20 }
        });
        nameText.setOrigin(0.5);
        cardContainer.add(nameText);

        // Level display
        const levelText = this.scene.add.text(0, 0, `Level ${abilityData.currentLevel}/${abilityData.maxLevel}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: isMaxLevel ? '#00FF00' : '#FFFFFF',
            fontStyle: isMaxLevel ? 'bold' : 'normal'
        });
        levelText.setOrigin(0.5);
        cardContainer.add(levelText);

        // Special effect indicator for level 3+
        if (currentData && currentData.special) {
            const specialText = this.scene.add.text(0, 20, '🌟 SPECIAL EFFECT 🌟', {
                fontSize: '11px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#FFD700'
            });
            specialText.setOrigin(0.5);
            cardContainer.add(specialText);
        }

        // Next level info or max level message
        if (!isMaxLevel && nextData) {
            const nextDesc = this.scene.add.text(0, 45, nextData.description, {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: '#CCCCCC',
                align: 'center',
                wordWrap: { width: width - 30 },
                lineSpacing: 2
            });
            nextDesc.setOrigin(0.5);
            cardContainer.add(nextDesc);

            // Price
            const priceText = this.scene.add.text(0, 85, `UPGRADE: ${nextData.price} 💰`, {
                fontSize: '16px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: canAfford ? '#00FF00' : '#FF4444'
            });
            priceText.setOrigin(0.5);
            cardContainer.add(priceText);
        } else if (isMaxLevel) {
            const maxText = this.scene.add.text(0, 70, '⭐ MAX LEVEL ⭐', {
                fontSize: '18px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#FFD700'
            });
            maxText.setOrigin(0.5);
            cardContainer.add(maxText);
        }

        // Make card interactive if can upgrade and afford
        if (canUpgrade && canAfford && nextData) {
            const cardZone = this.scene.add.zone(x, y, width, height);
            cardZone.setInteractive({ useHandCursor: true });
            cardZone.setScrollFactor(0);
            cardZone.setDepth(26001);
            this.interactiveZones.push(cardZone);

            cardZone.on('pointerover', () => {
                cardBg.setFillStyle(0x3a5a3a);
                cardBg.setStrokeStyle(3, 0xFFD700);
            });

            cardZone.on('pointerout', () => {
                cardBg.setFillStyle(bgColor, currentData && currentData.color ? 0.3 : 1);
                cardBg.setStrokeStyle(3, borderColor);
            });

            cardZone.on('pointerdown', () => {
                const success = this.scene.abilityUpgradeSystem.upgradeAbility(abilityData.id);
                if (success) {
                    // Show epic upgrade animation for level 3+
                    if (nextData.special) {
                        this.showEpicUpgradeEffect(x, y, nextData);
                    }
                    this.refresh(); // Refresh UI after purchase
                }
            });
        }
    }

    showEpicUpgradeEffect(x, y, levelData) {
        // Create a burst effect for epic upgrades
        const burstText = this.scene.add.text(x, y, '🌟 EPIC UPGRADE! 🌟', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: levelData.color || '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        burstText.setOrigin(0.5);
        burstText.setScrollFactor(0);
        burstText.setDepth(27000);

        // Animate and fade out
        this.scene.tweens.add({
            targets: burstText,
            y: y - 50,
            alpha: 0,
            scale: 1.5,
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                burstText.destroy();
            }
        });
    }

    createCloseButton(x, y) {
        const buttonContainer = this.scene.add.container(x, y);
        this.container.add(buttonContainer);

        const buttonBg = this.scene.add.rectangle(0, 0, 180, 50, 0x666666, 1);
        buttonBg.setStrokeStyle(3, 0xFFFFFF);
        buttonContainer.add(buttonBg);

        const buttonText = this.scene.add.text(0, 0, 'CLOSE', {
            fontSize: '24px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFFFFF'
        });
        buttonText.setOrigin(0.5);
        buttonContainer.add(buttonText);

        const closeZone = this.scene.add.zone(x, y, 180, 50);
        closeZone.setInteractive({ useHandCursor: true });
        closeZone.setScrollFactor(0);
        closeZone.setDepth(26001);
        this.interactiveZones.push(closeZone);

        closeZone.on('pointerover', () => {
            buttonBg.setFillStyle(0x888888);
        });

        closeZone.on('pointerout', () => {
            buttonBg.setFillStyle(0x666666);
        });

        closeZone.on('pointerdown', () => {
            this.close();
        });
    }

    refresh() {
        this.close();
        this.open();
    }

    close() {
        // Clean up interactive zones
        this.interactiveZones.forEach(zone => zone.destroy());
        this.interactiveZones = [];

        // Destroy container
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }

        // Resume game
        this.scene.physics.resume();
        this.scene.gameState.playing = true;

        this.isOpen = false;
        console.log('✨ Ability Upgrade UI closed');
    }
}
