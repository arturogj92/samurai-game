/**
 * AbilityShopUI
 * Shop interface showing 3 random abilities per level
 * Based on StartingAbilitySelectionUI structure for reliable interactions
 */
import { getRandomAbilities } from '../config/AbilityPool.js';

export default class AbilityShopUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.isOpen = false;
        this.currentAbilities = []; // 3 random abilities for this level
        this.interactiveZones = []; // Store interactive zones for cleanup
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        // PAUSE GAME while shop is open
        this.scene.physics.pause();
        this.scene.gameState.playing = false;
        console.log('⏸️ Game paused - Ability shop opened');

        // Hide health bar while this menu is open
        if (this.scene.hideHealthBar) {
            this.scene.hideHealthBar();
        }

        // Get 3 random abilities that player doesn't already own
        const ownedIds = this.scene.gameState.ownedAbilities || [];
        this.currentAbilities = getRandomAbilities(3, ownedIds);

        // If no abilities available (player owns them all), show message
        if (this.currentAbilities.length === 0) {
            this.showNoAbilitiesMessage();
            return;
        }

        // Main container (fixed to camera)
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(20000); // High depth

        const panelWidth = 900;
        const panelHeight = 650;
        const panelX = this.scene.cameras.main.width / 2;
        const panelY = this.scene.cameras.main.height / 2;

        // Background overlay using Graphics
        const bgOverlay = this.scene.add.graphics();
        bgOverlay.fillStyle(0x000000, 0.9);
        bgOverlay.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
        bgOverlay.setScrollFactor(0);
        this.container.add(bgOverlay);

        // Panel background with Graphics
        const panelBg = this.scene.add.graphics();

        // Outer glow
        panelBg.fillStyle(0xffd700, 0.3);
        panelBg.fillRoundedRect(panelX - panelWidth/2 - 4, panelY - panelHeight/2 - 4, panelWidth + 8, panelHeight + 8, 20);

        // Main panel
        panelBg.fillStyle(0x1a1a2e, 1);
        panelBg.fillRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 16);

        // Border
        panelBg.lineStyle(4, 0xffd700, 1);
        panelBg.strokeRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 16);

        this.container.add(panelBg);

        // Title
        const titleText = this.scene.add.text(panelX, panelY - panelHeight/2 + 50, '⚔️ ABILITY SHOP ⚔️', {
            fontSize: '32px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        titleText.setOrigin(0.5);
        this.container.add(titleText);

        // Subtitle
        const subtitleText = this.scene.add.text(panelX, panelY - panelHeight/2 + 95, 'Choose one ability to purchase', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#CCCCCC',
            stroke: '#000000',
            strokeThickness: 2
        });
        subtitleText.setOrigin(0.5);
        this.container.add(subtitleText);

        // Gold balance (moved up)
        const goldBalance = this.scene.gameState.resources.gold;
        const goldText = this.scene.add.text(panelX, panelY - panelHeight/2 + 115, `Your Gold: ${goldBalance} 💰`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
        });
        goldText.setOrigin(0.5);
        this.container.add(goldText);

        // Create ability cards (moved up)
        const cardWidth = 260;
        const cardHeight = 380;
        const spacing = 20;
        const totalWidth = (cardWidth * 3) + (spacing * 2);
        const startX = panelX - totalWidth/2 + cardWidth/2;
        const cardY = panelY + 45;

        this.currentAbilities.forEach((ability, index) => {
            const cardX = startX + (index * (cardWidth + spacing));
            const canAfford = goldBalance >= ability.price;
            this.createAbilityCard(cardX, cardY, cardWidth, cardHeight, ability, canAfford);
        });

        // SKIP button at bottom
        this.createSkipButton(panelX, panelY + panelHeight/2 - 40);

        console.log('🛒 Ability shop opened with 3 random abilities:', this.currentAbilities.map(a => a.name));
    }

    createAbilityCard(x, y, width, height, ability, canAfford) {
        const cardContainer = this.scene.add.container(x, y);
        this.container.add(cardContainer);

        // Card background
        const cardBg = this.scene.add.rectangle(0, 0, width, height, 0x2a2a4a, 1);
        cardBg.setStrokeStyle(3, canAfford ? 0x4CAF50 : 0x666666);
        cardContainer.add(cardBg);

        // Ability icon (at top)
        const icon = this.scene.add.image(0, -130, ability.icon);
        icon.setDisplaySize(85, 85);
        if (!canAfford) {
            icon.setTint(0x888888);
        }
        cardContainer.add(icon);

        // Ability name (below icon)
        const nameText = this.scene.add.text(0, -60, ability.name, {
            fontSize: '17px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center',
            wordWrap: { width: width - 30 }
        });
        nameText.setOrigin(0.5);
        cardContainer.add(nameText);

        // Category badge (below name)
        const categoryBadge = this.scene.add.text(0, -30, ability.category.toUpperCase(), {
            fontSize: '10px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFFFFF',
            backgroundColor: this.getCategoryColor(ability.category),
            padding: { x: 6, y: 3 }
        });
        categoryBadge.setOrigin(0.5);
        cardContainer.add(categoryBadge);

        // Description (middle area with MORE space)
        const descText = this.scene.add.text(0, 30, ability.description, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#CCCCCC',
            align: 'center',
            wordWrap: { width: width - 50 },
            lineSpacing: 4
        });
        descText.setOrigin(0.5, 0.5);
        cardContainer.add(descText);

        // Price (moved up closer to description)
        const priceText = this.scene.add.text(0, 125, `${ability.price} 💰`, {
            fontSize: '19px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: canAfford ? '#FFD700' : '#FF4444',
            stroke: '#000000',
            strokeThickness: 2
        });
        priceText.setOrigin(0.5);
        cardContainer.add(priceText);

        // BUY/LOCKED button (moved up)
        const buyButton = this.createBuyButton(0, 160, ability, canAfford);
        cardContainer.add(buyButton);

        // Interactive zone OUTSIDE container for proper interaction (KEY FIX!)
        const cardZone = this.scene.add.zone(x, y, width, height);
        cardZone.setInteractive({ useHandCursor: canAfford });
        cardZone.setScrollFactor(0);
        cardZone.setDepth(20001); // Above container

        // Store zone for cleanup
        this.interactiveZones.push(cardZone);

        // Hover and click effects (only if can afford)
        if (canAfford) {
            cardZone.on('pointerover', () => {
                cardBg.setStrokeStyle(3, 0xffd700);
                cardBg.setFillStyle(0x3a3a5a);
            });
            cardZone.on('pointerout', () => {
                cardBg.setStrokeStyle(3, 0x4CAF50);
                cardBg.setFillStyle(0x2a2a4a);
            });
            cardZone.on('pointerdown', () => {
                console.log(`💰 Buying ability: ${ability.name}`);
                this.buyAbility(ability);
            });
        }
    }

    createBuyButton(x, y, ability, canAfford) {
        const buttonContainer = this.scene.add.container(x, y);

        const bgColor = canAfford ? 0x4CAF50 : 0x666666;
        const buttonBg = this.scene.add.rectangle(0, 0, 140, 40, bgColor, 1);
        buttonBg.setStrokeStyle(2, 0xFFFFFF);
        // Don't make interactive - zone handles it
        buttonContainer.add(buttonBg);

        const buttonText = this.scene.add.text(0, 0, canAfford ? 'BUY' : 'LOCKED', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFFFFF'
        });
        buttonText.setOrigin(0.5);
        buttonContainer.add(buttonText);

        if (!canAfford) {
            buttonContainer.setAlpha(0.6);
        }

        return buttonContainer;
    }

    createSkipButton(x, y) {
        const buttonContainer = this.scene.add.container(x, y);
        this.container.add(buttonContainer);

        const buttonBg = this.scene.add.rectangle(0, 0, 160, 45, 0x666666, 1);
        buttonBg.setStrokeStyle(2, 0xFFFFFF);
        buttonContainer.add(buttonBg);

        const buttonText = this.scene.add.text(0, 0, 'SKIP', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFFFFF'
        });
        buttonText.setOrigin(0.5);
        buttonContainer.add(buttonText);

        // Interactive zone for skip button (OUTSIDE container)
        const skipZone = this.scene.add.zone(x, y, 160, 45);
        skipZone.setInteractive({ useHandCursor: true });
        skipZone.setScrollFactor(0);
        skipZone.setDepth(20001);

        this.interactiveZones.push(skipZone);

        skipZone.on('pointerover', () => {
            buttonBg.setFillStyle(0x888888);
        });
        skipZone.on('pointerout', () => {
            buttonBg.setFillStyle(0x666666);
        });
        skipZone.on('pointerdown', () => {
            console.log('⏭️ Skipping ability shop');
            this.close();
        });
    }

    getCategoryColor(category) {
        const colors = {
            mobility: '#3498db',
            attack: '#e74c3c',
            defense: '#9b59b6',
            buff: '#f39c12',
            summon: '#1abc9c',
            ultimate: '#c0392b'
        };
        return colors[category] || '#7f8c8d';
    }

    buyAbility(ability) {
        // Deduct gold
        this.scene.gameState.resources.gold -= ability.price;

        // Add ability to owned abilities
        if (!this.scene.gameState.ownedAbilities) {
            this.scene.gameState.ownedAbilities = [];
        }
        this.scene.gameState.ownedAbilities.push(ability.id);

        // Register ability with upgrade system (starts at level 1)
        if (this.scene.abilityUpgradeSystem) {
            this.scene.abilityUpgradeSystem.registerAbility(ability.id);
        }

        console.log(`✅ Purchased ability: ${ability.name} (${ability.id}) for ${ability.price} gold`);
        console.log(`📦 Owned abilities:`, this.scene.gameState.ownedAbilities);

        // Close shop
        this.close();

        // Open slot assignment UI to assign the new ability
        if (this.scene.slotAssignmentUI) {
            this.scene.slotAssignmentUI.open(ability.id, (slotKey) => {
                console.log(`📍 Assigned ${ability.name} to slot ${slotKey}`);

                // Assign to selected slot
                this.scene.gameState.abilitySlots[slotKey] = ability.id;

                // Update ability bar UI
                if (this.scene.abilityBarUI) {
                    this.scene.abilityBarUI.update();
                }

                // Resume game if paused
                if (!this.scene.gameState.playing) {
                    this.scene.physics.resume();
                    this.scene.gameState.playing = true;
                }
            });
        } else {
            console.error('⚠️ SlotAssignmentUI not found!');
            // Resume game anyway
            if (!this.scene.gameState.playing) {
                this.scene.physics.resume();
                this.scene.gameState.playing = true;
            }
        }
    }

    showNoAbilitiesMessage() {
        // Main container (fixed to camera)
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(20000);

        const panelWidth = 500;
        const panelHeight = 300;
        const panelX = this.scene.cameras.main.width / 2;
        const panelY = this.scene.cameras.main.height / 2;

        // Background overlay
        const bgOverlay = this.scene.add.graphics();
        bgOverlay.fillStyle(0x000000, 0.9);
        bgOverlay.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
        bgOverlay.setScrollFactor(0);
        this.container.add(bgOverlay);

        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0xffd700, 0.3);
        panelBg.fillRoundedRect(panelX - panelWidth/2 - 4, panelY - panelHeight/2 - 4, panelWidth + 8, panelHeight + 8, 20);
        panelBg.fillStyle(0x1a1a2e, 1);
        panelBg.fillRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 16);
        panelBg.lineStyle(4, 0xffd700, 1);
        panelBg.strokeRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 16);
        this.container.add(panelBg);

        const messageText = this.scene.add.text(panelX, panelY - 30, '🎉 CONGRATULATIONS! 🎉', {
            fontSize: '28px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        messageText.setOrigin(0.5);
        this.container.add(messageText);

        const subText = this.scene.add.text(panelX, panelY + 20, 'You own all available abilities!', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        });
        subText.setOrigin(0.5);
        this.container.add(subText);

        // Continue button
        this.createContinueButton(panelX, panelY + 80);
    }

    createContinueButton(x, y) {
        const buttonContainer = this.scene.add.container(x, y);
        this.container.add(buttonContainer);

        const buttonBg = this.scene.add.rectangle(0, 0, 160, 45, 0x4CAF50, 1);
        buttonBg.setStrokeStyle(2, 0xFFFFFF);
        buttonContainer.add(buttonBg);

        const buttonText = this.scene.add.text(0, 0, 'CONTINUE', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFFFFF'
        });
        buttonText.setOrigin(0.5);
        buttonContainer.add(buttonText);

        // Interactive zone
        const continueZone = this.scene.add.zone(x, y, 160, 45);
        continueZone.setInteractive({ useHandCursor: true });
        continueZone.setScrollFactor(0);
        continueZone.setDepth(20001);

        this.interactiveZones.push(continueZone);

        continueZone.on('pointerover', () => {
            buttonBg.setFillStyle(0x45a049);
        });
        continueZone.on('pointerout', () => {
            buttonBg.setFillStyle(0x4CAF50);
        });
        continueZone.on('pointerdown', () => {
            this.close();
        });
    }

    close() {
        // Show health bar again
        if (this.scene.showHealthBar) {
            this.scene.showHealthBar();
        }

        // Destroy interactive zones
        this.interactiveZones.forEach(zone => zone.destroy());
        this.interactiveZones = [];

        // Destroy container (which contains all UI elements)
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }

        // RESUME GAME only if closing without opening another modal
        // (when SKIP is pressed - purchaseAbility will open SlotAssignmentUI which keeps game paused)
        if (!this.scene.gameState.playing) {
            // Add a small delay to check if SlotAssignmentUI will open
            this.scene.time.delayedCall(50, () => {
                // Only resume if game is still paused (no other modal opened)
                if (!this.scene.gameState.playing) {
                    this.scene.physics.resume();
                    this.scene.gameState.playing = true;
                    console.log('▶️ Game resumed - Shop closed with SKIP');
                }
            });
        }

        this.isOpen = false;
        console.log('🛒 Ability shop closed');
    }
}
