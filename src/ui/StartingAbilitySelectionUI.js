/**
 * StartingAbilitySelectionUI
 * Shows 3 random abilities at game start for player to choose 1
 */
import { getRandomAbilities } from '../config/AbilityPool.js';

export default class StartingAbilitySelectionUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.isOpen = false;
        this.onAbilitySelected = null; // Callback when ability is chosen
        this.interactiveZones = []; // Store zones to destroy later
    }

    /**
     * Open the starting ability selection UI
     * @param {Function} callback - Called when ability is selected with ability object
     */
    open(callback) {
        if (this.isOpen) return;
        this.isOpen = true;
        this.onAbilitySelected = callback;

        // Hide health bar while this menu is open (now in MainScene)
        if (this.scene.hideHealthBar) {
            this.scene.hideHealthBar();
        }

        // Get 3 random abilities
        const randomAbilities = getRandomAbilities(3);

        // Main container (fixed to camera)
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(15000); // High but not blocking

        const panelWidth = 800;
        const panelHeight = 500;
        const panelX = this.scene.cameras.main.width / 2;
        const panelY = this.scene.cameras.main.height / 2;

        // Background overlay using Graphics (like LevelCompletePanel)
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
        const titleText = this.scene.add.text(panelX, panelY - panelHeight/2 + 50, '⚔️ CHOOSE YOUR STARTING ABILITY ⚔️', {
            fontSize: '28px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        titleText.setOrigin(0.5);
        this.container.add(titleText);

        // Subtitle
        const subtitleText = this.scene.add.text(panelX, panelY - panelHeight/2 + 90, 'Select one ability to begin your journey', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#CCCCCC',
            stroke: '#000000',
            strokeThickness: 2
        });
        subtitleText.setOrigin(0.5);
        this.container.add(subtitleText);

        // Create ability cards
        const cardWidth = 220;
        const cardHeight = 300;
        const spacing = 30;
        const totalWidth = (cardWidth * 3) + (spacing * 2);
        const startX = panelX - totalWidth/2 + cardWidth/2;
        const cardY = panelY + 30;

        randomAbilities.forEach((ability, index) => {
            const cardX = startX + (index * (cardWidth + spacing));
            this.createAbilityCard(cardX, cardY, cardWidth, cardHeight, ability);
        });

        console.log('🎯 Starting ability selection opened');
    }

    /**
     * Create an ability card
     */
    createAbilityCard(x, y, width, height, ability) {
        const cardContainer = this.scene.add.container(x, y);
        this.container.add(cardContainer);

        // Card background
        const cardBg = this.scene.add.rectangle(0, 0, width, height, 0x2a2a4a, 1);
        cardBg.setStrokeStyle(3, 0x666666);
        cardContainer.add(cardBg);

        // Ability icon (at top)
        const icon = this.scene.add.image(0, -80, ability.icon);
        icon.setDisplaySize(100, 100);
        cardContainer.add(icon);

        // Ability name (below icon)
        const nameText = this.scene.add.text(0, 0, ability.name, {
            fontSize: '20px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
        });
        nameText.setOrigin(0.5);
        cardContainer.add(nameText);

        // Category badge (below name)
        const categoryBadge = this.scene.add.text(0, 28, ability.category.toUpperCase(), {
            fontSize: '12px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFFFFF',
            backgroundColor: this.getCategoryColor(ability.category),
            padding: { x: 8, y: 4 }
        });
        categoryBadge.setOrigin(0.5);
        cardContainer.add(categoryBadge);

        // Description (middle-bottom area)
        const descText = this.scene.add.text(0, 70, ability.description, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#CCCCCC',
            align: 'center',
            wordWrap: { width: width - 40 }
        });
        descText.setOrigin(0.5);
        cardContainer.add(descText);

        // SELECT button (at bottom)
        const selectButton = this.createSelectButton(0, 120, ability, cardBg);
        cardContainer.add(selectButton);

        // Interactive zone OUTSIDE container (THIS IS THE KEY!)
        const cardZone = this.scene.add.zone(x, y, width, height);
        cardZone.setInteractive({ useHandCursor: true });
        cardZone.setScrollFactor(0);
        cardZone.setDepth(15001); // Above container

        // Store zone for cleanup
        this.interactiveZones.push(cardZone);

        // Hover effect for card
        cardZone.on('pointerover', () => {
            cardBg.setStrokeStyle(3, 0xffd700);
            cardBg.setFillStyle(0x3a3a5a);
        });
        cardZone.on('pointerout', () => {
            cardBg.setStrokeStyle(3, 0x666666);
            cardBg.setFillStyle(0x2a2a4a);
        });
        cardZone.on('pointerdown', () => {
            this.selectAbility(ability);
        });
    }

    /**
     * Create SELECT button
     */
    createSelectButton(x, y, ability, cardBg) {
        const buttonContainer = this.scene.add.container(x, y);

        const buttonBg = this.scene.add.rectangle(0, 0, 140, 40, 0x4CAF50, 1);
        buttonBg.setStrokeStyle(2, 0xFFFFFF);
        // Don't make interactive - zone handles it
        buttonContainer.add(buttonBg);

        const buttonText = this.scene.add.text(0, 0, 'SELECT', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFFFFF'
        });
        buttonText.setOrigin(0.5);
        buttonContainer.add(buttonText);

        // No hover effects here - handled by card zone

        return buttonContainer;
    }

    /**
     * Get color for category badge
     */
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

    /**
     * Handle ability selection
     */
    selectAbility(ability) {
        console.log(`✅ Selected starting ability: ${ability.name} (${ability.id})`);

        // Call callback
        if (this.onAbilitySelected) {
            this.onAbilitySelected(ability);
        }

        // Close UI
        this.close();
    }

    /**
     * Close the UI
     */
    close() {
        // Show health bar again (now in MainScene)
        if (this.scene.showHealthBar) {
            this.scene.showHealthBar();
        }

        // Destroy interactive zones
        this.interactiveZones.forEach(zone => zone.destroy());
        this.interactiveZones = [];

        // Destroy container
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        this.isOpen = false;
        console.log('🎯 Starting ability selection closed');
    }
}
