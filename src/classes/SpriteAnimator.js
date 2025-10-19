/**
 * SpriteAnimator Class
 * Handles sprite sheet animations
 */

export class SpriteAnimator {
    constructor(spritePath, frameWidth, frameHeight, frameCount, fps = 10, loop = true) {
        this.image = new Image();
        this.image.src = spritePath;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.fps = fps;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameDelay = 1000 / fps; // ms per frame
        this.loaded = false;
        this.loop = loop; // Whether animation loops or stops at last frame
        this.finished = false; // True when non-looping animation reaches end

        this.image.onload = () => {
            this.loaded = true;
        };
    }

    update(deltaTime) {
        if (!this.loaded) return;
        if (this.finished) return; // Don't update if animation is finished

        this.frameTimer += deltaTime;

        if (this.frameTimer >= this.frameDelay) {
            if (this.loop) {
                // Loop animation
                this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            } else {
                // Play once and stop at last frame
                this.currentFrame++;
                if (this.currentFrame >= this.frameCount) {
                    this.currentFrame = this.frameCount - 1; // Stay on last frame
                    this.finished = true;
                }
            }
            this.frameTimer = 0;
        }
    }

    draw(ctx, x, y, scale = 1, flipH = false) {
        if (!this.loaded) return;

        const drawWidth = this.frameWidth * scale;
        const drawHeight = this.frameHeight * scale;

        // Calculate destination position (centered on x, y)
        let destX = x - drawWidth / 2;
        let destY = y - drawHeight / 2;

        if (flipH) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(-1, 1);

            ctx.drawImage(
                this.image,
                this.currentFrame * this.frameWidth, // source x
                0, // source y
                this.frameWidth, // source width
                this.frameHeight, // source height
                -drawWidth / 2, // dest x (centered)
                -drawHeight / 2, // dest y (centered)
                drawWidth, // dest width
                drawHeight // dest height
            );

            ctx.restore();
        } else {
            // No flip - direct draw without save/restore
            ctx.drawImage(
                this.image,
                this.currentFrame * this.frameWidth, // source x
                0, // source y
                this.frameWidth, // source width
                this.frameHeight, // source height
                destX, // dest x (centered)
                destY, // dest y (centered)
                drawWidth, // dest width
                drawHeight // dest height
            );
        }
    }

    reset() {
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.finished = false;
    }
}
