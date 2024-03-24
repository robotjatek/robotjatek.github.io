define(["require", "exports", "./Shader", "./Sprite", "./SpriteBatch", "./Utils"], function (require, exports, Shader_1, Sprite_1, SpriteBatch_1, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Layer {
        constructor(Tiles) {
            this.TileMap = new Map();
            this.SpriteBatches = [];
            this.CreateTileMap(Tiles);
            this.CreateSpriteBatches();
        }
        Draw(projectionMatrix, viewMatrix) {
            this.SpriteBatches.forEach((batch) => {
                batch.Draw(projectionMatrix, viewMatrix);
            });
        }
        CreateTileMap(Tiles) {
            Tiles.forEach((tile) => {
                const tileBatch = this.TileMap.get(tile.Texture);
                if (!tileBatch) {
                    this.TileMap.set(tile.Texture, [tile]);
                }
                else {
                    tileBatch.push(tile);
                }
            });
        }
        CreateSpriteBatches() {
            const shader = new Shader_1.Shader("shaders/VertexShader.vert", "shaders/FragmentShader.frag");
            this.TileMap.forEach((tiles, texture) => {
                const sprites = tiles.map((t) => {
                    const vertices = Utils_1.Utils.CreateSpriteVertices(t.PositionX, t.PositionY);
                    return new Sprite_1.Sprite(vertices, Utils_1.Utils.DefaultSpriteTextureCoordinates);
                });
                this.SpriteBatches.push(new SpriteBatch_1.SpriteBatch(shader, sprites, texture));
            });
        }
    }
    exports.Layer = Layer;
});
