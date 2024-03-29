define(["require", "exports", "./Shader", "./Sprite", "./SpriteBatch", "./Utils"], function (require, exports, Shader_1, Sprite_1, SpriteBatch_1, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Layer {
        constructor(Tiles) {
            this.Tiles = Tiles;
            this.SpriteBatches = [];
            const tileMap = this.CreateTileMap(Tiles);
            this.CreateSpriteBatches(tileMap);
        }
        IsCollidingWidth(boundingBox) {
            const collidingTiles = this.Tiles.filter((t) => {
                return t.isCollindingWith(boundingBox);
            });
            return collidingTiles.length > 0;
        }
        Draw(projectionMatrix, viewMatrix) {
            this.SpriteBatches.forEach(batch => batch.Draw(projectionMatrix, viewMatrix));
        }
        /**
         * Creates a texture based map of the tiles to help creating sprite batches.
         * Tiles with the same texture will be put in the same array
         * @param tiles The tile array to map
         * @returns The created tile map
         */
        CreateTileMap(tiles) {
            const tileMap = new Map();
            tiles.forEach((tile) => {
                const tileBatch = tileMap.get(tile.Texture);
                if (!tileBatch) {
                    tileMap.set(tile.Texture, [tile]);
                }
                else {
                    tileBatch.push(tile);
                }
            });
            return tileMap;
        }
        CreateSpriteBatches(tileMap) {
            const shader = new Shader_1.Shader("shaders/VertexShader.vert", "shaders/FragmentShader.frag");
            tileMap.forEach((tiles, texture) => {
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
