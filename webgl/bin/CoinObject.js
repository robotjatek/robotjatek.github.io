define(["require", "exports", "gl-matrix", "./Shader", "./SpriteBatch", "./Utils", "./TexturePool", "./AnimatedSprite"], function (require, exports, gl_matrix_1, Shader_1, SpriteBatch_1, Utils_1, TexturePool_1, AnimatedSprite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // TODO: make this a more generic Interactable object or create a more generic object and use it here wrapped or extended
    class CoinObject {
        constructor(position) {
            this.position = position;
            this.sprite = new AnimatedSprite_1.AnimatedSprite(Utils_1.Utils.DefaultSpriteVertices, // Im translating to the position on draw, this way a position can be dynamic
            Utils_1.Utils.CreateTextureCoordinates(0, 0, 1.0 / 10, 1.0)); // TODO: this is hardcoded for coin.png
            this.texture = TexturePool_1.TexturePool.GetInstance().GetTexture('coin.png');
            this.batch = new SpriteBatch_1.SpriteBatch(new Shader_1.Shader('shaders/VertexShader.vert', 'shaders/FragmentShader.frag'), [this.sprite], this.texture);
        }
        IsCollidingWidth(boundingBox) {
            // TODO: make a collision helper class
            const minX = this.position[0];
            const maxX = this.position[0] + 1;
            const minY = this.position[1];
            const maxY = this.position[1] + 1;
            const bbMinX = boundingBox.position[0];
            const bbMaxX = boundingBox.position[0] + boundingBox.size[0];
            const bbMinY = boundingBox.position[1];
            const bbMaxY = boundingBox.position[1] + boundingBox.size[1];
            return bbMinX < maxX && bbMaxX > minX &&
                bbMinY < maxY && bbMaxY > minY;
        }
        Update(elapsedTime) {
            this.sprite.Update(elapsedTime);
        }
        Draw(proj, view) {
            this.batch.Draw(proj, view);
            gl_matrix_1.mat4.translate(this.batch.ModelMatrix, gl_matrix_1.mat4.create(), this.position);
        }
    }
    exports.CoinObject = CoinObject;
});
