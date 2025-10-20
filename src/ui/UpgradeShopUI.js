/**
 * UpgradeShopUI.js
 * UI for purchasing permanent stat upgrades
 * Organized by category with visual feedback
 */

import { UPGRADE_POOL, getUpgradesByCategory, getCategories } from '../config/UpgradePool.js';

export default class UpgradeShopUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.isOpen = false;
        this.interactiveZones = [];
        this.currentCategory = 'attack'; // Default category
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        console.log('💪 Opening Upgrade Shop');

        // Pause game
        this.scene.physics.pause();
        this.scene.gameState.playing = false;

        // Main container
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(25000);

        const { width, height } = this.scene.cameras.main;

        // Background overlay
        const bgOverlay = this.scene.add.graphics();
        bgOverlay.fillStyle(0x000000, 0.92);
        bgOverlay.fillRect(0, 0, width, height);
        bgOverlay.setScrollFactor(0);
        this.container.add(bgOverlay);

        // Panel dimensions
        const panelWidth = 900;
        const panelHeight = 650;
        const panelX = width / 2;
        const panelY = height / 2;

        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0x8B00FF, 0.3);
        panelBg.fillRoundedRect(panelX - panelWidth/2 - 4, panelY - panelHeight/2 - 4, panelWidth + 8, panelHeight + 8, 20);
        panelBg.fillStyle(0x1a1a2e, 1);
        panelBg.fillRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 16);
        panelBg.lineStyle(4, 0x8B00FF, 1);
        panelBg.strokeRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 16);
        this.container.add(panelBg);

        // Title
        const titleText = this.scene.add.text(panelX, panelY - panelHeight/2 + 40, '💪 PERMANENT UPGRADES 💪', {
            fontSize: '36px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#8B00FF',
            stroke: '#000000',
            strokeThickness: 5
        });
        titleText.setOrigin(0.5);
        this.container.add(titleText);

        // Gold display
        const goldText = this.scene.add.text(panelX, panelY - panelHeight/2 + 85, `Your Gold: ${this.scene.gameState.resources.gold} 💰`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
        });
        goldText.setOrigin(0.5);
        this.container.add(goldText);

        // Category tabs
        this.createCategoryTabs(panelX, panelY - panelHeight/2 + 130);

        // Upgrade cards
        this.createUpgradeCards(panelX, panelY - 50);

        // Close button
        this.createCloseButton(panelX, panelY + panelHeight/2 - 40);
    }

    createCategoryTabs(centerX, y) {
        const categories = [
            { id: 'attack', name: 'ATTACK', icon: '⚔️', color: 0xFF4444 },
            { id: 'defense', name: 'DEFENSE', icon: '🛡️', color: 0x4444FF },
            { id: 'mobility', name: 'MOBILITY', icon: '👟', color: 0x44FF44 },
            { id: 'utility', name: 'UTILITY', icon: '💰', color: 0xFFAA00 }
        ];

        const tabWidth = 200;
        const tabHeight = 50;
        const spacing = 10;
        const totalWidth = (tabWidth * categories.length) + (spacing * (categories.length - 1));
        const startX = centerX - totalWidth / 2 + tabWidth / 2;

        categories.forEach((cat, index) => {
            const tabX = startX + (index * (tabWidth + spacing));
            const isActive = this.currentCategory === cat.id;

            const tabContainer = this.scene.add.container(tabX, y);
            this.container.add(tabContainer);

            // Tab background
            const tabBg = this.scene.add.rectangle(0, 0, tabWidth, tabHeight, isActive ? cat.color : 0x333333, 1);
            tabBg.setStrokeStyle(3, isActive ? 0xFFFFFF : 0x666666);
            tabContainer.add(tabBg);

            // Tab text
            const tabText = this.scene.add.text(0, 0, `${cat.icon} ${cat.name}`, {
                fontSize: '16px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: isActive ? '#FFFFFF' : '#999999'
            });
            tabText.setOrigin(0.5);
            tabContainer.add(tabText);

            // Interactive zone
            const tabZone = this.scene.add.zone(tabX, y, tabWidth, tabHeight);
            tabZone.setInteractive({ useHandCursor: true });
            tabZone.setScrollFactor(0);
            tabZone.setDepth(25001);
            this.interactiveZones.push(tabZone);

            tabZone.on('pointerover', () => {
                if (this.currentCategory !== cat.id) {
                    tabBg.setFillStyle(0x555555);
                }
            });

            tabZone.on('pointerout', () => {
                if (this.currentCategory !== cat.id) {
                    tabBg.setFillStyle(0x333333);
                }
            });

            tabZone.on('pointerdown', () => {
                if (this.currentCategory !== cat.id) {
                    this.currentCategory = cat.id;
                    this.refresh();
                }
            });
        });
    }

    createUpgradeCards(centerX, startY) {
        const upgrades = getUpgradesByCategory(this.currentCategory);
        const cardWidth = 250;
        const cardHeight = 180;
        const spacing = 20;
        const columns = 3;

        upgrades.forEach((upgrade, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;

            const totalRowWidth = (cardWidth * columns) + (spacing * (columns - 1));
            const startX = centerX - totalRowWidth / 2 + cardWidth / 2;

            const cardX = startX + (col * (cardWidth + spacing));
            const cardY = startY + (row * (cardHeight + spacing));

            this.createUpgradeCard(cardX, cardY, cardWidth, cardHeight, upgrade);
        });
    }

    createUpgradeCard(x, y, width, height, upgrade) {
        const currentLevel = this.scene.upgradeSystem.getUpgradeLevel(upgrade.id);
        const nextLevel = currentLevel + 1;
        const canUpgrade = nextLevel <= upgrade.maxLevel;
        const nextLevelData = canUpgrade ? upgrade.levels.find(l => l.level === nextLevel) : null;
        const canAfford = nextLevelData && this.scene.gameState.resources.gold >= nextLevelData.price;

        const cardContainer = this.scene.add.container(x, y);
        this.container.add(cardContainer);

        // Card background
        const bgColor = canUpgrade ? (canAfford ? 0x2a4a2a : 0x2a2a4a) : 0x3a3a3a;
        const borderColor = canUpgrade ? (canAfford ? 0x00FF00 : 0x666666) : 0x444444;

        const cardBg = this.scene.add.rectangle(0, 0, width, height, bgColor, 1);
        cardBg.setStrokeStyle(3, borderColor);
        cardContainer.add(cardBg);

        // Icon
        const iconText = this.scene.add.text(0, -60, upgrade.icon, {
            fontSize: '40px'
        });
        iconText.setOrigin(0.5);
        cardContainer.add(iconText);

        // Name
        const nameText = this.scene.add.text(0, -25, upgrade.name, {
            fontSize: '16px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center',
            wordWrap: { width: width - 20 }
        });
        nameText.setOrigin(0.5);
        cardContainer.add(nameText);

        // Level indicator
        const levelText = this.scene.add.text(0, 0, `Level: ${currentLevel}/${upgrade.maxLevel}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: currentLevel === upgrade.maxLevel ? '#00FF00' : '#FFFFFF',
            fontStyle: currentLevel === upgrade.maxLevel ? 'bold' : 'normal'
        });
        levelText.setOrigin(0.5);
        cardContainer.add(levelText);

        // Description (next level bonus)
        if (canUpgrade && nextLevelData) {
            const desc = upgrade.description.replace('{amount}', nextLevelData.amount);
            const descText = this.scene.add.text(0, 25, desc, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#CCCCCC',
                align: 'center',
                wordWrap: { width: width - 30 }
            });
            descText.setOrigin(0.5);
            cardContainer.add(descText);

            // Price and button
            const priceText = this.scene.add.text(0, 58, `${nextLevelData.price} 💰`, {
                fontSize: '18px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: canAfford ? '#FFD700' : '#FF4444'
            });
            priceText.setOrigin(0.5);
            cardContainer.add(priceText);
        } else if (currentLevel === upgrade.maxLevel) {
            const maxText = this.scene.add.text(0, 40, 'MAX LEVEL', {
                fontSize: '18px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#00FF00'
            });
            maxText.setOrigin(0.5);
            cardContainer.add(maxText);
        }

        // Make card interactive if can upgrade and afford
        if (canUpgrade && canAfford) {
            const cardZone = this.scene.add.zone(x, y, width, height);
            cardZone.setInteractive({ useHandCursor: true });
            cardZone.setScrollFactor(0);
            cardZone.setDepth(25001);
            this.interactiveZones.push(cardZone);

            cardZone.on('pointerover', () => {
                cardBg.setFillStyle(0x3a5a3a);
                cardBg.setStrokeStyle(3, 0x00FF00);
                // Show stat preview
                this.showUpgradePreview(upgrade.id, nextLevelData);
            });

            cardZone.on('pointerout', () => {
                cardBg.setFillStyle(0x2a4a2a);
                cardBg.setStrokeStyle(3, 0x00FF00);
                // Hide stat preview
                this.hideUpgradePreview();
            });

            cardZone.on('pointerdown', () => {
                const success = this.scene.upgradeSystem.purchaseUpgrade(upgrade.id);
                if (success) {
                    this.refresh(); // Refresh UI after purchase
                }
            });
        }
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
        closeZone.setDepth(25001);
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

    /**
     * Show preview of how an upgrade will affect player stats
     */
    showUpgradePreview(upgradeId, nextLevelData) {
        if (!this.scene.playerStatsUI) return;

        const player = this.scene.player;
        if (!player) return;

        // Get current upgrade level
        const currentLevel = this.scene.upgradeSystem.getUpgradeLevel(upgradeId);
        const upgrade = UPGRADE_POOL[upgradeId];

        let previewText = '';
        let statKey = null;

        switch (upgradeId) {
            case 'attackSpeed': {
                // Attack speed affects fire rate
                const autoFire = this.scene.autoFireSystem;
                if (!autoFire) return;

                const baseFireRate = 500; // Base fire rate from AutoFireSystem

                // Current fire rate with current level
                let currentFireRate = baseFireRate;
                if (currentLevel > 0) {
                    const currentLevelData = upgrade.levels.find(l => l.level === currentLevel);
                    const currentBonus = 1.0 + (currentLevelData.amount / 100);
                    currentFireRate = Math.floor(baseFireRate / currentBonus);
                }

                // Future fire rate with next level
                const futureBonus = 1.0 + (nextLevelData.amount / 100);
                const futureFireRate = Math.floor(baseFireRate / futureBonus);

                statKey = 'fireRate';
                previewText = `${currentFireRate}→${futureFireRate}ms`;
                break;
            }

            case 'damage': {
                // Damage is replaced, not accumulated
                const baseDamage = 1.0;

                let current = baseDamage;
                if (currentLevel > 0) {
                    const currentLevelData = upgrade.levels.find(l => l.level === currentLevel);
                    current = baseDamage + (currentLevelData.amount / 100);
                }

                const future = baseDamage + (nextLevelData.amount / 100);

                statKey = 'damage';
                previewText = `${current.toFixed(2)}→${future.toFixed(2)}x`;
                break;
            }

            case 'maxHealth': {
                // Max health is base + bonus
                const baseHealth = 100;

                let current = baseHealth;
                if (currentLevel > 0) {
                    const currentLevelData = upgrade.levels.find(l => l.level === currentLevel);
                    current = baseHealth + currentLevelData.amount;
                }

                const future = baseHealth + nextLevelData.amount;

                statKey = 'maxHealth';
                previewText = `${Math.floor(current)}→${Math.floor(future)}`;
                break;
            }

            case 'moveSpeed': {
                // Movement speed is base * (1 + bonus)
                const baseSpeed = 200;

                let current = baseSpeed;
                if (currentLevel > 0) {
                    const currentLevelData = upgrade.levels.find(l => l.level === currentLevel);
                    current = baseSpeed * (1 + currentLevelData.amount / 100);
                }

                const future = baseSpeed * (1 + nextLevelData.amount / 100);

                statKey = 'speed';
                previewText = `${Math.floor(current)}→${Math.floor(future)}`;
                break;
            }

            // For other upgrades, we could show a different indicator
            // but for now we'll just skip them since they don't have
            // corresponding stats in PlayerStatsUI
            default:
                // No preview for this upgrade type yet
                return;
        }

        if (statKey && previewText) {
            this.scene.playerStatsUI.showStatPreview(statKey, previewText);
        }
    }

    /**
     * Hide upgrade preview
     */
    hideUpgradePreview() {
        if (!this.scene.playerStatsUI) return;
        this.scene.playerStatsUI.hideStatPreview();
    }

    close() {
        // Hide any active preview
        this.hideUpgradePreview();

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
        console.log('💪 Upgrade Shop closed');
    }
}
