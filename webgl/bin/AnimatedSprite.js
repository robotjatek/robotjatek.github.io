define(["require", "exports", "gl-matrix", "./Sprite"], function (require, exports, gl_matrix_1, Sprite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AnimatedSprite extends Sprite_1.Sprite {
        constructor(vertices, initialTextureCoordinates) {
            super(vertices, initialTextureCoordinates);
            this.frameNumber = 0;
            this.currentFrameTime = 0;
        }
        Update(elapsedTime) {
            super.Update(elapsedTime);
            this.currentFrameTime += elapsedTime;
            if (this.currentFrameTime > 66) {
                if (this.frameNumber === 9) {
                    this.textureOffset = gl_matrix_1.vec2.fromValues(0, 0);
                    this.frameNumber = 0;
                }
                this.frameNumber++;
                gl_matrix_1.vec2.add(this.textureOffset, this.textureOffset, gl_matrix_1.vec2.fromValues(1.0 / 10, 0)); // TODO: this is hardcoded for coin.png
                this.currentFrameTime = 0;
            }
        }
    }
    exports.AnimatedSprite = AnimatedSprite;
});
