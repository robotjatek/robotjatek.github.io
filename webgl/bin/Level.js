define(["require", "exports", "gl-matrix", "./Background", "./Layer", "./Shader", "./SpriteBatch", "./TexturePool", "./Tile", "./Environment"], function (require, exports, gl_matrix_1, Background_1, Layer_1, Shader_1, SpriteBatch_1, TexturePool_1, Tile_1, Environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /*
    TODO:
    Level file format
    Binary
    ----------------------------
    Header:
    0-2: "LVL"
    3-4: Width (unsigned int)
    5-6: Height (unsigned int)
    7-8: Number of layers
    ----------------------------
    Tile data 9-[Width*Height*Number_of_layers * 2]:
    2 bytes of tile data. Indexes tile dictionary
    ----------------------------
    Tile materials:
    [Width*Height*Number_of_layers * 2 + 1]-End of file
    {'texture path', opacity}
    */
    class Level {
        constructor(levelName) {
            this.BackgroundViewMatrix = gl_matrix_1.mat4.create();
            const texturePool = TexturePool_1.TexturePool.GetInstance();
            const tile = new Tile_1.Tile(10, 11, texturePool.GetTexture("ground0.png"));
            const tile2 = new Tile_1.Tile(12, 11, texturePool.GetTexture("ground0.png"));
            const tile3 = new Tile_1.Tile(13, 11, texturePool.GetTexture("ground0.png"));
            const tile4 = new Tile_1.Tile(5, 14, texturePool.GetTexture("ground0.png"));
            const tile5 = new Tile_1.Tile(6, 14, texturePool.GetTexture("ground0.png"));
            const tiles = [tile, tile2, tile3, tile4, tile5];
            // Bottom tiles of the level
            for (let j = Environment_1.Environment.VerticalTiles - 2; j < Environment_1.Environment.VerticalTiles; j++) {
                for (let i = 0; i < Environment_1.Environment.HorizontalTiles; i++) {
                    tiles.push(new Tile_1.Tile(i, j, texturePool.GetTexture("ground0.png")));
                }
            }
            this.Layers = [new Layer_1.Layer(tiles)];
            const shader = new Shader_1.Shader("shaders/VertexShader.vert", "shaders/FragmentShader.frag");
            this.Background = new SpriteBatch_1.SpriteBatch(shader, [new Background_1.Background()], texturePool.GetTexture("bg.jpg"));
        }
        Draw(projectionMatrix, viewMatrix) {
            this.Background.Draw(projectionMatrix, this.BackgroundViewMatrix);
            this.Layers.forEach((layer) => {
                layer.Draw(projectionMatrix, viewMatrix);
            });
        }
        CollideWidthLayer(boundingBox, layerId) {
            return this.Layers[layerId].IsCollidingWidth(boundingBox);
        }
        get MainLayer() {
            return this.Layers[0];
        }
    }
    exports.Level = Level;
});
