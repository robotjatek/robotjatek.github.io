define("Sprite", ["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sprite = void 0;
    class Sprite {
        constructor(vertices, textureCoordinates) {
            this.Vertices = vertices;
            this.TextureCoordinates = textureCoordinates;
            this.textureOffset = gl_matrix_1.vec2.create();
        }
        Update(elapsedTime) {
        }
    }
    exports.Sprite = Sprite;
});
define("AnimatedSprite", ["require", "exports", "gl-matrix", "Sprite"], function (require, exports, gl_matrix_2, Sprite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AnimatedSprite = void 0;
    // TODO: somehow I should reuse the for all animated sprites, like projectiles and enemies
    class AnimatedSprite extends Sprite_1.Sprite {
        constructor(vertices, initialTextureCoordinates) {
            super(vertices, initialTextureCoordinates);
            this.frameNumber = 0;
            this.currentFrameTime = 0;
        }
        Update(elapsedTime) {
            super.Update(elapsedTime);
            this.currentFrameTime += elapsedTime;
            if (this.currentFrameTime > 64) {
                if (this.frameNumber === 9) {
                    this.textureOffset = gl_matrix_2.vec2.fromValues(0, 0);
                    this.frameNumber = 0;
                }
                this.frameNumber++;
                gl_matrix_2.vec2.add(this.textureOffset, this.textureOffset, gl_matrix_2.vec2.fromValues(1.0 / 10, 0)); // TODO: this is hardcoded for coin.png
                this.currentFrameTime = 0;
            }
        }
    }
    exports.AnimatedSprite = AnimatedSprite;
});
define("Environment", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Environment = void 0;
    class Environment {
    }
    exports.Environment = Environment;
    Environment.VerticalTiles = 18;
    Environment.HorizontalTiles = 32;
    Environment.RenderBoundingBoxes = true;
});
define("Background", ["require", "exports", "Environment", "Sprite"], function (require, exports, Environment_1, Sprite_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Background = void 0;
    /**
     * Background is a full screen sprite
     */
    class Background extends Sprite_2.Sprite {
        constructor() {
            const vertices = [
                0.0, 0.0, 0.0,
                Environment_1.Environment.HorizontalTiles, 0.0, 0.0,
                0, Environment_1.Environment.VerticalTiles, 0.0,
                0, Environment_1.Environment.VerticalTiles, 0.0,
                Environment_1.Environment.HorizontalTiles, 0, 0.0,
                Environment_1.Environment.HorizontalTiles, Environment_1.Environment.VerticalTiles, 0.0,
            ];
            super(vertices, [
                0, 0,
                1, 0,
                0, 1,
                0, 1,
                1, 0,
                1, 1,
            ]);
        }
    }
    exports.Background = Background;
});
define("BoundingBox", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BoundingBox = void 0;
    // TODO: dynamic bb size for animated enemies
    class BoundingBox {
        constructor(position, size) {
            this.position = position;
            this.size = size;
        }
        IsCollidingWith(otherBB) {
            const minX = this.position[0];
            const maxX = this.position[0] + this.size[0];
            const minY = this.position[1];
            const maxY = this.position[1] + this.size[1];
            const bbMinX = otherBB.position[0];
            const bbMaxX = otherBB.position[0] + otherBB.size[0];
            const bbMinY = otherBB.position[1];
            const bbMaxY = otherBB.position[1] + otherBB.size[1];
            return bbMinX < maxX && bbMaxX > minX &&
                bbMinY < maxY && bbMaxY > minY;
        }
    }
    exports.BoundingBox = BoundingBox;
});
define("ICollider", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("ShaderPool", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShaderPool = void 0;
    class ShaderPool {
        constructor() {
            this.shaderSources = new Map();
        }
        static GetInstance() {
            if (!this.instance) {
                this.instance = new ShaderPool();
            }
            return this.instance;
        }
        async LoadShaderSource(path) {
            const source = this.shaderSources.get(path);
            if (!source) {
                const loaded = await this.GetSourceFromUrl(path);
                this.shaderSources.set(path, loaded);
                return loaded;
            }
            return source;
        }
        async GetSourceFromUrl(url) {
            return await (await fetch(url)).text();
        }
    }
    exports.ShaderPool = ShaderPool;
});
define("WebGLUtils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebGLUtils = exports.gl = void 0;
    class WebGLUtils {
        static CreateGLRenderingContext(canvas) {
            exports.gl = canvas.getContext('webgl2');
            if (!exports.gl) {
                throw new Error('Failed to create rendering context');
            }
        }
    }
    exports.WebGLUtils = WebGLUtils;
});
define("Shader", ["require", "exports", "ShaderPool", "WebGLUtils"], function (require, exports, ShaderPool_1, WebGLUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Shader = void 0;
    class Shader {
        constructor(vertexShader, fragmentShader) {
            this.program = this.createProgram(vertexShader, fragmentShader);
            this.valid = true;
        }
        static async Create(vertexPath, fragmentPath) {
            const vertexShader = await Shader.LoadShader(vertexPath, WebGLUtils_1.gl.VERTEX_SHADER);
            const fragmentShader = await Shader.LoadShader(fragmentPath, WebGLUtils_1.gl.FRAGMENT_SHADER);
            const shader = new Shader(vertexShader, fragmentShader);
            WebGLUtils_1.gl.deleteShader(vertexShader);
            WebGLUtils_1.gl.deleteShader(fragmentShader);
            return shader;
        }
        Use() {
            if (!this.valid) {
                throw new Error("Trying to use a deleted shader program!");
            }
            WebGLUtils_1.gl.useProgram(this.program);
        }
        GetProgram() {
            if (!this.valid) {
                throw new Error("Trying to get a deleted shader program!");
            }
            return this.program;
        }
        Delete() {
            this.valid = false;
            WebGLUtils_1.gl.deleteProgram(this.program);
        }
        SetFloatUniform(name, value) {
            this.Use();
            const location = WebGLUtils_1.gl.getUniformLocation(this.program, name);
            WebGLUtils_1.gl.uniform1f(location, value);
        }
        SetVec2Uniform(name, value) {
            this.Use();
            const location = WebGLUtils_1.gl.getUniformLocation(this.program, name);
            WebGLUtils_1.gl.uniform2fv(location, value);
        }
        SetVec4Uniform(name, value) {
            this.Use();
            const location = WebGLUtils_1.gl.getUniformLocation(this.program, name);
            WebGLUtils_1.gl.uniform4fv(location, value);
        }
        createProgram(vertex, fragment) {
            const program = WebGLUtils_1.gl.createProgram();
            WebGLUtils_1.gl.attachShader(program, vertex);
            WebGLUtils_1.gl.attachShader(program, fragment);
            WebGLUtils_1.gl.linkProgram(program);
            WebGLUtils_1.gl.detachShader(program, vertex);
            WebGLUtils_1.gl.detachShader(program, fragment);
            return program;
        }
        static async LoadShader(elementPath, type) {
            const id = WebGLUtils_1.gl.createShader(type);
            const src = await ShaderPool_1.ShaderPool.GetInstance().LoadShaderSource(elementPath);
            WebGLUtils_1.gl.shaderSource(id, src);
            WebGLUtils_1.gl.compileShader(id);
            const error = WebGLUtils_1.gl.getShaderInfoLog(id);
            if (error !== undefined && error.length > 0) {
                throw new Error(`Failed to compile shader (${elementPath}): ` + error);
            }
            return id;
        }
    }
    exports.Shader = Shader;
});
define("IDisposable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Texture", ["require", "exports", "WebGLUtils"], function (require, exports, WebGLUtils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Texture = void 0;
    class Texture {
        constructor(image) {
            this.texture = WebGLUtils_2.gl.createTexture();
            WebGLUtils_2.gl.bindTexture(WebGLUtils_2.gl.TEXTURE_2D, this.texture);
            WebGLUtils_2.gl.texParameteri(WebGLUtils_2.gl.TEXTURE_2D, WebGLUtils_2.gl.TEXTURE_MIN_FILTER, WebGLUtils_2.gl.NEAREST_MIPMAP_LINEAR);
            WebGLUtils_2.gl.texParameteri(WebGLUtils_2.gl.TEXTURE_2D, WebGLUtils_2.gl.TEXTURE_MAG_FILTER, WebGLUtils_2.gl.NEAREST);
            WebGLUtils_2.gl.texParameteri(WebGLUtils_2.gl.TEXTURE_2D, WebGLUtils_2.gl.TEXTURE_WRAP_S, WebGLUtils_2.gl.CLAMP_TO_EDGE);
            WebGLUtils_2.gl.texParameteri(WebGLUtils_2.gl.TEXTURE_2D, WebGLUtils_2.gl.TEXTURE_WRAP_T, WebGLUtils_2.gl.CLAMP_TO_EDGE);
            WebGLUtils_2.gl.texImage2D(WebGLUtils_2.gl.TEXTURE_2D, 0, WebGLUtils_2.gl.RGBA, WebGLUtils_2.gl.RGBA, WebGLUtils_2.gl.UNSIGNED_BYTE, image);
            WebGLUtils_2.gl.generateMipmap(WebGLUtils_2.gl.TEXTURE_2D);
            this.height = image.height;
            this.width = image.width;
            this.valid = true;
        }
        static async Create(path) {
            const image = await this.LoadImage(path);
            return new Texture(image);
        }
        GetTexture() {
            if (!this.valid) {
                throw new Error("Trying to get a deleted texture!");
            }
            return this.texture;
        }
        Delete() {
            WebGLUtils_2.gl.deleteTexture(this.texture);
        }
        get Width() {
            return this.width;
        }
        get Height() {
            return this.height;
        }
        static async LoadImage(path) {
            const blob = await (await fetch(path)).blob();
            const bitmap = await createImageBitmap(blob);
            return bitmap;
        }
    }
    exports.Texture = Texture;
});
define("SpriteBatch", ["require", "exports", "gl-matrix", "WebGLUtils"], function (require, exports, gl_matrix_3, WebGLUtils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpriteBatch = void 0;
    class SpriteBatch {
        constructor(shader, sprites, texture) {
            this.ModelMatrix = gl_matrix_3.mat4.create();
            this.BatchShader = shader;
            this.Texture = texture;
            this.Vertices = [];
            this.TextureCoordinates = [];
            sprites.forEach((sprite) => {
                this.Vertices = this.Vertices.concat(sprite.Vertices);
                this.TextureCoordinates = this.TextureCoordinates.concat(sprite.TextureCoordinates);
                this.spr = sprite;
            });
            this.ModelMatrix = gl_matrix_3.mat4.identity(this.ModelMatrix);
            this.VertexBuffer = WebGLUtils_3.gl.createBuffer();
            WebGLUtils_3.gl.bindBuffer(WebGLUtils_3.gl.ARRAY_BUFFER, this.VertexBuffer);
            WebGLUtils_3.gl.bufferData(WebGLUtils_3.gl.ARRAY_BUFFER, new Float32Array(this.Vertices), WebGLUtils_3.gl.STATIC_DRAW);
            this.TextureCoordinateBuffer = WebGLUtils_3.gl.createBuffer();
            WebGLUtils_3.gl.bindBuffer(WebGLUtils_3.gl.ARRAY_BUFFER, this.TextureCoordinateBuffer);
            WebGLUtils_3.gl.bufferData(WebGLUtils_3.gl.ARRAY_BUFFER, new Float32Array(this.TextureCoordinates), WebGLUtils_3.gl.STATIC_DRAW);
        }
        Dispose() {
            // Shader & texture are external dependencies: they are not disposed here
            this.Vertices = null;
            this.TextureCoordinates = null;
            WebGLUtils_3.gl.deleteBuffer(this.VertexBuffer);
            WebGLUtils_3.gl.deleteBuffer(this.TextureCoordinateBuffer);
        }
        Draw(projectionMatrix, viewMatrix) {
            const shaderProgram = this.BatchShader.GetProgram();
            this.BatchShader.Use();
            const attribLocation = WebGLUtils_3.gl.getAttribLocation(shaderProgram, "a_pos");
            const textureCoordinateAttribLocation = WebGLUtils_3.gl.getAttribLocation(shaderProgram, "a_texture_coordinate");
            WebGLUtils_3.gl.bindBuffer(WebGLUtils_3.gl.ARRAY_BUFFER, this.VertexBuffer);
            WebGLUtils_3.gl.enableVertexAttribArray(attribLocation);
            WebGLUtils_3.gl.vertexAttribPointer(attribLocation, 3, WebGLUtils_3.gl.FLOAT, false, 0, 0);
            WebGLUtils_3.gl.bindBuffer(WebGLUtils_3.gl.ARRAY_BUFFER, this.TextureCoordinateBuffer);
            WebGLUtils_3.gl.enableVertexAttribArray(textureCoordinateAttribLocation);
            WebGLUtils_3.gl.vertexAttribPointer(textureCoordinateAttribLocation, 2, WebGLUtils_3.gl.FLOAT, false, 0, 0);
            const projectionLocation = WebGLUtils_3.gl.getUniformLocation(shaderProgram, "projection");
            WebGLUtils_3.gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
            const viewLocation = WebGLUtils_3.gl.getUniformLocation(shaderProgram, "view");
            WebGLUtils_3.gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
            const modelLocation = WebGLUtils_3.gl.getUniformLocation(shaderProgram, "model");
            WebGLUtils_3.gl.uniformMatrix4fv(modelLocation, false, this.ModelMatrix);
            if (this.Texture) {
                WebGLUtils_3.gl.activeTexture(WebGLUtils_3.gl.TEXTURE0);
                WebGLUtils_3.gl.bindTexture(WebGLUtils_3.gl.TEXTURE_2D, this.Texture.GetTexture());
                const textureLocation = WebGLUtils_3.gl.getUniformLocation(shaderProgram, "u_sampler");
                WebGLUtils_3.gl.uniform1i(textureLocation, 0);
            }
            const textureOffsetLocation = WebGLUtils_3.gl.getUniformLocation(shaderProgram, "texOffset");
            WebGLUtils_3.gl.uniform2fv(textureOffsetLocation, this.spr.textureOffset);
            WebGLUtils_3.gl.enable(WebGLUtils_3.gl.BLEND);
            WebGLUtils_3.gl.blendFunc(WebGLUtils_3.gl.SRC_ALPHA, WebGLUtils_3.gl.ONE_MINUS_SRC_ALPHA);
            WebGLUtils_3.gl.drawArrays(WebGLUtils_3.gl.TRIANGLES, 0, this.Vertices.length / 3);
            WebGLUtils_3.gl.disableVertexAttribArray(attribLocation);
            WebGLUtils_3.gl.disableVertexAttribArray(textureCoordinateAttribLocation);
            WebGLUtils_3.gl.disable(WebGLUtils_3.gl.BLEND);
        }
    }
    exports.SpriteBatch = SpriteBatch;
});
define("Tile", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Tile = void 0;
    class Tile {
        constructor(positionX, positionY, texture) {
            this.positionX = positionX;
            this.positionY = positionY;
            this.texture = texture;
        }
        get Texture() {
            return this.texture;
        }
        get PositionX() {
            return this.positionX;
        }
        get PositionY() {
            return this.positionY;
        }
        isPointInside(point) {
            // A tile is always 1x1
            const minX = this.positionX;
            const maxX = this.positionX + 1;
            const minY = this.positionY;
            const maxY = this.positionY + 1;
            return point[0] >= minX && point[0] <= maxX &&
                point[1] >= minY && point[1] <= maxY;
        }
        isCollindingWith(boundingBox) {
            // A tile is always 1x1
            const minX = this.positionX;
            const maxX = this.positionX + 1;
            const minY = this.positionY;
            const maxY = this.positionY + 1;
            const bbMinX = boundingBox.position[0];
            const bbMaxX = boundingBox.position[0] + boundingBox.size[0];
            const bbMinY = boundingBox.position[1];
            const bbMaxY = boundingBox.position[1] + boundingBox.size[1];
            return bbMinX < maxX && bbMaxX > minX &&
                bbMinY < maxY && bbMaxY > minY;
        }
    }
    exports.Tile = Tile;
});
define("Utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Utils = void 0;
    class Utils {
        static CreateSpriteVertices(positionX, positionY) {
            return [
                positionX, positionY, 0.0,
                positionX + 1.0, positionY, 0.0,
                positionX, positionY + 1.0, 0.0,
                positionX, positionY + 1.0, 0.0,
                positionX + 1.0, positionY, 0.0,
                positionX + 1.0, positionY + 1.0, 0.0,
            ];
        }
        static CreateCharacterVertices(position, width, height) {
            return [
                position[0], position[1], 0,
                position[0] + width, position[1], 0,
                position[0], position[1] + height, 0,
                position[0], position[1] + height, 0,
                position[0] + width, position[1], 0,
                position[0] + width, position[1] + height, 0
            ];
        }
        static CreateTextureCoordinates(positionX, positionY, width, height) {
            return [
                positionX, positionY,
                positionX + width, positionY,
                positionX, positionY + height,
                positionX, positionY + height,
                positionX + width, positionY,
                positionX + width, positionY + height,
            ];
        }
        static Partition(array, criteria) {
            const matching = array.filter(e => criteria(e));
            const nonMatching = array.filter(e => !criteria(e));
            return { matching, nonMatching };
        }
    }
    exports.Utils = Utils;
    Utils.DefaultSpriteVertices = [
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        0, 1.0, 0.0,
        0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 1.0, 0.0,
    ];
    Utils.DefaultSpriteTextureCoordinates = [
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
    ];
});
define("Layer", ["require", "exports", "Shader", "Sprite", "SpriteBatch", "Utils", "Environment"], function (require, exports, Shader_1, Sprite_3, SpriteBatch_1, Utils_1, Environment_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Layer = void 0;
    class Layer {
        constructor(SpriteBatches, Tiles) {
            this.SpriteBatches = SpriteBatches;
            this.Tiles = Tiles;
        }
        static async Create(tiles) {
            const tileMap = Layer.CreateTileMap(tiles);
            const batches = await Layer.CreateSpriteBatches(tileMap);
            const layer = new Layer(batches, tiles);
            return layer;
        }
        get BoundingBox() {
            throw new Error('Method not implemented. Use IsColliding with instead');
        }
        IsCollidingWith(boundingBox, collideWithUndefined) {
            // Outside of the boundaries are considered as collisions when collideWithUndefined is true.
            // This way a hero cant fall of the edge of the world.
            if (this.IsOutsideBoundary(boundingBox) && collideWithUndefined) {
                return true;
            }
            return this.Tiles.some(tiles => tiles.isCollindingWith(boundingBox));
        }
        get MaxX() {
            return Math.max(...this.Tiles.map(t => t.PositionX), Environment_2.Environment.HorizontalTiles);
        }
        get MinX() {
            return Math.min(...this.Tiles.map(t => t.PositionX));
        }
        get MinY() {
            return Math.min(...this.Tiles.map(t => t.PositionY), 0);
        }
        get MaxY() {
            return Math.max(...this.Tiles.map(t => t.PositionY), Environment_2.Environment.VerticalTiles);
        }
        IsOutsideBoundary(boundingBox) {
            const minX = this.MinX;
            const maxX = this.MaxX;
            const bbMinX = boundingBox.position[0];
            const bbMaxX = boundingBox.position[0] + boundingBox.size[0];
            const inside = bbMinX >= minX && bbMaxX <= maxX;
            return !inside;
        }
        IsUnder(boundingBox) {
            return this.MaxY < boundingBox.position[1];
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
        static CreateTileMap(tiles) {
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
        static async CreateSpriteBatches(tileMap) {
            // TODO: do I really need a new shader PER BATCH?
            const tileShader = await Shader_1.Shader.Create("shaders/VertexShader.vert", "shaders/FragmentShader.frag");
            const batches = [];
            tileMap.forEach((tiles, texture) => {
                const sprites = tiles.map((t) => {
                    const vertices = Utils_1.Utils.CreateSpriteVertices(t.PositionX, t.PositionY);
                    return new Sprite_3.Sprite(vertices, Utils_1.Utils.DefaultSpriteTextureCoordinates);
                });
                batches.push(new SpriteBatch_1.SpriteBatch(tileShader, sprites, texture));
            });
            return batches;
        }
        Dispose() {
            this.SpriteBatches.forEach(s => s.Dispose());
        }
    }
    exports.Layer = Layer;
});
define("Camera", ["require", "exports", "gl-matrix", "Environment"], function (require, exports, gl_matrix_4, Environment_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Camera = void 0;
    class Camera {
        constructor(position) {
            this.position = position;
            this.viewMatrix = gl_matrix_4.mat4.create();
        }
        get ViewMatrix() {
            return this.viewMatrix;
        }
        /**
         * The camera centers its view on the given position with its viewport confined in the boundaries of the given layer
         * @param position The position to look at
         * @param layer The layer where the camera's viewport is confined in
         */
        LookAtPosition(position, layer) {
            position[0] = this.Clamp(position[0], layer.MinX + Environment_3.Environment.HorizontalTiles / 2, layer.MaxX - Environment_3.Environment.HorizontalTiles / 2);
            position[1] = this.Clamp(position[1], layer.MinY + Environment_3.Environment.VerticalTiles / 2, layer.MaxY - Environment_3.Environment.VerticalTiles / 2);
            gl_matrix_4.mat4.translate(this.viewMatrix, gl_matrix_4.mat4.create(), gl_matrix_4.vec3.fromValues(-position[0] + Environment_3.Environment.HorizontalTiles / 2, -position[1] + Environment_3.Environment.VerticalTiles / 2, 0));
            this.position = position;
        }
        Clamp(val, min, max) {
            return Math.max(min, Math.min(max, val));
        }
    }
    exports.Camera = Camera;
});
define("ControllerHandler", ["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ControllerHandler = void 0;
    class ControllerHandler {
        ActivateGamepad(index) {
            this.activeControllerId = index;
        }
        IsPressed(keyId) {
            const activeController = navigator.getGamepads()[this.activeControllerId];
            if (activeController) {
                return activeController.buttons[keyId].pressed;
            }
            return false;
        }
        get LeftStick() {
            const activeController = navigator.getGamepads()[this.activeControllerId];
            if (activeController) {
                const x = activeController.axes[0];
                const y = activeController.axes[1];
                return gl_matrix_5.vec2.fromValues(x, y);
            }
            return gl_matrix_5.vec2.create();
        }
    }
    exports.ControllerHandler = ControllerHandler;
});
define("TexturePool", ["require", "exports", "Texture"], function (require, exports, Texture_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TexturePool = void 0;
    class TexturePool {
        constructor() {
            this.textures = new Map();
        }
        static GetInstance() {
            if (!this.Instance) {
                this.Instance = new TexturePool();
            }
            return this.Instance;
        }
        async GetTexture(path) {
            const texture = this.textures.get(path);
            if (!texture) {
                const created = await Texture_1.Texture.Create(path);
                this.textures.set(path, created);
                return created;
            }
            return texture;
        }
        ClearPool() {
            this.textures.forEach((value) => {
                value.Delete();
            });
            this.textures.clear();
        }
        // TODO: preload parameter
        async Preload() {
            await Promise.all([
                this.GetTexture('textures/Sword1.png'),
                this.GetTexture('textures/coin.png'),
                this.GetTexture('textures/monster1.png'),
                this.GetTexture('textures/Monster2.png'),
                this.GetTexture('textures/hero1.png'),
                this.GetTexture('textures/ground0.png'),
                this.GetTexture('textures/exit.png'),
                this.GetTexture('textures/fireball.png'),
                this.GetTexture('textures/fang.png'),
                this.GetTexture('textures/bg.jpg'),
                this.GetTexture('textures/spike.png'),
                this.GetTexture('textures/cactus1.png'),
                this.GetTexture('textures/potion.png'),
                this.GetTexture('textures/title.jpeg')
            ]);
        }
        /**
         * Empties the texture cache AND frees any OpenGL resources
         */
        UnloadAll() {
            for (const [_, texture] of this.textures) {
                texture.Delete();
            }
            this.textures.clear();
        }
    }
    exports.TexturePool = TexturePool;
});
define("Textbox", ["require", "exports", "gl-matrix", "Shader", "TexturePool", "Utils", "Sprite", "SpriteBatch", "WebGLUtils", "FontConfigPool"], function (require, exports, gl_matrix_6, Shader_2, TexturePool_1, Utils_2, Sprite_4, SpriteBatch_2, WebGLUtils_4, FontConfigPool_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Textbox = exports.FontConfig = void 0;
    class CharProperties {
    }
    class FontConfig {
        constructor(characters) {
            this.characters = characters;
        }
        static async Create(fontPath) {
            const jsonString = await (await fetch(fontPath)).text();
            const parsedTopLevel = JSON.parse(jsonString);
            const topLevelEntries = Object.entries(parsedTopLevel);
            const topLevelMap = new Map(topLevelEntries);
            const charJson = JSON.stringify(topLevelMap.get('characters'));
            const e = Object.entries(JSON.parse(charJson));
            const chars = new Map(e);
            return new FontConfig(chars);
        }
    }
    exports.FontConfig = FontConfig;
    class Character {
        get Advance() {
            return this._advance;
        }
        get Sprite() {
            return this.sprite;
        }
        constructor(shader, fontMap, charConfig, position, scale) {
            this.shader = shader;
            this.fontMap = fontMap;
            this.charConfig = charConfig;
            this.position = position;
            this.scale = scale;
            this._advance = charConfig.advance * scale;
            const height = charConfig.height * scale;
            const width = charConfig.width * scale;
            const originX = charConfig.originX * scale;
            const originY = charConfig.originY * scale;
            const originYOffset = height - originY;
            const bottomY = position[1] + originYOffset;
            const topY = bottomY - height;
            const left = position[0] - originX;
            const vertices = Utils_2.Utils.CreateCharacterVertices(gl_matrix_6.vec2.fromValues(left, topY), width, height);
            const s = charConfig.x / fontMap.Width;
            const t = charConfig.y / fontMap.Height;
            const uvs = Utils_2.Utils.CreateTextureCoordinates(s, t, charConfig.width / fontMap.Width, charConfig.height / fontMap.Height);
            this.sprite = new Sprite_4.Sprite(vertices, uvs);
        }
    }
    class Textbox {
        constructor(fontMap, shader, fontConfig) {
            this.fontMap = fontMap;
            this.shader = shader;
            this.fontConfig = fontConfig;
            this.text = [];
            this.cursorX = 0;
            this.maxCharacterHeight = 0;
        }
        static async Create(fontname) {
            const shader = await Shader_2.Shader.Create('shaders/VertexShader.vert', 'shaders/Font.frag');
            const fontMap = await TexturePool_1.TexturePool.GetInstance().GetTexture(`textures/Fonts/${fontname}/font.png`);
            const fontConfig = await FontConfigPool_1.FontConfigPool.GetInstance().GetFontConfig(`textures/Fonts/${fontname}/font.json`);
            return new Textbox(fontMap, shader, fontConfig)
                .WithHue(1).WithSaturation(0).WithValue(1);
        }
        WithText(text, position, scale = 1.0) {
            this.text = [];
            this.cursorX = 0;
            this.position = position;
            const heights = [...this.fontConfig.characters.values()]
                .map(c => c.height);
            this.maxCharacterHeight = Math.max(...heights) * scale;
            for (const character of text) {
                const charConfig = this.fontConfig.characters.get(character);
                const charPos = gl_matrix_6.vec2.fromValues(position[0] + this.cursorX, position[1] + this.maxCharacterHeight);
                const renderableChar = new Character(this.shader, this.fontMap, charConfig, charPos, scale);
                this.text.push(renderableChar);
                this.cursorX += renderableChar.Advance;
            }
            return this;
        }
        WithHue(hue) {
            this.shader.SetFloatUniform('hue', hue);
            return this;
        }
        WithSaturation(saturation) {
            this.shader.SetFloatUniform('saturation', saturation);
            return this;
        }
        WithValue(value) {
            this.shader.SetFloatUniform('value', value);
            return this;
        }
        Draw(proj) {
            WebGLUtils_4.gl.enable(WebGLUtils_4.gl.BLEND);
            const sprites = this.text.map(t => t.Sprite);
            const batch = new SpriteBatch_2.SpriteBatch(this.shader, sprites, this.fontMap); // TODO: recreating & destroying the batch in every frame seems very wasteful
            batch.Draw(proj, gl_matrix_6.mat4.create());
            batch.Dispose();
            WebGLUtils_4.gl.disable(WebGLUtils_4.gl.BLEND);
        }
        get Width() {
            return this.cursorX + this.position[0];
        }
        get Height() {
            return this.maxCharacterHeight;
        }
        /**
         * Helper function to predetermine the size of a textbox without creating and rendering one
         * @param text The text to 'prerender'
         * @param font The font that the text will be rendered in
         * @returns An object containing the width and height of the rendered textbox
         */
        static async PrecalculateDimensions(font, text, scale) {
            const fontConfig = await FontConfigPool_1.FontConfigPool.GetInstance().GetFontConfig(`textures/Fonts/${font}/font.json`);
            let cursorX = 0;
            const heights = [...fontConfig.characters.values()]
                .map(c => c.height);
            const maxCharacterHeight = Math.max(...heights) * scale;
            for (const character of text) {
                const charConfig = fontConfig.characters.get(character);
                cursorX += charConfig.advance * scale;
            }
            return { width: cursorX, height: maxCharacterHeight };
        }
        Dispose() {
            this.shader.Delete();
        }
    }
    exports.Textbox = Textbox;
});
define("FontConfigPool", ["require", "exports", "Textbox"], function (require, exports, Textbox_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FontConfigPool = void 0;
    class FontConfigPool {
        constructor() {
            this.configs = new Map();
        }
        static GetInstance() {
            if (!this.instance) {
                this.instance = new FontConfigPool();
            }
            return this.instance;
        }
        async GetFontConfig(fontPath) {
            const config = this.configs.get(fontPath);
            if (!config) {
                const created = await Textbox_1.FontConfig.Create(fontPath);
                this.configs.set(fontPath, created);
                return created;
            }
            return config;
        }
        async PreLoad() {
        }
        UnloadAll() {
            this.configs.clear();
        }
    }
    exports.FontConfigPool = FontConfigPool;
});
define("KeyHandler", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyHandler = void 0;
    class KeyHandler {
        constructor() {
            this.keys = new Map();
        }
        SetKey(code, state) {
            this.keys.set(code, state);
        }
        IsPressed(code) {
            if (this.keys.has(code)) {
                return this.keys.get(code);
            }
            return false;
        }
    }
    exports.KeyHandler = KeyHandler;
});
define("SoundEffect", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SoundEffect = void 0;
    class SoundEffect {
        constructor(blob, allowMultiple = true) {
            this.allowMultiple = allowMultiple;
            this.context = new AudioContext();
            this.playing = false;
            this.loop = false;
            this.context.decodeAudioData(blob, (data) => {
                this.buffer = data;
            });
        }
        static async Create(path, allowMultiple = true) {
            const blob = await (await fetch(path)).arrayBuffer();
            return new SoundEffect(blob, allowMultiple);
        }
        Play(playbackRate = 1, volume = 1, onEndCallback = null, loop = false) {
            if ((!this.playing || this.allowMultiple) && this.buffer) {
                this.gainNode = this.context.createGain();
                this.gainNode.gain.value = volume;
                this.source = this.context.createBufferSource();
                this.source.buffer = this.buffer;
                this.source.playbackRate.value = playbackRate;
                this.source.connect(this.gainNode).connect(this.context.destination);
                this.playing = true;
                this.source.onended = () => {
                    this.playing = false;
                    if (onEndCallback) {
                        onEndCallback();
                    }
                };
                this.loop = loop;
                this.source.loop = loop;
                this.context.resume();
                this.source.start();
            }
            if (this.playing) {
                this.gainNode.gain.value = volume;
            }
        }
        Stop() {
            if (this.playing) {
                this.source.stop();
            }
        }
        SetVolume(volume) {
            if (this.gainNode)
                this.gainNode.gain.value = volume;
        }
    }
    exports.SoundEffect = SoundEffect;
});
define("SoundEffectPool", ["require", "exports", "SoundEffect"], function (require, exports, SoundEffect_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SoundEffectPool = void 0;
    class SoundEffectPool {
        constructor() {
            this.effects = new Map();
        }
        static GetInstance() {
            if (!this.instance) {
                this.instance = new SoundEffectPool();
            }
            return this.instance;
        }
        // TODO:key should be path + allowparallel pair
        async GetAudio(path, allowParallel = true) {
            const effect = this.effects.get(path);
            if (!effect) {
                const created = await SoundEffect_1.SoundEffect.Create(path, allowParallel);
                this.effects.set(path, created);
                return created;
            }
            return effect;
        }
        async Preload() {
            await Promise.all([
                this.GetAudio('audio/level.mp3', false),
                this.GetAudio('audio/fireball_spawn.mp3'),
                this.GetAudio('audio/sword.mp3'),
                this.GetAudio('audio/enemy_damage.wav'),
                this.GetAudio('audio/enemy_death.wav'),
                this.GetAudio('audio/bite.wav'),
                this.GetAudio('audio/bite2.wav'),
                this.GetAudio('audio/jump.wav'),
                this.GetAudio('audio/land.wav', false),
                this.GetAudio('audio/walk1.wav', false),
                this.GetAudio('audio/hero_stomp.wav', true),
                this.GetAudio('audio/hero_damage.wav'),
                this.GetAudio('audio/hero_die.wav', false),
                this.GetAudio('audio/collect.mp3'),
                this.GetAudio('audio/dragon_roar.mp3'),
                this.GetAudio('audio/charge_up.mp3'),
                this.GetAudio('audio/item1.wav', false),
                this.GetAudio('audio/ui2.mp3', false),
                this.GetAudio('audio/pause.mp3'),
                this.GetAudio('audio/cursor1.wav')
            ]);
        }
    }
    exports.SoundEffectPool = SoundEffectPool;
});
define("Waypoint", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Waypoint = void 0;
    class Waypoint {
        constructor(position) {
            this.position = position;
        }
    }
    exports.Waypoint = Waypoint;
});
define("Projectiles/IProjectile", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("IGameobject", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Enemies/IEnemy", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Enemies/SlimeEnemy", ["require", "exports", "gl-matrix", "Sprite", "Utils", "SpriteBatch", "Shader", "TexturePool", "BoundingBox", "SoundEffectPool", "Waypoint"], function (require, exports, gl_matrix_7, Sprite_5, Utils_3, SpriteBatch_3, Shader_3, TexturePool_2, BoundingBox_1, SoundEffectPool_1, Waypoint_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SlimeEnemy = void 0;
    /**
     * Slime enemy is a passive enemy, meaning it does not actively attack the player, but it hurts when contacted directly
     */
    class SlimeEnemy {
        constructor(position, shader, bbShader, visualScale, collider, onDeath, enemyDamageSound, enemyDeathSound, texture) {
            this.position = position;
            this.shader = shader;
            this.bbShader = bbShader;
            this.visualScale = visualScale;
            this.collider = collider;
            this.onDeath = onDeath;
            this.enemyDamageSound = enemyDamageSound;
            this.enemyDeathSound = enemyDeathSound;
            this.texture = texture;
            // A little variation in movement speed;
            this.minSpeed = 0.002;
            this.maxSpeed = 0.004;
            this.movementSpeed = Math.random() * (this.maxSpeed - this.minSpeed) + this.minSpeed;
            this.currentFrameTime = 0;
            this.currentAnimationFrame = 0;
            this.leftFacingAnimationFrames = [
                gl_matrix_7.vec2.fromValues(0 / 12, 3 / 8),
                gl_matrix_7.vec2.fromValues(1 / 12, 3 / 8),
                gl_matrix_7.vec2.fromValues(2 / 12, 3 / 8),
            ];
            this.rightFacingAnimationFrames = [
                gl_matrix_7.vec2.fromValues(0 / 12, 1 / 8),
                gl_matrix_7.vec2.fromValues(1 / 12, 1 / 8),
                gl_matrix_7.vec2.fromValues(2 / 12, 1 / 8),
            ];
            this.currentFrameSet = this.leftFacingAnimationFrames;
            this.velocity = gl_matrix_7.vec3.fromValues(0, 0, 0);
            this.sprite = new Sprite_5.Sprite(Utils_3.Utils.DefaultSpriteVertices, Utils_3.Utils.CreateTextureCoordinates(0.0 / 12.0, // These constants are hardcoded with "monster1.png" in mind
            0.0 / 8.0, 1.0 / 12.0, 1.0 / 8.0));
            this.batch = new SpriteBatch_3.SpriteBatch(this.shader, [this.sprite], this.texture);
            this.health = 3;
            this.damagedTime = 0;
            this.damaged = false;
            this.bbOffset = gl_matrix_7.vec3.fromValues(1.2, 1.8, 0);
            this.bbSize = gl_matrix_7.vec2.fromValues(0.8, 1.0);
            this.bbSprite = new Sprite_5.Sprite(Utils_3.Utils.DefaultSpriteVertices, Utils_3.Utils.DefaultSpriteTextureCoordinates);
            this.bbBatch = new SpriteBatch_3.SpriteBatch(this.bbShader, [this.bbSprite], null);
            this.lastPosition = gl_matrix_7.vec3.create(); // If lastPosition is the same as position at initialization, the entity slowly falls through the floor
            // For now slimes walk between their start position and an other position with some constant offset
            const originalWaypoint = new Waypoint_1.Waypoint(this.position);
            const targetPosition = gl_matrix_7.vec3.add(gl_matrix_7.vec3.create(), this.position, gl_matrix_7.vec3.fromValues(-6, 0, 0));
            this.targetWaypoint = new Waypoint_1.Waypoint(targetPosition);
            this.targetWaypoint.next = originalWaypoint;
            originalWaypoint.next = this.targetWaypoint;
        }
        static async Create(position, visualScale, collider, onDeath) {
            const shader = await Shader_3.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_3.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const enemyDamageSound = await SoundEffectPool_1.SoundEffectPool.GetInstance().GetAudio('audio/enemy_damage.wav');
            const enemyDeathSound = await SoundEffectPool_1.SoundEffectPool.GetInstance().GetAudio('audio/enemy_death.wav');
            const texture = await TexturePool_2.TexturePool.GetInstance().GetTexture('textures/monster1.png');
            return new SlimeEnemy(position, shader, bbShader, visualScale, collider, onDeath, enemyDamageSound, enemyDeathSound, texture);
        }
        Visit(hero) {
            hero.CollideWithSlime(this);
        }
        CollideWithAttack(attack) {
            this.Damage(attack.PushbackForce);
        }
        get Position() {
            return this.position;
        }
        get BoundingBox() {
            return new BoundingBox_1.BoundingBox(gl_matrix_7.vec3.add(gl_matrix_7.vec3.create(), this.position, this.bbOffset), this.bbSize);
        }
        get EndCondition() {
            return false;
        }
        // TODO: this is also duplicated in the code
        IsCollidingWith(boundingBox) {
            return this.BoundingBox.IsCollidingWith(boundingBox);
        }
        // TODO: damage amount
        // TODO: multiple types of enemies can be damaged, make this a component
        Damage(pushbackForce) {
            this.enemyDamageSound.Play();
            this.health--;
            this.shader.SetVec4Uniform('colorOverlay', gl_matrix_7.vec4.fromValues(1, 0, 0, 0));
            gl_matrix_7.vec3.set(this.velocity, pushbackForce[0], pushbackForce[1], 0);
            this.damaged = true;
            if (this.health <= 0) {
                if (this.onDeath) {
                    this.enemyDeathSound.Play();
                    this.onDeath(this);
                }
            }
        }
        Draw(proj, view) {
            this.batch.Draw(proj, view);
            this.batch.ModelMatrix = gl_matrix_7.mat4.create();
            gl_matrix_7.mat4.translate(this.batch.ModelMatrix, this.batch.ModelMatrix, this.position);
            gl_matrix_7.mat4.scale(this.batch.ModelMatrix, this.batch.ModelMatrix, gl_matrix_7.vec3.fromValues(this.visualScale[0], this.visualScale[1], 1));
            this.bbBatch.Draw(proj, view);
            gl_matrix_7.mat4.translate(this.bbBatch.ModelMatrix, gl_matrix_7.mat4.create(), this.BoundingBox.position);
            gl_matrix_7.mat4.scale(this.bbBatch.ModelMatrix, this.bbBatch.ModelMatrix, gl_matrix_7.vec3.fromValues(this.bbSize[0], this.bbSize[1], 1));
        }
        async Update(delta) {
            this.RemoveDamageOverlayAfter(delta, 1. / 60 * 1000 * 15);
            this.MoveTowardsNextWaypoint(delta);
            this.Animate(delta);
            gl_matrix_7.vec3.copy(this.lastPosition, this.position);
            this.ApplyGravityToVelocity(delta);
            this.ApplyVelocityToPosition(delta);
            this.HandleCollisionWithCollider();
        }
        // TODO: duplicated all over the place
        RemoveDamageOverlayAfter(delta, showOverlayTime) {
            if (this.damaged) {
                this.damagedTime += delta;
            }
            if (this.damagedTime > showOverlayTime) {
                this.damagedTime = 0;
                this.damaged = false;
                this.shader.SetVec4Uniform('colorOverlay', gl_matrix_7.vec4.create());
            }
        }
        MoveTowardsNextWaypoint(delta) {
            const dir = gl_matrix_7.vec3.sub(gl_matrix_7.vec3.create(), this.position, this.targetWaypoint.position);
            if (dir[0] < 0) {
                this.ChangeFrameSet(this.rightFacingAnimationFrames);
                this.MoveOnX(this.movementSpeed, delta);
            }
            else if (dir[0] > 0) {
                this.ChangeFrameSet(this.leftFacingAnimationFrames);
                this.MoveOnX(-this.movementSpeed, delta);
            }
            if (gl_matrix_7.vec3.distance(this.position, this.targetWaypoint.position) < 0.25) {
                this.targetWaypoint = this.targetWaypoint.next;
            }
        }
        /**
         * Helper function to make frame changes seamless by immediatelly changing the spite offset when a frame change happens
         */
        ChangeFrameSet(frames) {
            this.currentFrameSet = frames;
            this.sprite.textureOffset = this.currentFrameSet[this.currentAnimationFrame];
        }
        MoveOnX(amount, delta) {
            const nextPosition = gl_matrix_7.vec3.fromValues(this.position[0] + amount * delta, this.position[1], this.position[2]);
            if (!this.checkCollision(nextPosition)) {
                this.position = nextPosition;
            }
        }
        checkCollision(nextPosition) {
            const nextBbPos = gl_matrix_7.vec3.add(gl_matrix_7.vec3.create(), nextPosition, this.bbOffset);
            const nextBoundingBox = new BoundingBox_1.BoundingBox(nextBbPos, this.bbSize);
            return this.collider.IsCollidingWith(nextBoundingBox, true);
        }
        Animate(delta) {
            this.currentFrameTime += delta;
            if (this.currentFrameTime > 264) {
                this.currentAnimationFrame++;
                if (this.currentAnimationFrame > 2) {
                    this.currentAnimationFrame = 0;
                }
                const currentFrame = this.currentFrameSet[this.currentAnimationFrame];
                this.sprite.textureOffset = currentFrame;
                this.currentFrameTime = 0;
            }
        }
        // TODO: should make this a component system
        ApplyGravityToVelocity(delta) {
            const gravity = gl_matrix_7.vec3.fromValues(0, 0.00004, 0);
            gl_matrix_7.vec3.add(this.velocity, this.velocity, gl_matrix_7.vec3.scale(gl_matrix_7.vec3.create(), gravity, delta));
        }
        // TODO: make this a component system
        ApplyVelocityToPosition(delta) {
            // TODO: check if next position causes a collision. Do not apply velocity if collision happens
            const moveValue = gl_matrix_7.vec3.create();
            gl_matrix_7.vec3.scale(moveValue, this.velocity, delta);
            gl_matrix_7.vec3.add(this.position, this.position, moveValue);
        }
        // TODO: how to make this a component?
        HandleCollisionWithCollider() {
            const colliding = this.collider.IsCollidingWith(this.BoundingBox, false);
            if (colliding) {
                gl_matrix_7.vec3.copy(this.position, this.lastPosition);
                this.velocity = gl_matrix_7.vec3.create();
            }
        }
        Dispose() {
            this.batch.Dispose();
            this.shader.Delete();
            this.bbBatch.Dispose();
            this.bbShader.Delete();
        }
    }
    exports.SlimeEnemy = SlimeEnemy;
});
define("Projectiles/Fireball", ["require", "exports", "gl-matrix", "BoundingBox", "Shader", "Sprite", "SpriteBatch", "TexturePool", "Utils", "SoundEffectPool"], function (require, exports, gl_matrix_8, BoundingBox_2, Shader_4, Sprite_6, SpriteBatch_4, TexturePool_3, Utils_4, SoundEffectPool_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Fireball = void 0;
    class Fireball {
        constructor(centerPosition, moveDirection, collider, shader, bbShader, hitSound, spawnSound, texture) {
            this.centerPosition = centerPosition;
            this.moveDirection = moveDirection;
            this.collider = collider;
            this.shader = shader;
            this.bbShader = bbShader;
            this.hitSound = hitSound;
            this.spawnSound = spawnSound;
            this.texture = texture;
            this.OnHitListeners = [];
            this.spawnSoundPlayed = false;
            this.alreadyHit = false;
            this.visualScale = gl_matrix_8.vec2.fromValues(3, 3);
            // Animation related
            this.currentFrameTime = 0;
            this.currentAnimationFrameIndex = 0;
            this.leftFacingAnimationFrames = [
                gl_matrix_8.vec2.fromValues(0 / 8, 0 / 8),
                gl_matrix_8.vec2.fromValues(1 / 8, 0 / 8),
                gl_matrix_8.vec2.fromValues(2 / 8, 0 / 8),
                gl_matrix_8.vec2.fromValues(3 / 8, 0 / 8),
                gl_matrix_8.vec2.fromValues(4 / 8, 0 / 8),
                gl_matrix_8.vec2.fromValues(5 / 8, 0 / 8),
                gl_matrix_8.vec2.fromValues(6 / 8, 0 / 8),
                gl_matrix_8.vec2.fromValues(7 / 8, 0 / 8),
            ];
            this.rightFacingAnimationFrames = [
                gl_matrix_8.vec2.fromValues(0 / 8, 4 / 8),
                gl_matrix_8.vec2.fromValues(1 / 8, 4 / 8),
                gl_matrix_8.vec2.fromValues(2 / 8, 4 / 8),
                gl_matrix_8.vec2.fromValues(3 / 8, 4 / 8),
                gl_matrix_8.vec2.fromValues(4 / 8, 4 / 8),
                gl_matrix_8.vec2.fromValues(5 / 8, 4 / 8),
                gl_matrix_8.vec2.fromValues(6 / 8, 4 / 8),
                gl_matrix_8.vec2.fromValues(7 / 8, 4 / 8),
            ];
            this.currentFrameSet = this.leftFacingAnimationFrames;
            this.sprite = new Sprite_6.Sprite(Utils_4.Utils.DefaultSpriteVertices, Utils_4.Utils.CreateTextureCoordinates(0, 0, 1 / 8, 1 / 8));
            this.batch = new SpriteBatch_4.SpriteBatch(this.shader, [this.sprite], this.texture);
            // TODO: altough i dont use bbOffset here I kept all duplicated code nearly the same, to make refactors easier
            this.bbOffset = gl_matrix_8.vec3.fromValues(0, 0, 0);
            this.bbSize = gl_matrix_8.vec2.fromValues(2.0, 1.0);
            this.bbSprite = new Sprite_6.Sprite(Utils_4.Utils.DefaultSpriteVertices, Utils_4.Utils.DefaultSpriteTextureCoordinates);
            this.bbBatch = new SpriteBatch_4.SpriteBatch(this.bbShader, [this.bbSprite], null);
            this.shader.SetVec4Uniform('clr', gl_matrix_8.vec4.fromValues(0, 1, 0, 0.4));
            this.bbShader.SetVec4Uniform('clr', gl_matrix_8.vec4.fromValues(1, 0, 0, 0.4));
        }
        CollideWithAttack(attack) {
            this.OnHit();
        }
        static async Create(centerPosition, moveDirection, collider) {
            const shader = await Shader_4.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_4.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const hitSound = await SoundEffectPool_2.SoundEffectPool.GetInstance().GetAudio('audio/hero_stomp.wav');
            const spawnSound = await SoundEffectPool_2.SoundEffectPool.GetInstance().GetAudio('audio/fireball_spawn.mp3');
            const texture = await TexturePool_3.TexturePool.GetInstance().GetTexture('textures/fireball.png');
            return new Fireball(centerPosition, moveDirection, collider, shader, bbShader, hitSound, spawnSound, texture);
        }
        get EndCondition() {
            return false;
        }
        get AlreadyHit() {
            return this.alreadyHit;
        }
        OnHit() {
            this.hitSound.Play();
            this.alreadyHit = true;
        }
        get BoundingBox() {
            const topLeftCorner = gl_matrix_8.vec3.sub(gl_matrix_8.vec3.create(), this.centerPosition, gl_matrix_8.vec3.fromValues(this.bbSize[0] / 2, this.bbSize[1] / 2, 0));
            const bbPos = gl_matrix_8.vec3.add(gl_matrix_8.vec3.create(), topLeftCorner, this.bbOffset); // Adjust bb position with the offset
            return new BoundingBox_2.BoundingBox(bbPos, this.bbSize);
        }
        get PushbackForce() {
            // No pushback from a fireball
            return gl_matrix_8.vec3.create();
        }
        Visit(hero) {
            hero.InteractWithProjectile(this);
        }
        Draw(proj, view) {
            if (!this.alreadyHit) {
                const topleft = gl_matrix_8.vec3.sub(gl_matrix_8.vec3.create(), this.centerPosition, gl_matrix_8.vec3.fromValues(this.visualScale[0] / 2, this.visualScale[1] / 2, 0));
                gl_matrix_8.mat4.translate(this.batch.ModelMatrix, gl_matrix_8.mat4.create(), topleft);
                gl_matrix_8.mat4.scale(this.batch.ModelMatrix, this.batch.ModelMatrix, gl_matrix_8.vec3.fromValues(this.visualScale[0], this.visualScale[1], 1));
                this.batch.Draw(proj, view);
            }
            // Draw bb
            // mat4.translate(this.bbBatch.ModelMatrix, mat4.create(), this.BoundingBox.position);
            // mat4.scale(
            //     this.bbBatch.ModelMatrix,
            //     this.bbBatch.ModelMatrix,
            //     vec3.fromValues(this.BoundingBox.size[0], this.BoundingBox.size[1], 1));
            // this.bbBatch.Draw(proj, view);
        }
        Dispose() {
            this.batch.Dispose();
            this.bbBatch.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
        async Update(delta) {
            this.currentFrameSet = this.moveDirection[0] < 0 ?
                this.rightFacingAnimationFrames :
                this.leftFacingAnimationFrames;
            this.Animate(delta);
            if (!this.spawnSoundPlayed) {
                this.spawnSound.Play(1, 0.5);
                this.spawnSoundPlayed = true;
            }
            this.MoveInDirection(delta);
            if (this.alreadyHit) {
                this.OnHitListeners.forEach(l => l(this));
            }
        }
        IsCollidingWith(boundingBox) {
            return this.BoundingBox.IsCollidingWith(boundingBox);
        }
        MoveInDirection(delta) {
            if (this.moveDirection[0] < 0) {
                this.MoveOnX(0.01, delta);
            }
            else {
                this.MoveOnX(-0.01, delta);
            }
        }
        MoveOnX(amount, delta) {
            const nextCenterPosition = gl_matrix_8.vec3.fromValues(this.centerPosition[0] + amount * delta, this.centerPosition[1], 0);
            if (!this.CheckCollisionWithCollider(nextCenterPosition)) {
                this.centerPosition = nextCenterPosition;
            }
            else {
                this.hitSound.Play();
                this.alreadyHit = true;
            }
        }
        // TODO: yet another duplication
        CheckCollisionWithCollider(nextPosition) {
            const topleft = gl_matrix_8.vec3.sub(gl_matrix_8.vec3.create(), nextPosition, gl_matrix_8.vec3.fromValues(this.bbSize[0] / 2, this.bbSize[1] / 2, 0));
            const bbPos = gl_matrix_8.vec3.add(gl_matrix_8.vec3.create(), topleft, this.bbOffset);
            const nextBoundingBox = new BoundingBox_2.BoundingBox(bbPos, this.bbSize);
            const colliding = this.collider.IsCollidingWith(nextBoundingBox, false);
            return colliding;
        }
        Animate(delta) {
            this.currentFrameTime += delta;
            // This is ~30 fps animation
            if (this.currentFrameTime >= 16 * 2) {
                this.currentAnimationFrameIndex++;
                if (this.currentAnimationFrameIndex >= this.currentFrameSet.length) {
                    this.currentAnimationFrameIndex = 0;
                }
                const currentFrame = this.currentFrameSet[this.currentAnimationFrameIndex];
                this.sprite.textureOffset = currentFrame;
                this.currentFrameTime = 0;
            }
        }
    }
    exports.Fireball = Fireball;
});
define("Projectiles/BiteProjectile", ["require", "exports", "gl-matrix", "BoundingBox", "Shader", "Sprite", "SpriteBatch", "TexturePool", "Utils", "SoundEffectPool"], function (require, exports, gl_matrix_9, BoundingBox_3, Shader_5, Sprite_7, SpriteBatch_5, TexturePool_4, Utils_5, SoundEffectPool_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BiteProjectile = void 0;
    /**
     * A stationary projectile that attacks the player
     */
    class BiteProjectile {
        constructor(centerPosition, facingDirection, shader, bbShader, biteDamageSound, texture) {
            this.centerPosition = centerPosition;
            this.facingDirection = facingDirection;
            this.shader = shader;
            this.bbShader = bbShader;
            this.biteDamageSound = biteDamageSound;
            this.texture = texture;
            this.alreadyHit = false;
            this.animationFinished = false;
            this.currentFrameTime = 0;
            this.currentAnimationFrame = 0;
            // TODO: flip texure, to achive left and right facing bite attack
            this.currentFrameSet = [
                gl_matrix_9.vec2.fromValues(0 / 5, 0 / 2),
                gl_matrix_9.vec2.fromValues(1 / 5, 0 / 2),
                gl_matrix_9.vec2.fromValues(0 / 5, 1 / 2),
                gl_matrix_9.vec2.fromValues(1 / 5, 1 / 2),
            ];
            this.bbOffset = gl_matrix_9.vec3.fromValues(0, 0, 0);
            this.bbSize = gl_matrix_9.vec2.fromValues(1.6, 1.6);
            this.spriteVisualScale = gl_matrix_9.vec3.fromValues(5, 5, 0);
            this.sprite = new Sprite_7.Sprite(Utils_5.Utils.DefaultSpriteVertices, Utils_5.Utils.CreateTextureCoordinates(0 / 5, 0 / 2, 1 / 5, 1 / 2));
            this.batch = new SpriteBatch_5.SpriteBatch(this.shader, [this.sprite], this.texture);
            this.bbSprite = new Sprite_7.Sprite(Utils_5.Utils.DefaultSpriteVertices, Utils_5.Utils.DefaultSpriteTextureCoordinates);
            this.bbBatch = new SpriteBatch_5.SpriteBatch(this.bbShader, [this.bbSprite], null);
            this.OnHitListeners = [];
            this.sprite.textureOffset = this.currentFrameSet[0];
            // this.shader.SetVec4Uniform('colorOverlay', vec4.fromValues(0, 0, 0, 1));
            // this.bbShader.SetVec4Uniform('clr', vec4.fromValues(1, 0, 0, 0.4));
        }
        CollideWithAttack(attack) {
            // no-op
        }
        static async Create(centerPosition, facingDirection) {
            const shader = await Shader_5.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_5.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const biteDamageSound = await SoundEffectPool_3.SoundEffectPool.GetInstance().GetAudio('audio/bite.wav');
            const texture = await TexturePool_4.TexturePool.GetInstance().GetTexture('textures/fang.png');
            return new BiteProjectile(centerPosition, facingDirection, shader, bbShader, biteDamageSound, texture);
        }
        get EndCondition() {
            return false;
        }
        get AlreadyHit() {
            return this.alreadyHit;
        }
        OnHit() {
            this.biteDamageSound.Play();
            this.alreadyHit = true;
        }
        get BoundingBox() {
            const topLeftCorner = gl_matrix_9.vec3.sub(gl_matrix_9.vec3.create(), this.centerPosition, gl_matrix_9.vec3.fromValues(this.bbSize[0] / 2, this.bbSize[1] / 2, 0));
            const bbPos = gl_matrix_9.vec3.add(gl_matrix_9.vec3.create(), topLeftCorner, this.bbOffset); // Adjust bb position with the offset
            return new BoundingBox_3.BoundingBox(bbPos, this.bbSize);
        }
        get PushbackForce() {
            const damagePushback = gl_matrix_9.vec3.scale(gl_matrix_9.vec3.create(), this.facingDirection, -0.01);
            damagePushback[1] -= 0.01;
            return damagePushback;
        }
        Visit(hero) {
            hero.InteractWithProjectile(this);
        }
        Draw(proj, view) {
            if (!this.animationFinished) {
                const topLeftCorner = gl_matrix_9.vec3.sub(gl_matrix_9.vec3.create(), this.centerPosition, gl_matrix_9.vec3.fromValues(this.spriteVisualScale[0] / 2, this.spriteVisualScale[1] / 2, 0));
                gl_matrix_9.mat4.translate(this.batch.ModelMatrix, gl_matrix_9.mat4.create(), topLeftCorner);
                gl_matrix_9.mat4.scale(this.batch.ModelMatrix, this.batch.ModelMatrix, this.spriteVisualScale);
                this.batch.Draw(proj, view);
            }
            // Draw bb
            gl_matrix_9.mat4.translate(this.bbBatch.ModelMatrix, gl_matrix_9.mat4.create(), this.BoundingBox.position);
            gl_matrix_9.mat4.scale(this.bbBatch.ModelMatrix, this.bbBatch.ModelMatrix, gl_matrix_9.vec3.fromValues(this.BoundingBox.size[0], this.BoundingBox.size[1], 1));
            this.bbBatch.Draw(proj, view);
        }
        async Update(delta) {
            this.Animate(delta);
            if (this.animationFinished) {
                this.OnHitListeners.forEach(x => x(this));
            }
            // TODO: do not damage hero right after animation has started, but wait a little (spawn bb out of bounds, then move it to the correct position)
        }
        IsCollidingWith(boundingBox) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        Dispose() {
            this.batch.Dispose();
            this.bbBatch.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
        Animate(delta) {
            this.currentFrameTime += delta;
            if (this.currentFrameTime > 64) { // TODO: time spent on frame
                this.currentAnimationFrame++;
                if (this.currentAnimationFrame >= this.currentFrameSet.length) {
                    this.animationFinished = true;
                }
                const currentFrame = this.currentFrameSet[this.currentAnimationFrame];
                this.sprite.textureOffset = currentFrame;
                this.currentFrameTime = 0;
            }
        }
    }
    exports.BiteProjectile = BiteProjectile;
});
define("Enemies/DragonEnemy", ["require", "exports", "gl-matrix", "BoundingBox", "Shader", "Sprite", "SpriteBatch", "TexturePool", "Utils", "SoundEffectPool", "Projectiles/Fireball", "Projectiles/BiteProjectile"], function (require, exports, gl_matrix_10, BoundingBox_4, Shader_6, Sprite_8, SpriteBatch_6, TexturePool_5, Utils_6, SoundEffectPool_4, Fireball_1, BiteProjectile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DragonEnemy = void 0;
    var State;
    (function (State) {
        State["IDLE"] = "idle";
        State["RUSH"] = "rush";
    })(State || (State = {}));
    var RushState;
    (function (RushState) {
        RushState["START"] = "start";
        RushState["BACKING"] = "backing";
        RushState["CHARGE"] = "charge";
        RushState["PRE_ATTACK"] = "pre-attack";
        RushState["ATTACK"] = "attack";
    })(RushState || (RushState = {}));
    class DragonEnemy {
        constructor(position, shader, bbShader, visualScale, // TODO: this should not be a parameter but hardcoded
        collider, hero, onDeath, spawnProjectile, enemyDamageSound, enemyDeathSound, biteAttackSound, rushSound, backingStartSound, texture) {
            this.position = position;
            this.shader = shader;
            this.bbShader = bbShader;
            this.visualScale = visualScale;
            this.collider = collider;
            this.hero = hero;
            this.onDeath = onDeath;
            this.spawnProjectile = spawnProjectile;
            this.enemyDamageSound = enemyDamageSound;
            this.enemyDeathSound = enemyDeathSound;
            this.biteAttackSound = biteAttackSound;
            this.rushSound = rushSound;
            this.backingStartSound = backingStartSound;
            this.texture = texture;
            this.state = State.IDLE;
            this.rushState = RushState.START;
            this.timeInBacking = 0;
            this.timeInCharge = 0;
            this.timeSinceLastCharge = 0;
            this.timeinPreAttack = 0;
            this.herosLastPositionWhenTheChargingStarted = gl_matrix_10.vec3.create();
            // Animation related
            this.currentFrameTime = 0;
            this.currentAnimationFrame = 0;
            this.leftFacingAnimationFrames = [
                gl_matrix_10.vec2.fromValues(3 / 12, 3 / 8),
                gl_matrix_10.vec2.fromValues(4 / 12, 3 / 8),
                gl_matrix_10.vec2.fromValues(5 / 12, 3 / 8),
            ];
            this.rightFacingAnimationFrames = [
                gl_matrix_10.vec2.fromValues(3 / 12, 1 / 8),
                gl_matrix_10.vec2.fromValues(4 / 12, 1 / 8),
                gl_matrix_10.vec2.fromValues(5 / 12, 1 / 8),
            ];
            this.currentFrameSet = this.leftFacingAnimationFrames;
            // Rendering related
            this.sprite = new Sprite_8.Sprite(Utils_6.Utils.DefaultSpriteVertices, Utils_6.Utils.CreateTextureCoordinates(0.0 / 12.0, 0.0 / 8.0, 1.0 / 12.0, 1.0 / 8.0));
            this.batch = new SpriteBatch_6.SpriteBatch(this.shader, [this.sprite], this.texture);
            // Behaviour related
            this.timeSinceLastAttack = 0;
            this.lastFacingDirection = gl_matrix_10.vec3.fromValues(-1, 0, 0); // Facing right by default
            this.health = 3;
            this.damagedTime = 0;
            this.damaged = false;
            this.bbSize = gl_matrix_10.vec2.fromValues(4.8, 3);
            this.bbOffset = gl_matrix_10.vec3.fromValues(0.1, 1.5, 0);
            this.bbSprite = new Sprite_8.Sprite(Utils_6.Utils.DefaultSpriteVertices, Utils_6.Utils.DefaultSpriteTextureCoordinates);
            this.bbBatch = new SpriteBatch_6.SpriteBatch(this.bbShader, [this.bbSprite], null);
            this.sprite.textureOffset = this.leftFacingAnimationFrames[0];
            // this.bbShader.SetVec4Uniform('clr', vec4.fromValues(1, 0, 0, 0.4));
        }
        static async Create(position, visualScale, collider, hero, onDeath, spawnProjectile) {
            const shader = await Shader_6.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_6.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const enemyDamageSound = await SoundEffectPool_4.SoundEffectPool.GetInstance().GetAudio('audio/enemy_damage.wav');
            const enemyDeathSound = await SoundEffectPool_4.SoundEffectPool.GetInstance().GetAudio('audio/enemy_death.wav');
            const biteAttackSound = await SoundEffectPool_4.SoundEffectPool.GetInstance().GetAudio('audio/bite2.wav');
            const rushSound = await SoundEffectPool_4.SoundEffectPool.GetInstance().GetAudio('audio/dragon_roar.mp3');
            const backingStartSound = await SoundEffectPool_4.SoundEffectPool.GetInstance().GetAudio('audio/charge_up.mp3');
            const texture = await TexturePool_5.TexturePool.GetInstance().GetTexture('textures/Monster2.png');
            return new DragonEnemy(position, shader, bbShader, visualScale, collider, hero, onDeath, spawnProjectile, enemyDamageSound, enemyDeathSound, biteAttackSound, rushSound, backingStartSound, texture);
        }
        Visit(hero) {
            hero.CollideWithDragon(this); // This call is not needad at all as hero does nothing with this interaction
        }
        CollideWithAttack(attack) {
            this.Damage(attack.PushbackForce);
        }
        get Position() {
            return this.position;
        }
        get CenterPosition() {
            return gl_matrix_10.vec3.fromValues(this.position[0] + this.visualScale[0] / 2, this.position[1] + this.visualScale[1] / 2, 0);
        }
        get FacingDirection() {
            return this.lastFacingDirection;
        }
        get BoundingBox() {
            return new BoundingBox_4.BoundingBox(gl_matrix_10.vec3.add(gl_matrix_10.vec3.create(), this.position, this.bbOffset), this.bbSize);
        }
        get EndCondition() {
            return false;
        }
        IsCollidingWith(boundingBox) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        Damage(pushbackForce) {
            // Dragon ignores pushback at the moment
            this.enemyDamageSound.Play();
            this.health--;
            this.shader.SetVec4Uniform('colorOverlay', gl_matrix_10.vec4.fromValues(1, 0, 0, 0));
            // TODO: dragon does not have velocity at the moment
            //vec3.set(this.velocity, pushbackForce[0], pushbackForce[1], 0);
            this.damaged = true;
            if (this.health <= 0) {
                if (this.onDeath) {
                    this.enemyDeathSound.Play();
                    this.onDeath(this);
                }
            }
            // Cancel rush on damage
            if (this.state === State.RUSH) {
                this.state = State.IDLE;
                this.rushState = RushState.START;
            }
        }
        Draw(proj, view) {
            this.batch.Draw(proj, view);
            gl_matrix_10.mat4.translate(this.batch.ModelMatrix, gl_matrix_10.mat4.create(), this.position);
            gl_matrix_10.mat4.scale(this.batch.ModelMatrix, this.batch.ModelMatrix, gl_matrix_10.vec3.fromValues(this.visualScale[0], this.visualScale[1], 1));
            // Bounding box drawing
            this.bbBatch.Draw(proj, view);
            gl_matrix_10.mat4.translate(this.bbBatch.ModelMatrix, gl_matrix_10.mat4.create(), this.BoundingBox.position);
            gl_matrix_10.mat4.scale(this.bbBatch.ModelMatrix, this.bbBatch.ModelMatrix, gl_matrix_10.vec3.fromValues(this.bbSize[0], this.bbSize[1], 1));
        }
        async Update(delta) {
            this.timeSinceLastAttack += delta;
            this.timeSinceLastCharge += delta;
            // Face in the direction of the hero
            const dir = gl_matrix_10.vec3.sub(gl_matrix_10.vec3.create(), this.CenterPosition, this.hero.CenterPosition);
            if (dir[0] < 0) {
                this.ChangeFrameSet(this.rightFacingAnimationFrames);
                gl_matrix_10.vec3.set(this.lastFacingDirection, -1, 0, 0);
            }
            else if (dir[0] > 0) {
                this.ChangeFrameSet(this.leftFacingAnimationFrames);
                gl_matrix_10.vec3.set(this.lastFacingDirection, 1, 0, 0);
            }
            this.Animate(delta);
            this.RemoveDamageOverlayAfter(delta, 1. / 60 * 1000 * 15);
            // Attack when hero is near
            const distance = gl_matrix_10.vec3.distance(this.CenterPosition, this.hero.CenterPosition);
            if (this.state !== State.RUSH) {
                if (this.timeSinceLastAttack > 2000) {
                    this.timeSinceLastAttack = 0;
                    // Spit fireball
                    if (distance < 30 && distance > 10) {
                        const projectileCenter = this.FacingDirection[0] > 0 ?
                            gl_matrix_10.vec3.add(gl_matrix_10.vec3.create(), this.CenterPosition, gl_matrix_10.vec3.fromValues(-3, 1, 0)) :
                            gl_matrix_10.vec3.add(gl_matrix_10.vec3.create(), this.CenterPosition, gl_matrix_10.vec3.fromValues(3, 1, 0));
                        const fireball = await Fireball_1.Fireball.Create(projectileCenter, gl_matrix_10.vec3.clone(this.FacingDirection), this.collider);
                        this.spawnProjectile(this, fireball);
                    }
                    // Bite
                    else if (distance < 5) {
                        const projectileCenter = this.FacingDirection[0] > 0 ?
                            gl_matrix_10.vec3.add(gl_matrix_10.vec3.create(), this.CenterPosition, gl_matrix_10.vec3.fromValues(-3, 1, 0)) :
                            gl_matrix_10.vec3.add(gl_matrix_10.vec3.create(), this.CenterPosition, gl_matrix_10.vec3.fromValues(3, 1, 0));
                        const bite = await BiteProjectile_1.BiteProjectile.Create(projectileCenter, this.FacingDirection);
                        this.biteAttackSound.Play();
                        this.spawnProjectile(this, bite);
                    }
                }
            }
            // Change to charge attack when the hero is in the attack interval
            if (distance < 20 && distance > 5 && this.timeSinceLastCharge > 5000) {
                this.state = State.RUSH;
                this.timeSinceLastCharge = 0;
                this.timeSinceLastAttack = 0;
            }
            await this.HandleRushState(delta);
            // Follow hero on the Y axis with a little delay.
            // "Delay" is achieved by moving the dragon slower than the hero movement speed.
            this.MatchHeroHeight(delta);
            // TODO: gravity to velocity -- flying enemy maybe does not need gravity?
            // TODO: velocity to position
        }
        // TODO: duplicated all over the place
        RemoveDamageOverlayAfter(delta, showOverlayTime) {
            if (this.damaged) {
                this.damagedTime += delta;
            }
            if (this.damagedTime > showOverlayTime) {
                this.damagedTime = 0;
                this.damaged = false;
                this.shader.SetVec4Uniform('colorOverlay', gl_matrix_10.vec4.create());
            }
        }
        MatchHeroHeight(delta) {
            if (this.rushState !== RushState.CHARGE) {
                // Reduce shaking by only moving when the distance is larger than a limit
                const distance = Math.abs(this.hero.CenterPosition[1] - this.CenterPosition[1]);
                if (distance > 0.2) {
                    const dir = gl_matrix_10.vec3.sub(gl_matrix_10.vec3.create(), this.CenterPosition, this.hero.CenterPosition);
                    if (dir[1] > 0) {
                        this.MoveOnY(-0.0025, delta);
                    }
                    else if (dir[1] < 0) {
                        this.MoveOnY(0.0025, delta);
                    }
                }
            }
        }
        MoveOnX(amount, delta) {
            // TODO: this fails with fast movement speed
            const nextPosition = gl_matrix_10.vec3.fromValues(this.position[0] + amount * delta, this.position[1], this.position[2]);
            if (!this.CheckCollisionWithCollider(nextPosition)) {
                this.position = nextPosition;
            }
        }
        MoveOnY(amount, delta) {
            const nextPosition = gl_matrix_10.vec3.fromValues(this.position[0], this.position[1] + amount * delta, 0);
            if (!this.CheckCollisionWithCollider(nextPosition)) {
                this.position = nextPosition;
            }
        }
        CheckCollisionWithCollider(nextPosition) {
            const nextBbPos = gl_matrix_10.vec3.add(gl_matrix_10.vec3.create(), nextPosition, this.bbOffset);
            const nextBoundingBox = new BoundingBox_4.BoundingBox(nextBbPos, this.bbSize);
            const colliding = this.collider.IsCollidingWith(nextBoundingBox, true);
            return colliding;
        }
        Animate(delta) {
            this.currentFrameTime += delta;
            if (this.currentFrameTime > 264) {
                this.currentAnimationFrame++;
                if (this.currentAnimationFrame > 2) {
                    this.currentAnimationFrame = 0;
                }
                const currentFrame = this.currentFrameSet[this.currentAnimationFrame];
                this.sprite.textureOffset = currentFrame;
                this.currentFrameTime = 0;
            }
        }
        /**
         * Helper function to make frame changes seamless by immediatelly changing the spite offset when a frame change happens
         */
        ChangeFrameSet(frames) {
            this.currentFrameSet = frames;
            this.sprite.textureOffset = this.currentFrameSet[this.currentAnimationFrame];
        }
        async HandleRushState(delta) {
            if (this.state === State.RUSH) {
                if (this.rushState === RushState.START) {
                    this.timeInBacking = 0;
                    this.rushState = RushState.BACKING;
                    this.backingStartSound.Play(1.0, 0.3);
                }
                else if (this.rushState === RushState.BACKING) {
                    this.timeInBacking += delta;
                    const dir = gl_matrix_10.vec3.sub(gl_matrix_10.vec3.create(), this.CenterPosition, this.hero.CenterPosition);
                    if (dir[0] > 0) {
                        this.MoveOnX(0.0035, delta);
                    }
                    else if (dir[0] < 0) {
                        this.MoveOnX(-0.0035, delta);
                    }
                    if (this.timeInBacking > 3000 || (gl_matrix_10.vec3.distance(this.CenterPosition, this.hero.CenterPosition) > 15 && this.timeInBacking > 1000)) {
                        this.timeInBacking = 0;
                        this.rushState = RushState.CHARGE;
                        this.herosLastPositionWhenTheChargingStarted = gl_matrix_10.vec3.clone(this.hero.CenterPosition);
                        this.rushSound.Play();
                    }
                }
                else if (this.rushState === RushState.CHARGE) {
                    this.timeInCharge += delta;
                    this.timeSinceLastAttack = 0;
                    this.timeSinceLastCharge = 0;
                    const dir = gl_matrix_10.vec3.sub(gl_matrix_10.vec3.create(), this.CenterPosition, this.hero.CenterPosition);
                    if (dir[0] > 0) {
                        this.MoveOnX(-0.035, delta);
                    }
                    else if (dir[0] < 0) {
                        this.MoveOnX(0.035, delta);
                    }
                    // Move out of charge state when distance on the Y axis is close enough
                    const distanceOnX = Math.abs(this.CenterPosition[0] - this.hero.CenterPosition[0]);
                    if (distanceOnX < 3) {
                        this.rushState = RushState.PRE_ATTACK;
                        this.timeInCharge = 0;
                    }
                }
                else if (this.rushState === RushState.PRE_ATTACK) {
                    // The charge is completed but we wait a couple of frames before executing an attack
                    this.timeinPreAttack += delta;
                    if (this.timeinPreAttack > 96) {
                        this.timeinPreAttack = 0;
                        this.rushState = RushState.ATTACK;
                    }
                }
                else if (this.rushState === RushState.ATTACK) {
                    // Spawn a bite projectile
                    // This is handled differently from the normal attack, when the hero remains close
                    const projectileCenter = this.FacingDirection[0] > 0 ?
                        gl_matrix_10.vec3.add(gl_matrix_10.vec3.create(), this.CenterPosition, gl_matrix_10.vec3.fromValues(-2.5, 1, 0)) :
                        gl_matrix_10.vec3.add(gl_matrix_10.vec3.create(), this.CenterPosition, gl_matrix_10.vec3.fromValues(2.5, 1, 0));
                    const bite = await BiteProjectile_1.BiteProjectile.Create(projectileCenter, gl_matrix_10.vec3.clone(this.FacingDirection));
                    this.biteAttackSound.Play();
                    this.spawnProjectile(this, bite);
                    this.timeSinceLastAttack = 0;
                    this.state = State.IDLE;
                    this.rushState = RushState.START;
                    return;
                }
            }
        }
        Dispose() {
            this.batch.Dispose();
            this.bbBatch.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
    }
    exports.DragonEnemy = DragonEnemy;
});
define("Enemies/Spike", ["require", "exports", "gl-matrix", "TexturePool", "Sprite", "Utils", "SpriteBatch", "Shader", "BoundingBox"], function (require, exports, gl_matrix_11, TexturePool_6, Sprite_9, Utils_7, SpriteBatch_7, Shader_7, BoundingBox_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Spike = void 0;
    /**
     * Stationary enemy. Cannot be damaged. Can damage the hero
     * // TODO: maybe not enemy, but game object like Coin
     */
    class Spike {
        constructor(position, visualScale, shader, bbShader, texture) {
            this.position = position;
            this.visualScale = visualScale;
            this.shader = shader;
            this.bbShader = bbShader;
            this.texture = texture;
            this.sprite = new Sprite_9.Sprite(Utils_7.Utils.DefaultSpriteVertices, Utils_7.Utils.DefaultSpriteTextureCoordinates);
            this.batch = new SpriteBatch_7.SpriteBatch(this.shader, [this.sprite], this.texture);
            this.bbSize = gl_matrix_11.vec2.fromValues(1, 1);
            this.bbOffset = gl_matrix_11.vec3.fromValues(0, 0, 0);
            this.bbSprite = new Sprite_9.Sprite(Utils_7.Utils.DefaultSpriteVertices, Utils_7.Utils.DefaultSpriteTextureCoordinates);
            this.bbBatch = new SpriteBatch_7.SpriteBatch(this.bbShader, [this.bbSprite], null);
            //  this.bbShader.SetVec4Uniform('clr', vec4.fromValues(1, 0, 0, 0.3));
        }
        CollideWithAttack(attack) {
            this.Damage(attack.PushbackForce); // No op at the moment. See: Damage()
        }
        static async Create(position, visualScale) {
            const shader = await Shader_7.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_7.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const texture = await TexturePool_6.TexturePool.GetInstance().GetTexture('textures/spike.png');
            return new Spike(position, visualScale, shader, bbShader, texture);
        }
        Draw(proj, view) {
            this.batch.Draw(proj, view);
            gl_matrix_11.mat4.translate(this.batch.ModelMatrix, gl_matrix_11.mat4.create(), this.position);
            gl_matrix_11.mat4.scale(this.batch.ModelMatrix, this.batch.ModelMatrix, gl_matrix_11.vec3.fromValues(this.visualScale[0], this.visualScale[1], 1));
            this.bbBatch.Draw(proj, view);
            gl_matrix_11.mat4.translate(this.bbBatch.ModelMatrix, gl_matrix_11.mat4.create(), this.BoundingBox.position);
            gl_matrix_11.mat4.scale(this.bbBatch.ModelMatrix, this.bbBatch.ModelMatrix, gl_matrix_11.vec3.fromValues(this.bbSize[0], this.bbSize[1], 1));
        }
        async Update(delta) {
            // No update for spike at the moment
        }
        Damage(pushbackForce) {
            // Cannot damage a spike
        }
        get Position() {
            return this.position;
        }
        get BoundingBox() {
            return new BoundingBox_5.BoundingBox(gl_matrix_11.vec3.add(gl_matrix_11.vec3.create(), this.position, this.bbOffset), this.bbSize);
        }
        get EndCondition() {
            return false;
        }
        Visit(hero) {
            hero.CollideWithSpike(this);
        }
        IsCollidingWith(boundingBox) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        Dispose() {
            this.batch.Dispose();
            this.shader.Delete();
            this.bbBatch.Dispose();
            this.bbShader.Delete();
        }
    }
    exports.Spike = Spike;
});
define("Enemies/Cactus", ["require", "exports", "gl-matrix", "BoundingBox", "TexturePool", "Shader", "Sprite", "Utils", "SpriteBatch", "SoundEffectPool"], function (require, exports, gl_matrix_12, BoundingBox_6, TexturePool_7, Shader_8, Sprite_10, Utils_8, SpriteBatch_8, SoundEffectPool_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Cactus = void 0;
    /**
     * Stationary enemy that cannot be stomped on (like spikes), but it can be damaged with a sword attack
     */
    class Cactus {
        constructor(position, onDeath, shader, bbShader, texture, enemyDamageSound, enemyDeathSound) {
            this.position = position;
            this.onDeath = onDeath;
            this.shader = shader;
            this.bbShader = bbShader;
            this.texture = texture;
            this.enemyDamageSound = enemyDamageSound;
            this.enemyDeathSound = enemyDeathSound;
            this.health = 3;
            this.damagedTime = 0;
            this.damaged = false;
            this.sprite = new Sprite_10.Sprite(Utils_8.Utils.DefaultSpriteVertices, Utils_8.Utils.CreateTextureCoordinates(0 / 6, 0 / 8, 1 / 6, 1 / 8));
            this.batch = new SpriteBatch_8.SpriteBatch(this.shader, [this.sprite], this.texture);
            this.visualScale = gl_matrix_12.vec2.fromValues(3, 3);
            this.currentFrameTime = 0;
            this.currentAnimationFrame = 0;
            this.currentFrameSet = [
                gl_matrix_12.vec2.fromValues(0 / 6, 0 / 8),
                gl_matrix_12.vec2.fromValues(1 / 6, 0 / 8),
                gl_matrix_12.vec2.fromValues(2 / 6, 0 / 8),
                gl_matrix_12.vec2.fromValues(3 / 6, 0 / 8),
                gl_matrix_12.vec2.fromValues(4 / 6, 0 / 8),
                gl_matrix_12.vec2.fromValues(5 / 6, 0 / 8),
                gl_matrix_12.vec2.fromValues(0 / 6, 1 / 8),
                gl_matrix_12.vec2.fromValues(1 / 6, 1 / 8),
                gl_matrix_12.vec2.fromValues(2 / 6, 1 / 8),
                gl_matrix_12.vec2.fromValues(3 / 6, 1 / 8),
                gl_matrix_12.vec2.fromValues(4 / 6, 1 / 8),
                gl_matrix_12.vec2.fromValues(5 / 6, 1 / 8),
                gl_matrix_12.vec2.fromValues(0 / 6, 2 / 8),
                gl_matrix_12.vec2.fromValues(1 / 6, 2 / 8),
                gl_matrix_12.vec2.fromValues(2 / 6, 2 / 8),
                gl_matrix_12.vec2.fromValues(3 / 6, 2 / 8),
                gl_matrix_12.vec2.fromValues(4 / 6, 2 / 8),
                gl_matrix_12.vec2.fromValues(5 / 6, 2 / 8),
                gl_matrix_12.vec2.fromValues(0 / 6, 3 / 8),
                gl_matrix_12.vec2.fromValues(1 / 6, 3 / 8),
                gl_matrix_12.vec2.fromValues(2 / 6, 3 / 8),
                gl_matrix_12.vec2.fromValues(3 / 6, 3 / 8),
                gl_matrix_12.vec2.fromValues(4 / 6, 3 / 8),
                gl_matrix_12.vec2.fromValues(5 / 6, 3 / 8),
                gl_matrix_12.vec2.fromValues(0 / 6, 4 / 8),
                gl_matrix_12.vec2.fromValues(1 / 6, 4 / 8),
                gl_matrix_12.vec2.fromValues(2 / 6, 4 / 8),
                gl_matrix_12.vec2.fromValues(3 / 6, 4 / 8),
                gl_matrix_12.vec2.fromValues(4 / 6, 4 / 8),
                gl_matrix_12.vec2.fromValues(5 / 6, 4 / 8),
                gl_matrix_12.vec2.fromValues(0 / 6, 5 / 8),
                gl_matrix_12.vec2.fromValues(1 / 6, 5 / 8),
                gl_matrix_12.vec2.fromValues(2 / 6, 5 / 8),
                gl_matrix_12.vec2.fromValues(3 / 6, 5 / 8),
                gl_matrix_12.vec2.fromValues(4 / 6, 5 / 8),
                gl_matrix_12.vec2.fromValues(5 / 6, 5 / 8),
                gl_matrix_12.vec2.fromValues(0 / 6, 6 / 8),
                gl_matrix_12.vec2.fromValues(1 / 6, 6 / 8),
                gl_matrix_12.vec2.fromValues(2 / 6, 6 / 8),
                gl_matrix_12.vec2.fromValues(3 / 6, 6 / 8),
                gl_matrix_12.vec2.fromValues(4 / 6, 6 / 8),
                gl_matrix_12.vec2.fromValues(5 / 6, 6 / 8),
                gl_matrix_12.vec2.fromValues(0 / 6, 7 / 8),
                gl_matrix_12.vec2.fromValues(1 / 6, 7 / 8),
            ];
            this.bbOffset = gl_matrix_12.vec3.fromValues(0.35, 0.5, 0);
            this.bbSize = gl_matrix_12.vec2.fromValues(2.3, 2.5);
            this.bbSprite = new Sprite_10.Sprite(Utils_8.Utils.DefaultSpriteVertices, Utils_8.Utils.DefaultSpriteTextureCoordinates);
            this.bbBatch = new SpriteBatch_8.SpriteBatch(this.bbShader, [this.bbSprite], null);
            // this.bbShader.SetVec4Uniform('clr', vec4.fromValues(1, 0, 0, 0.4));
        }
        static async Create(position, onDeath) {
            const shader = await Shader_8.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_8.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const damegeSound = await SoundEffectPool_5.SoundEffectPool.GetInstance().GetAudio('audio/enemy_damage.wav');
            const deathSound = await SoundEffectPool_5.SoundEffectPool.GetInstance().GetAudio('audio/enemy_death.wav');
            const texture = await TexturePool_7.TexturePool.GetInstance().GetTexture('textures/cactus1.png');
            return new Cactus(position, onDeath, shader, bbShader, texture, damegeSound, deathSound);
        }
        CollideWithAttack(attack) {
            this.Damage(attack.PushbackForce);
        }
        Draw(proj, view) {
            this.batch.Draw(proj, view);
            this.batch.ModelMatrix = gl_matrix_12.mat4.create();
            gl_matrix_12.mat4.translate(this.batch.ModelMatrix, this.batch.ModelMatrix, this.position);
            gl_matrix_12.mat4.scale(this.batch.ModelMatrix, this.batch.ModelMatrix, gl_matrix_12.vec3.fromValues(this.visualScale[0], this.visualScale[1], 1));
            this.bbBatch.Draw(proj, view);
            gl_matrix_12.mat4.translate(this.bbBatch.ModelMatrix, gl_matrix_12.mat4.create(), this.BoundingBox.position);
            gl_matrix_12.mat4.scale(this.bbBatch.ModelMatrix, this.bbBatch.ModelMatrix, gl_matrix_12.vec3.fromValues(this.bbSize[0], this.bbSize[1], 1));
        }
        async Update(delta) {
            this.Animate(delta);
            this.RemoveDamageOverlayAfter(delta, 1. / 60 * 1000 * 15);
        }
        Animate(delta) {
            this.currentFrameTime += delta;
            if (this.currentFrameTime > 64) { // ~15 fps
                this.currentAnimationFrame++;
                if (this.currentAnimationFrame >= this.currentFrameSet.length) {
                    this.currentAnimationFrame = 0;
                }
                const currentFrame = this.currentFrameSet[this.currentAnimationFrame];
                this.sprite.textureOffset = currentFrame;
                this.currentFrameTime = 0;
            }
        }
        Damage(pushbackForce) {
            this.enemyDamageSound.Play();
            this.health--;
            this.shader.SetVec4Uniform('colorOverlay', gl_matrix_12.vec4.fromValues(1, 0, 0, 0));
            // Cacti cannot move
            // vec3.set(this.velocity, pushbackForce[0], pushbackForce[1], 0);
            this.damaged = true;
            if (this.health <= 0) {
                if (this.onDeath) {
                    this.enemyDeathSound.Play();
                    this.onDeath(this);
                }
            }
        }
        get Position() {
            return this.position;
        }
        get BoundingBox() {
            return new BoundingBox_6.BoundingBox(gl_matrix_12.vec3.add(gl_matrix_12.vec3.create(), this.position, this.bbOffset), this.bbSize);
        }
        get EndCondition() {
            return false;
        }
        Visit(hero) {
            hero.CollideWithCactus(this);
        }
        IsCollidingWith(boundingBox, _) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        RemoveDamageOverlayAfter(delta, showOverlayTime) {
            if (this.damaged) {
                this.damagedTime += delta;
            }
            if (this.damagedTime > showOverlayTime) {
                this.damagedTime = 0;
                this.damaged = false;
                this.shader.SetVec4Uniform('colorOverlay', gl_matrix_12.vec4.create());
            }
        }
        Dispose() {
            this.batch.Dispose();
            this.bbBatch.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
    }
    exports.Cactus = Cactus;
});
define("Pickups/IPickup", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Pickups/HealthPickup", ["require", "exports", "gl-matrix", "BoundingBox", "Shader", "TexturePool", "Sprite", "Utils", "SpriteBatch", "SoundEffectPool"], function (require, exports, gl_matrix_13, BoundingBox_7, Shader_9, TexturePool_8, Sprite_11, Utils_9, SpriteBatch_9, SoundEffectPool_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HealthPickup = void 0;
    class HealthPickup {
        constructor(position, onPickup, shader, pickupSound, texture) {
            this.position = position;
            this.onPickup = onPickup;
            this.shader = shader;
            this.pickupSound = pickupSound;
            this.texture = texture;
            this.visualScale = gl_matrix_13.vec3.fromValues(2, 2, 1);
            this.sprite = new Sprite_11.Sprite(Utils_9.Utils.DefaultSpriteVertices, Utils_9.Utils.DefaultSpriteTextureCoordinates);
            this.batch = new SpriteBatch_9.SpriteBatch(this.shader, [this.sprite], this.texture);
            this.currentTime = 0;
            this.startPosition = gl_matrix_13.vec3.clone(position);
        }
        static async Create(position, onPickup) {
            const shader = await Shader_9.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const pickupSound = await SoundEffectPool_6.SoundEffectPool.GetInstance().GetAudio('audio/item1.wav', false);
            const texture = await TexturePool_8.TexturePool.GetInstance().GetTexture('textures/potion.png');
            return new HealthPickup(position, onPickup, shader, pickupSound, texture);
        }
        get EndCondition() {
            return false;
        }
        get BoundingBox() {
            return new BoundingBox_7.BoundingBox(this.position, gl_matrix_13.vec2.fromValues(this.visualScale[0], this.visualScale[1]));
        }
        get Increase() {
            return 20;
        }
        Draw(proj, view) {
            gl_matrix_13.mat4.translate(this.batch.ModelMatrix, gl_matrix_13.mat4.create(), this.position);
            gl_matrix_13.mat4.scale(this.batch.ModelMatrix, this.batch.ModelMatrix, this.visualScale);
            this.batch.Draw(proj, view);
        }
        async Update(delta) {
            this.currentTime += delta;
            const frequency = 0.5; // 0.5 Hz
            const amplitude = 0.15;
            const yOffset = amplitude * Math.sin(2 * Math.PI * frequency * (this.currentTime / 1000));
            this.position[1] = this.startPosition[1] + yOffset;
        }
        IsCollidingWith(boundingBox, collideWithUndefined) {
            return this.BoundingBox.IsCollidingWith(boundingBox);
        }
        CollideWithAttack(attack) {
            // No-op
        }
        Visit(hero) {
            this.pickupSound.Play();
            hero.CollideWithHealth(this);
            this.onPickup(this); // Despawning is handled by the Game object, so we need no notify it that it can now despawn the object
        }
        Dispose() {
            this.batch.Dispose();
            this.shader.Delete();
        }
    }
    exports.HealthPickup = HealthPickup;
});
define("Pickups/CoinObject", ["require", "exports", "gl-matrix", "BoundingBox", "Shader", "SpriteBatch", "Utils", "TexturePool", "AnimatedSprite", "SoundEffectPool"], function (require, exports, gl_matrix_14, BoundingBox_8, Shader_10, SpriteBatch_10, Utils_10, TexturePool_9, AnimatedSprite_1, SoundEffectPool_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CoinObject = void 0;
    class CoinObject {
        constructor(position, onPickup, shader, pickupSound, texture) {
            this.position = position;
            this.onPickup = onPickup;
            this.shader = shader;
            this.pickupSound = pickupSound;
            this.texture = texture;
            this.sprite = new AnimatedSprite_1.AnimatedSprite(Utils_10.Utils.DefaultSpriteVertices, // Im translating to the position on draw, this way a position can be dynamic
            Utils_10.Utils.CreateTextureCoordinates(0, 0, 1.0 / 10, 1.0)); // TODO: this is hardcoded for coin.png
            this.batch = new SpriteBatch_10.SpriteBatch(shader, [this.sprite], this.texture);
        }
        static async Create(position, onPickup) {
            const shader = await Shader_10.Shader.Create('shaders/VertexShader.vert', 'shaders/FragmentShader.frag');
            const pickupSound = await SoundEffectPool_7.SoundEffectPool.GetInstance().GetAudio('audio/collect.mp3');
            const texture = await TexturePool_9.TexturePool.GetInstance().GetTexture('textures/coin.png');
            return new CoinObject(position, onPickup, shader, pickupSound, texture);
        }
        get BoundingBox() {
            return new BoundingBox_8.BoundingBox(this.position, gl_matrix_14.vec2.fromValues(1, 1));
        }
        get EndCondition() {
            return true;
        }
        CollideWithAttack(attack) {
            // No-op
        }
        Visit(hero) {
            this.pickupSound.Play();
            hero.CollideWithCoin(this);
            this.onPickup(this);
        }
        IsCollidingWith(boundingBox) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        async Update(elapsedTime) {
            this.sprite.Update(elapsedTime);
        }
        Draw(proj, view) {
            this.batch.Draw(proj, view);
            gl_matrix_14.mat4.translate(this.batch.ModelMatrix, gl_matrix_14.mat4.create(), this.position);
        }
        Dispose() {
            this.batch.Dispose();
            this.shader.Delete();
        }
    }
    exports.CoinObject = CoinObject;
});
define("XBoxControllerKeys", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.XBoxControllerKeys = void 0;
    class XBoxControllerKeys {
    }
    exports.XBoxControllerKeys = XBoxControllerKeys;
    XBoxControllerKeys.A = 0;
    XBoxControllerKeys.B = 1;
    XBoxControllerKeys.X = 2;
    XBoxControllerKeys.Y = 3;
    XBoxControllerKeys.LB = 4;
    XBoxControllerKeys.RB = 5;
    XBoxControllerKeys.LT = 6;
    XBoxControllerKeys.RT = 7;
    XBoxControllerKeys.SELECT = 8;
    XBoxControllerKeys.START = 9;
    XBoxControllerKeys.L3 = 10;
    XBoxControllerKeys.R3 = 11;
    XBoxControllerKeys.UP = 12;
    XBoxControllerKeys.DOWN = 13;
    XBoxControllerKeys.LEFT = 14;
    XBoxControllerKeys.RIGHT = 15;
});
define("Keys", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Keys = void 0;
    class Keys {
    }
    exports.Keys = Keys;
    Keys.W = 'KeyW';
    Keys.A = 'KeyA';
    Keys.S = 'KeyS';
    Keys.D = 'KeyD';
    Keys.E = 'KeyE';
    Keys.SPACE = 'Space';
    Keys.RIGHT_CONTROL = 'ControlRight';
    Keys.LEFT_CONTROL = 'ControlLeft';
    Keys.LEFT_SHIFT = 'ShiftLeft';
    Keys.ENTER = 'Enter';
});
define("Projectiles/MeleeAttack", ["require", "exports", "gl-matrix", "BoundingBox", "Shader", "Sprite", "SpriteBatch", "TexturePool", "Utils", "SoundEffectPool"], function (require, exports, gl_matrix_15, BoundingBox_9, Shader_11, Sprite_12, SpriteBatch_11, TexturePool_10, Utils_11, SoundEffectPool_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MeleeAttack = void 0;
    // MeleeAttack is considered as a stationary projectile
    class MeleeAttack {
        constructor(position, facingDirection, shader, bbShader, attackSound, texture, despawnProjectile) {
            this.position = position;
            this.facingDirection = facingDirection;
            this.shader = shader;
            this.bbShader = bbShader;
            this.attackSound = attackSound;
            this.texture = texture;
            this.despawnProjectile = despawnProjectile;
            this.attackSoundPlayed = false;
            // TODO: animation also could be a component
            this.currentFrameTime = 0;
            this.currentAnimationFrame = 0;
            this.spriteVisualScale = gl_matrix_15.vec3.fromValues(4, 3, 0);
            this.sprite = new Sprite_12.Sprite(Utils_11.Utils.DefaultSpriteVertices, Utils_11.Utils.CreateTextureCoordinates(1.0 / 5.0, 1.0 / 2.0, 1 / 5.0, 1 / 2.0));
            this.batch = new SpriteBatch_11.SpriteBatch(this.shader, [this.sprite], this.texture);
            this.bbSize = gl_matrix_15.vec2.fromValues(1.25, 2);
            // Center the bb inside the attack sprite based on it's size
            this.bbOffset = gl_matrix_15.vec3.fromValues(this.spriteVisualScale[0] / 2 - (this.bbSize[0] / 2), this.spriteVisualScale[1] / 2 - this.bbSize[1] / 2, 0);
            this.bbSprite = new Sprite_12.Sprite(Utils_11.Utils.DefaultSpriteVertices, Utils_11.Utils.DefaultSpriteTextureCoordinates);
            this.bbBatch = new SpriteBatch_11.SpriteBatch(this.bbShader, [this.bbSprite], null);
            this.alreadyHit = false;
            this.animationFinished = false;
            this.OnHitListeners = [];
            //  this.shader.SetVec4Uniform('colorOverlay', vec4.fromValues(0, 0, 1, 0.5));
            //  this.bbShader.SetVec4Uniform('clr', vec4.fromValues(1, 0, 0, 0.5));
        }
        CollideWithAttack(attack) {
            // No-op as hero attacks shouldn't interact with each other
        }
        static async Create(position, facingDirection, despawnProjectile) {
            // TODO: i really should rename the fragment shader from Hero.frag as everything seems to use it...
            const shader = await Shader_11.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_11.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const attackSound = await SoundEffectPool_8.SoundEffectPool.GetInstance().GetAudio('audio/sword.mp3');
            const texture = await TexturePool_10.TexturePool.GetInstance().GetTexture('textures/Sword1.png');
            return new MeleeAttack(position, facingDirection, shader, bbShader, attackSound, texture, despawnProjectile);
        }
        IsCollidingWith(boundingBox) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        get EndCondition() {
            return false;
        }
        get BoundingBox() {
            return new BoundingBox_9.BoundingBox(gl_matrix_15.vec3.add(gl_matrix_15.vec3.create(), this.position, this.bbOffset), this.bbSize);
        }
        get PushbackForce() {
            const pushbackForce = gl_matrix_15.vec3.fromValues(this.facingDirection[0] / 10, -0.005, 0);
            return pushbackForce;
        }
        get AlreadyHit() {
            return this.alreadyHit;
        }
        OnHit() {
            this.alreadyHit = true;
            // no hit sound here for the moment as it can differ on every enemy type
        }
        Visit(hero) {
            // this shouldnt happen as melee attack is an attack by the hero. In the future enemies could use it too...
            throw new Error('Method not implemented.');
        }
        // TODO: drawing logic for entities should be an ECS
        Draw(proj, view) {
            if (!this.animationFinished) {
                gl_matrix_15.mat4.translate(this.batch.ModelMatrix, gl_matrix_15.mat4.create(), this.position);
                gl_matrix_15.mat4.scale(this.batch.ModelMatrix, this.batch.ModelMatrix, this.spriteVisualScale);
                this.batch.Draw(proj, view);
            }
            // Draw bb
            gl_matrix_15.mat4.translate(this.bbBatch.ModelMatrix, gl_matrix_15.mat4.create(), this.BoundingBox.position);
            gl_matrix_15.mat4.scale(this.bbBatch.ModelMatrix, this.bbBatch.ModelMatrix, gl_matrix_15.vec3.fromValues(this.BoundingBox.size[0], this.BoundingBox.size[1], 1));
            this.bbBatch.Draw(proj, view);
        }
        async Update(delta) {
            if (!this.attackSoundPlayed) {
                this.attackSound.Play();
                this.attackSoundPlayed = true;
            }
            this.Animate(delta);
            if (this.animationFinished) {
                this.despawnProjectile(this);
            }
        }
        // TODO: animation feels like an ECS too
        // TODO: animation like in DragonEnemy
        Animate(delta) {
            this.currentFrameTime += delta;
            if (this.currentFrameTime > 30) {
                this.currentAnimationFrame++;
                if (this.currentAnimationFrame > 4) {
                    this.animationFinished = true;
                    this.currentAnimationFrame = 1;
                }
                // TODO: hardcoded for sword.png. Make animation parametrizable
                this.sprite.textureOffset = gl_matrix_15.vec2.fromValues(this.currentAnimationFrame / 5.0, 0 / 2.0);
                this.currentFrameTime = 0;
            }
        }
        Dispose() {
            this.batch.Dispose();
            this.bbBatch.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
    }
    exports.MeleeAttack = MeleeAttack;
});
define("Hero", ["require", "exports", "gl-matrix", "Shader", "Sprite", "SpriteBatch", "TexturePool", "Utils", "BoundingBox", "SoundEffectPool", "XBoxControllerKeys", "Keys", "Projectiles/MeleeAttack"], function (require, exports, gl_matrix_16, Shader_12, Sprite_13, SpriteBatch_12, TexturePool_11, Utils_12, BoundingBox_10, SoundEffectPool_9, XBoxControllerKeys_1, Keys_1, MeleeAttack_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Hero = void 0;
    var State;
    (function (State) {
        State["IDLE"] = "idle";
        State["WALK"] = "walk";
        State["DEAD"] = "dead";
        State["STOMP"] = "stomp";
        State["JUMP"] = "jump";
        State["DASH"] = "dash";
    })(State || (State = {}));
    class Hero {
        get BoundingBox() {
            if (this.state !== State.STOMP) {
                const bbPosition = gl_matrix_16.vec3.add(gl_matrix_16.vec3.create(), this.position, this.bbOffset);
                return new BoundingBox_10.BoundingBox(bbPosition, this.bbSize);
            }
            else {
                const bbPosition = gl_matrix_16.vec3.add(gl_matrix_16.vec3.create(), this.position, gl_matrix_16.vec3.fromValues(0.75, 1.0, 0));
                return new BoundingBox_10.BoundingBox(bbPosition, gl_matrix_16.vec2.fromValues(1.5, 2));
            }
        }
        get CollectedCoins() {
            return this.collectedCoins;
        }
        get Health() {
            return this.health;
        }
        set Health(value) {
            this.health = value;
            if (this.health < 0) {
                this.health = 0;
            }
        }
        get FacingDirection() {
            return this.lastFacingDirection;
        }
        get Position() {
            return this.position;
        }
        get CenterPosition() {
            return gl_matrix_16.vec3.fromValues(this.position[0] + this.visualScale[0] / 2, this.position[1] + this.visualScale[1] / 2, 0);
        }
        constructor(position, visualScale, collider, onDeath, spawnProjectile, despawnProjectile, shader, bbShader, jumpSound, landSound, walkSound, stompSound, damageSound, dieSound, texture, keyHandler, gamepadHandler) {
            this.position = position;
            this.visualScale = visualScale;
            this.collider = collider;
            this.onDeath = onDeath;
            this.spawnProjectile = spawnProjectile;
            this.despawnProjectile = despawnProjectile;
            this.shader = shader;
            this.bbShader = bbShader;
            this.jumpSound = jumpSound;
            this.landSound = landSound;
            this.walkSound = walkSound;
            this.stompSound = stompSound;
            this.damageSound = damageSound;
            this.dieSound = dieSound;
            this.texture = texture;
            this.keyHandler = keyHandler;
            this.gamepadHandler = gamepadHandler;
            this.health = 100;
            this.collectedCoins = 0;
            this.state = State.IDLE;
            this.currentFrameTime = 0;
            this.currentAnimationFrame = 0;
            this.lastPosition = gl_matrix_16.vec3.fromValues(0, 0, 1);
            this.velocity = gl_matrix_16.vec3.fromValues(0, 0, 0);
            // BUG: Hero sometimes spawns its attack projectile in the wrong direction
            // TODO: longer range but much slower attack
            // TODO: make bb variables parametrizable
            // TODO: double jump
            // TODO: ECS system
            // TODO: state machines
            this.bbOffset = gl_matrix_16.vec3.fromValues(1.2, 1.1, 0);
            this.bbSize = gl_matrix_16.vec2.fromValues(0.8, 1.8);
            this.jumping = false;
            this.onGround = true;
            this.wasInAir = false;
            this.invincible = false;
            this.invincibleTime = 0;
            this.timeSinceLastStomp = 0;
            this.timeSinceLastDash = 0;
            this.dashAvailable = true;
            this.timeSinceLastMeleeAttack = 0;
            this.timeInOverHeal = 0;
            this.timeLeftInDeadState = 3000;
            this.bbSprite = new Sprite_13.Sprite(Utils_12.Utils.DefaultSpriteVertices, Utils_12.Utils.DefaultSpriteTextureCoordinates);
            this.bbBatch = new SpriteBatch_12.SpriteBatch(this.bbShader, [this.bbSprite], null);
            this.lastFacingDirection = gl_matrix_16.vec3.fromValues(1, 0, 0);
            this.sprite = new Sprite_13.Sprite(Utils_12.Utils.DefaultSpriteVertices, 
            // TODO: parametrize tex coords
            Utils_12.Utils.CreateTextureCoordinates(// texture-offset is added to these coordinates, so it must be (0,0)
            0.0 / 12.0, // These constants are hardcoded with "hero1.png" in mind
            0.0 / 8.0, 1.0 / 12.0, 1.0 / 8.0));
            this.sprite.textureOffset = gl_matrix_16.vec2.fromValues(1 / 12.0, 1 / 8.0);
            this.batch = new SpriteBatch_12.SpriteBatch(this.shader, [this.sprite], this.texture);
            // this.bbShader.SetVec4Uniform('clr', vec4.fromValues(1, 0, 0, 1));
        }
        static async Create(position, visualScale, collider, onDeath, spawnProjectile, despawnProjectile, keyHandler, gamepadHandler) {
            const shader = await Shader_12.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_12.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const jumpSound = await SoundEffectPool_9.SoundEffectPool.GetInstance().GetAudio('audio/jump.wav');
            const landSound = await SoundEffectPool_9.SoundEffectPool.GetInstance().GetAudio('audio/land.wav', false);
            const walkSound = await SoundEffectPool_9.SoundEffectPool.GetInstance().GetAudio('audio/walk1.wav', false);
            const stompSound = await SoundEffectPool_9.SoundEffectPool.GetInstance().GetAudio('audio/hero_stomp.wav', true);
            const damageSound = await SoundEffectPool_9.SoundEffectPool.GetInstance().GetAudio('audio/hero_damage.wav');
            const dieSound = await SoundEffectPool_9.SoundEffectPool.GetInstance().GetAudio('audio/hero_die.wav', false);
            const texture = await TexturePool_11.TexturePool.GetInstance().GetTexture('textures/hero1.png');
            const hero = new Hero(position, visualScale, collider, onDeath, spawnProjectile, despawnProjectile, shader, bbShader, jumpSound, landSound, walkSound, stompSound, damageSound, dieSound, texture, keyHandler, gamepadHandler);
            return hero;
        }
        Draw(proj, view) {
            this.batch.Draw(proj, view);
            const modelMat = gl_matrix_16.mat4.create();
            if (this.state === State.DEAD) {
                this.RotateSprite(modelMat, this.dirOnDeath);
            }
            gl_matrix_16.mat4.translate(modelMat, modelMat, this.position);
            gl_matrix_16.mat4.scale(modelMat, modelMat, gl_matrix_16.vec3.fromValues(this.visualScale[0], this.visualScale[1], 1));
            this.batch.ModelMatrix = modelMat;
            // Draw bounding box
            this.bbBatch.Draw(proj, view);
            gl_matrix_16.mat4.translate(this.bbBatch.ModelMatrix, gl_matrix_16.mat4.create(), this.BoundingBox.position);
            gl_matrix_16.mat4.scale(this.bbBatch.ModelMatrix, this.bbBatch.ModelMatrix, gl_matrix_16.vec3.fromValues(this.BoundingBox.size[0], this.BoundingBox.size[1], 1));
        }
        RotateSprite(modelMat, directionOnDeath) {
            const centerX = this.position[0] + this.visualScale[0] * 0.5;
            const centerY = this.position[1] + this.visualScale[1] * 0.5;
            gl_matrix_16.mat4.translate(modelMat, modelMat, gl_matrix_16.vec3.fromValues(centerX, centerY, 0));
            gl_matrix_16.mat4.rotateZ(modelMat, modelMat, directionOnDeath[0] > 0 ? -Math.PI / 2 : Math.PI / 2);
            gl_matrix_16.mat4.translate(modelMat, modelMat, gl_matrix_16.vec3.fromValues(-centerX, -centerY, 0));
        }
        Update(delta) {
            if (this.state !== State.DEAD) {
                this.Animate(delta);
                this.PlayWalkSounds();
                this.HandleLanding();
                this.DisableInvincibleStateAfter(delta, 15); // ~15 frame (1/60*1000*15)
                this.HandleDeath();
                // Slowly drain health when overhealed
                if (this.Health > 100) {
                    this.timeInOverHeal += delta;
                }
                if (this.timeInOverHeal > 1000) {
                    this.timeInOverHeal = 0;
                    this.Health--;
                }
                if (this.state !== State.STOMP) {
                    this.timeSinceLastStomp += delta;
                }
                this.timeSinceLastDash += delta;
                this.timeSinceLastMeleeAttack += delta;
                if (this.state === State.DASH && this.timeSinceLastDash > 300) {
                    this.state = State.WALK;
                }
                if (this.invincible) {
                    this.invincibleTime += delta;
                }
            }
            else if (this.state === State.DEAD) {
                this.timeLeftInDeadState -= delta;
                if (this.timeLeftInDeadState <= 0) {
                    this.onDeath();
                    this.timeLeftInDeadState = 3000;
                }
            }
            const dir = gl_matrix_16.vec3.subtract(gl_matrix_16.vec3.create(), this.position, this.lastPosition);
            if (dir[0]) {
                this.lastFacingDirection = dir;
            }
            gl_matrix_16.vec3.copy(this.lastPosition, this.position);
            this.ApplyGravityToVelocity(delta);
            this.ReduceHorizontalVelocityWhenDashing();
            this.ApplyVelocityToPosition(delta);
            this.HandleCollisionWithCollider();
            this.HandleInput(delta);
        }
        HandleInput(delta) {
            if (this.keyHandler.IsPressed(Keys_1.Keys.A) ||
                this.gamepadHandler.LeftStick[0] < -0.5 ||
                this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.LEFT)) {
                this.MoveLeft(0.01, delta);
            }
            else if (this.keyHandler.IsPressed(Keys_1.Keys.D) ||
                this.gamepadHandler.LeftStick[0] > 0.5 ||
                this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.RIGHT)) {
                this.MoveRight(0.01, delta);
            }
            if (this.keyHandler.IsPressed(Keys_1.Keys.SPACE) ||
                this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.A)) {
                this.Jump();
            }
            if (this.keyHandler.IsPressed(Keys_1.Keys.S) ||
                this.gamepadHandler.LeftStick[1] > 0.8 ||
                this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.DOWN)) {
                this.Stomp();
            }
            if (this.keyHandler.IsPressed(Keys_1.Keys.LEFT_SHIFT) || this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.RB)) {
                this.Dash();
            }
            if (this.keyHandler.IsPressed(Keys_1.Keys.E) || this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.X)) {
                const attackPosition = this.FacingDirection[0] > 0 ?
                    gl_matrix_16.vec3.add(gl_matrix_16.vec3.create(), this.Position, gl_matrix_16.vec3.fromValues(1.5, 0, 0)) :
                    gl_matrix_16.vec3.add(gl_matrix_16.vec3.create(), this.Position, gl_matrix_16.vec3.fromValues(-2.5, 0, 0));
                this.Attack(async () => {
                    // TODO: creating an attack instance on every attack is wasteful.
                    this.spawnProjectile(this, await MeleeAttack_1.MeleeAttack.Create(attackPosition, this.FacingDirection, this.despawnProjectile));
                });
            }
        }
        HandleDeath() {
            if (this.Health <= 0) {
                this.state = State.DEAD;
                this.dieSound.Play();
                const dir = gl_matrix_16.vec3.create();
                gl_matrix_16.vec3.subtract(dir, this.position, this.lastPosition);
                this.dirOnDeath = dir;
                this.bbSize = gl_matrix_16.vec2.fromValues(this.bbSize[1], this.bbSize[0]);
                // This is only kind-of correct, but im already in dead state so who cares if the bb is not correctly aligned.
                // The only important thing is not to fall through the geometry...
                this.bbOffset[0] = dir[0] > 0 ? this.bbOffset[0] : 1.5 - this.bbOffset[0];
            }
        }
        DisableInvincibleStateAfter(delta, numberOfFrames) {
            if (this.invincibleTime > 1.0 / 60 * 1000 * numberOfFrames) {
                this.invincible = false;
                this.invincibleTime = 0;
                this.shader.SetVec4Uniform('colorOverlay', gl_matrix_16.vec4.create());
            }
            this.invincible ? this.invincibleTime += delta : this.invincibleTime = 0;
        }
        HandleCollisionWithCollider() {
            const colliding = this.collider.IsCollidingWith(this.BoundingBox, true);
            if (colliding) {
                gl_matrix_16.vec3.copy(this.position, this.lastPosition);
                this.velocity = gl_matrix_16.vec3.create();
                this.onGround = true;
            }
            else {
                this.onGround = false;
            }
        }
        ApplyVelocityToPosition(delta) {
            const moveValue = gl_matrix_16.vec3.create();
            gl_matrix_16.vec3.scale(moveValue, this.velocity, delta);
            gl_matrix_16.vec3.add(this.position, this.position, moveValue);
        }
        ApplyGravityToVelocity(delta) {
            if (this.state !== State.DASH) {
                const gravity = gl_matrix_16.vec3.fromValues(0, 0.00004, 0);
                gl_matrix_16.vec3.add(this.velocity, this.velocity, gl_matrix_16.vec3.scale(gl_matrix_16.vec3.create(), gravity, delta));
            }
        }
        ReduceHorizontalVelocityWhenDashing() {
            if (!this.dashAvailable)
                this.velocity[0] *= 0.75;
        }
        Animate(delta) {
            this.currentFrameTime += delta;
            if (this.currentFrameTime > 132) {
                if (this.state === State.WALK) {
                    const dir = gl_matrix_16.vec3.create();
                    gl_matrix_16.vec3.subtract(dir, this.position, this.lastPosition);
                    if (gl_matrix_16.vec3.squaredLength(dir) > 0) {
                        this.sprite.textureOffset = this.calculateTextureOffset(gl_matrix_16.vec2.fromValues(dir[0], dir[1]));
                    }
                    else {
                        // same position as last frame, so it is considered idle
                        this.state = State.IDLE;
                        // Reset back to the idle frame of the last movement direction
                        // Now it is completly dependent on the currently used texture
                        // TODO: create a texture independent configuration for animation states
                        this.sprite.textureOffset = gl_matrix_16.vec2.fromValues(1 / 12.0, this.sprite.textureOffset[1]);
                    }
                }
            }
        }
        PlayWalkSounds() {
            if (this.state === State.WALK && this.position !== this.lastPosition && !this.jumping && this.onGround) {
                this.walkSound.Play(1.8, 0.8);
            }
            if (this.state === State.IDLE) {
                this.walkSound.Stop();
            }
        }
        HandleLanding() {
            const isOnGround = this.velocity[1] === 0 && !this.jumping;
            if (this.wasInAir && isOnGround) {
                this.landSound.Play(1.8, 0.5);
                this.dashAvailable = true;
            }
            this.wasInAir = !isOnGround;
            if (this.velocity[1] === 0) {
                this.jumping = false;
                this.state = State.IDLE;
            }
        }
        // TODO: move left, and move right should a change the velocity not the position itself
        MoveRight(amount, delta) {
            if (this.state !== State.DEAD && this.state !== State.STOMP && this.state !== State.DASH) {
                this.state = State.WALK;
                if (!this.invincible) {
                    const nextPosition = gl_matrix_16.vec3.fromValues(this.position[0] + amount * delta, this.position[1], this.position[2]);
                    if (!this.checkCollision(nextPosition)) {
                        this.position = nextPosition;
                    }
                }
            }
        }
        MoveLeft(amount, delta) {
            if (this.state !== State.DEAD && this.state !== State.STOMP && this.state !== State.DASH) {
                this.state = State.WALK;
                if (!this.invincible) {
                    const nextPosition = gl_matrix_16.vec3.fromValues(this.position[0] - amount * delta, this.position[1], this.position[2]);
                    if (!this.checkCollision(nextPosition)) {
                        this.position = nextPosition;
                    }
                }
            }
        }
        Jump() {
            // TODO: all these dead checks are getting ridiculous. Something really needs to be done...
            if (!this.jumping && this.onGround && this.state !== State.DEAD) {
                this.velocity[1] = -0.02;
                this.jumping = true;
                this.jumpSound.Play();
                this.state = State.JUMP;
            }
        }
        Stomp() {
            if (this.jumping && !this.onGround && this.state !== State.DEAD && this.state !== State.STOMP && this.timeSinceLastStomp > 350) {
                this.state = State.STOMP;
                this.velocity[1] = 0.04;
                this.invincible = true;
                this.timeSinceLastStomp = 0;
                this.stompSound.Play();
            }
        }
        Dash() {
            if (this.state !== State.DEAD
                && this.state !== State.IDLE
                && this.timeSinceLastDash > 300
                && this.state !== State.STOMP
                && this.dashAvailable) {
                this.state = State.DASH;
                const dir = gl_matrix_16.vec3.create();
                gl_matrix_16.vec3.subtract(dir, this.position, this.lastPosition);
                this.velocity[0] = 0.7 * dir[0];
                this.velocity[1] = -0.0001; // TODO: yet another little hack to make dash play nicely with collision detection
                this.stompSound.Play();
                this.timeSinceLastDash = 0;
                this.dashAvailable = false;
            }
        }
        Attack(afterAttack) {
            // TODO: yet another magic number
            if (this.state !== State.DEAD && this.timeSinceLastMeleeAttack > 350) {
                this.timeSinceLastMeleeAttack = 0;
                if (afterAttack) {
                    afterAttack();
                }
            }
        }
        CollideWithGameObject(object) {
            object.Visit(this);
        }
        InteractWithProjectile(projectile) {
            if (!projectile.AlreadyHit && this.state !== State.DEAD) {
                const pushbackForce = projectile.PushbackForce;
                this.Damage(pushbackForce);
                projectile.OnHit();
            }
        }
        CollideWithHealth(healthPickup) {
            this.Health += healthPickup.Increase;
        }
        CollideWithCoin(coin) {
            this.collectedCoins++;
        }
        CollideWithDragon(enemy) {
            // Do nothing
        }
        CollideWithSlime(enemy) {
            if (this.state !== State.STOMP) {
                if (!this.invincible) {
                    // Damage and pushback hero on collision.
                    this.invincible = true;
                    this.shader.SetVec4Uniform('colorOverlay', gl_matrix_16.vec4.fromValues(1, 0, 0, 0));
                    this.damageSound.Play();
                    this.Health -= 34;
                    const dir = gl_matrix_16.vec3.subtract(gl_matrix_16.vec3.create(), this.position, enemy.Position);
                    gl_matrix_16.vec3.normalize(dir, dir);
                    const damagePushback = gl_matrix_16.vec3.scale(gl_matrix_16.vec3.create(), dir, 0.01);
                    // TODO: this is a hack to make sure that the hero is not detected as colliding with the ground, so a pushback can happen
                    damagePushback[1] -= 0.01;
                    gl_matrix_16.vec3.set(this.velocity, damagePushback[0], damagePushback[1], 0);
                }
            }
            else if (this.state === State.STOMP) {
                gl_matrix_16.vec3.set(this.velocity, 0, -0.025, 0);
                this.state = State.JUMP;
                this.jumping = true;
                enemy.Damage(gl_matrix_16.vec3.create()); // Damage the enemy without pushing it to any direction
            }
        }
        CollideWithSpike(enemy) {
            const pushback = gl_matrix_16.vec3.fromValues(0, -0.018, 0);
            if (!this.invincible) {
                this.Damage(pushback);
            }
        }
        CollideWithCactus(enemy) {
            if (this.state !== State.STOMP) {
                const dir = gl_matrix_16.vec3.subtract(gl_matrix_16.vec3.create(), this.position, enemy.Position);
                gl_matrix_16.vec3.normalize(dir, dir);
                const pushback = gl_matrix_16.vec3.scale(gl_matrix_16.vec3.create(), dir, 0.01);
                pushback[1] -= 0.01;
                if (!this.invincible) {
                    this.Damage(pushback);
                }
            }
            else {
                const pushback = gl_matrix_16.vec3.fromValues(0, -0.025, 0);
                this.Damage(pushback);
                this.state = State.JUMP;
                this.jumping = true;
            }
        }
        Damage(pushbackForce) {
            // TODO: This is almost a 1:1 copy from the Collide method
            // Damage method should not consider the invincible flag because I dont want to cancel damage with projectiles when stomping
            if (this.state !== State.DEAD) {
                this.invincible = true;
                this.shader.SetVec4Uniform('colorOverlay', gl_matrix_16.vec4.fromValues(1, 0, 0, 0));
                this.damageSound.Play();
                this.Health -= 34;
                gl_matrix_16.vec3.set(this.velocity, pushbackForce[0], pushbackForce[1], 0);
            }
        }
        Kill() {
            if (this.state !== State.DEAD) {
                this.Health = 0;
            }
        }
        checkCollision(nextPosition) {
            const nextBoundingBox = new BoundingBox_10.BoundingBox(gl_matrix_16.vec3.add(gl_matrix_16.vec3.create(), nextPosition, this.bbOffset), this.bbSize);
            return this.collider.IsCollidingWith(nextBoundingBox, true);
        }
        calculateTextureOffset(direction) {
            if (direction[0] > 0) {
                const offset = gl_matrix_16.vec2.fromValues(this.currentAnimationFrame++ / 12.0, 1.0 / 8.0);
                if (this.currentAnimationFrame === 3) {
                    this.currentAnimationFrame = 0;
                }
                this.currentFrameTime = 0;
                return offset;
            }
            else if (direction[0] < 0) {
                const offset = gl_matrix_16.vec2.fromValues(this.currentAnimationFrame++ / 12.0, 3.0 / 8.0);
                if (this.currentAnimationFrame === 3) {
                    this.currentAnimationFrame = 0;
                }
                this.currentFrameTime = 0;
                return offset;
            }
            // Remain in the current animation frame if a correct frame could not be determined
            return this.sprite.textureOffset;
        }
        Dispose() {
            this.batch.Dispose();
            this.bbBatch.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
    }
    exports.Hero = Hero;
});
define("LevelEnd", ["require", "exports", "Sprite", "gl-matrix", "BoundingBox", "SpriteBatch", "TexturePool", "Shader", "Utils", "SoundEffectPool"], function (require, exports, Sprite_14, gl_matrix_17, BoundingBox_11, SpriteBatch_13, TexturePool_12, Shader_13, Utils_13, SoundEffectPool_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LevelEnd = void 0;
    class LevelEnd {
        constructor(position, shader, endReachedEffect, texture, interactCallback, level) {
            this.position = position;
            this.shader = shader;
            this.endReachedEffect = endReachedEffect;
            this.interactCallback = interactCallback;
            this.level = level;
            this.enabled = false;
            this.size = gl_matrix_17.vec3.fromValues(2, 1, 0);
            this.interacted = false;
            this.sprite = new Sprite_14.Sprite(Utils_13.Utils.DefaultSpriteVertices, Utils_13.Utils.DefaultSpriteTextureCoordinates);
            this.batch = new SpriteBatch_13.SpriteBatch(this.shader, [this.sprite], texture);
            this.shader.SetFloatUniform('alpha', LevelEnd.transparentValue);
        }
        OnEndConditionsMet() {
            this.enabled = true;
            this.shader.SetFloatUniform('alpha', this.enabled ? 1.0 : LevelEnd.transparentValue);
        }
        get EndCondition() {
            return false;
        }
        CollideWithAttack(attack) {
            // NO-OP
        }
        get BoundingBox() {
            return new BoundingBox_11.BoundingBox(this.position, gl_matrix_17.vec2.fromValues(this.size[0], this.size[1]));
        }
        static async Create(position, interactCallback, level) {
            const shader = await Shader_13.Shader.Create('shaders/VertexShader.vert', 'shaders/Transparent.frag');
            const endReachedEffect = await SoundEffectPool_10.SoundEffectPool.GetInstance().GetAudio('audio/ding.wav', false);
            const texture = await TexturePool_12.TexturePool.GetInstance().GetTexture('textures/exit.png');
            return new LevelEnd(position, shader, endReachedEffect, texture, interactCallback, level);
        }
        // TODO: All these drawable objects need a common interface or a base class with all of the drawing/Update functionality
        Draw(projection, view) {
            this.batch.Draw(projection, view);
            gl_matrix_17.mat4.translate(this.batch.ModelMatrix, gl_matrix_17.mat4.create(), this.position);
            gl_matrix_17.mat4.scale(this.batch.ModelMatrix, this.batch.ModelMatrix, this.size);
        }
        async Update(delta) {
            if (this.interacted) {
                this.interactCallback();
            }
        }
        IsCollidingWith(boundingBox) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        Visit(hero) {
            if (this.enabled && !this.interacted) {
                this.level.updateDisabled = true; // pause level updates
                this.endReachedEffect.Play(1, 1, () => {
                    /** Wait for the soundeffect to play then restart level update loop.
                    * This in turn will result in the calling of the @see Update() method,
                    * which will notify the game object that the level change can occur
                    */
                    this.interacted = true;
                    this.level.updateDisabled = false;
                });
            }
        }
        Dispose() {
            this.batch.Dispose();
            this.shader.Delete();
        }
    }
    exports.LevelEnd = LevelEnd;
    LevelEnd.transparentValue = 0.5;
});
define("Level", ["require", "exports", "gl-matrix", "Background", "Layer", "Shader", "SpriteBatch", "TexturePool", "Tile", "SoundEffectPool", "Hero", "LevelEnd", "Enemies/DragonEnemy", "Enemies/SlimeEnemy", "Enemies/Spike", "Enemies/Cactus", "Pickups/CoinObject", "Pickups/HealthPickup"], function (require, exports, gl_matrix_18, Background_1, Layer_1, Shader_14, SpriteBatch_14, TexturePool_13, Tile_1, SoundEffectPool_11, Hero_1, LevelEnd_1, DragonEnemy_1, SlimeEnemy_1, Spike_1, Cactus_1, CoinObject_1, HealthPickup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Level = void 0;
    // TODO: Multi layer support: other than layer[0] as the MainLayer
    // TODO: parallax scrolling
    class Level {
        constructor(layers, bgShader, bgTexture, music, levelDescriptor, levelEndOpenSoundEffect, keyHandler, gamepadHandler) {
            this.layers = layers;
            this.music = music;
            this.levelDescriptor = levelDescriptor;
            this.levelEndOpenSoundEffect = levelEndOpenSoundEffect;
            this.keyHandler = keyHandler;
            this.gamepadHandler = gamepadHandler;
            this.BackgroundViewMatrix = gl_matrix_18.mat4.create();
            this.gameObjects = [];
            this.levelEndSoundPlayed = false;
            // Makes the game "pause" for some time when the level end was reached
            this.updateDisabled = false;
            this.restartEventListeners = [];
            this.nextLevelEventListeners = [];
            this.endConditionsMetEventListeners = [];
            this.Background = new SpriteBatch_14.SpriteBatch(bgShader, [new Background_1.Background()], bgTexture);
        }
        static async Create(levelName, keyHandler, gamepadHandler) {
            const texturePool = TexturePool_13.TexturePool.GetInstance();
            const levelJsonString = await (await fetch(levelName)).text();
            const levelDescriptor = JSON.parse(levelJsonString);
            const loadedLayers = await Promise.all(levelDescriptor.layers.map(async (layer) => {
                const loadedTiles = await Promise.all(layer.tiles.map(async (tile) => {
                    const texure = await texturePool.GetTexture(tile.texture);
                    return new Tile_1.Tile(tile.xPos, tile.yPos, texure);
                }));
                return await Layer_1.Layer.Create(loadedTiles);
            }));
            const bgShader = await Shader_14.Shader.Create('shaders/VertexShader.vert', 'shaders/FragmentShader.frag');
            const bgTexture = await TexturePool_13.TexturePool.GetInstance().GetTexture(levelDescriptor.background);
            const music = await SoundEffectPool_11.SoundEffectPool.GetInstance().GetAudio(levelDescriptor.music, false);
            const levelEndOpenSoundEffect = await SoundEffectPool_11.SoundEffectPool.GetInstance().GetAudio('audio/bell.wav', false);
            return new Level(loadedLayers, bgShader, bgTexture, music, levelDescriptor, levelEndOpenSoundEffect, keyHandler, gamepadHandler);
        }
        get Hero() {
            return this.hero;
        }
        Draw(projectionMatrix, viewMatrix) {
            var _a;
            this.Background.Draw(projectionMatrix, this.BackgroundViewMatrix);
            this.layers.forEach((layer) => {
                layer.Draw(projectionMatrix, viewMatrix);
            });
            this.gameObjects.forEach(h => h.Draw(projectionMatrix, viewMatrix));
            (_a = this.attack) === null || _a === void 0 ? void 0 : _a.Draw(projectionMatrix, viewMatrix);
            this.hero.Draw(projectionMatrix, viewMatrix);
        }
        async Update(delta) {
            var _a;
            if (!this.updateDisabled) {
                this.hero.Update(delta);
                // Kill the hero if fallen into a pit
                if (this.MainLayer.IsUnder(this.hero.BoundingBox)) {
                    this.hero.Kill();
                }
                // Handle collisions between hero projectile(s) and game objects.
                await ((_a = this.attack) === null || _a === void 0 ? void 0 : _a.Update(delta));
                if (this.attack && !this.attack.AlreadyHit) {
                    const enemiesCollidingWithProjectile = this.gameObjects.filter(e => e.IsCollidingWith(this.attack.BoundingBox, false));
                    // Pushback force does not necessarily mean the amount of pushback. A big enemy can ignore a sword attack for example
                    enemiesCollidingWithProjectile.forEach(e => e.CollideWithAttack(this.attack));
                    this.attack.OnHit();
                }
                this.gameObjects.forEach(async (e) => {
                    await e.Update(delta);
                    if (e.IsCollidingWith(this.hero.BoundingBox, false)) {
                        this.hero.CollideWithGameObject(e);
                    }
                    // Despawn out-of-bounds gameobjects. These will be projectiles most of the time.
                    if (this.MainLayer.IsOutsideBoundary(e.BoundingBox)) {
                        this.gameObjects = this.gameObjects.filter(item => item !== e);
                        e.Dispose();
                    }
                });
                this.CheckForEndCondition();
            }
        }
        get MainLayer() {
            return this.layers[0]; // TODO: make this configurable by the loaded level
        }
        PlayMusic(volume) {
            this.music.Play(1, volume, null, true);
        }
        StopMusic() {
            this.music.Stop();
        }
        SetMusicVolume(volume) {
            this.music.SetVolume(volume);
        }
        CheckForEndCondition() {
            const numberOfEndConditions = this.gameObjects.filter(p => p.EndCondition).length;
            if (numberOfEndConditions === 0 && !this.levelEndSoundPlayed) {
                this.levelEndOpenSoundEffect.Play();
                this.levelEndSoundPlayed = true;
                this.endConditionsMetEventListeners.forEach(l => l.OnEndConditionsMet());
            }
        }
        async RestartLevel() {
            this.endConditionsMetEventListeners = [];
            this.hero.Dispose();
            await this.InitHero();
            this.gameObjects.forEach(o => o.Dispose());
            this.gameObjects = [];
            await this.InitGameObjects();
            this.updateDisabled = false;
            this.levelEndSoundPlayed = false;
        }
        async InitLevel() {
            this.restartEventListeners.forEach(l => l.OnRestartEvent());
            this.SetMusicVolume(0.4);
            await this.InitHero();
            await this.InitGameObjects();
            this.updateDisabled = false;
            this.levelEndSoundPlayed = false;
        }
        SubscribeToRestartEvent(listener) {
            this.restartEventListeners.push(listener);
        }
        SubscribeToNextLevelEvent(listener) {
            this.nextLevelEventListeners.push(listener);
        }
        SubscribeToEndConditionsMetEvent(listener) {
            this.endConditionsMetEventListeners.push(listener);
        }
        async InitHero() {
            this.hero = await Hero_1.Hero.Create(gl_matrix_18.vec3.fromValues(this.levelDescriptor.start.xPos - 0.9, this.levelDescriptor.start.yPos - 1.91, 1), // shift heroes spawn position by the height of its bounding box
            gl_matrix_18.vec2.fromValues(3, 3), this.MainLayer, async () => await this.RestartLevel(), (sender, projectile) => this.attack = projectile, (attack) => this.DespawnAttack(attack), this.keyHandler, this.gamepadHandler);
        }
        async CreateGameObject(descriptor) {
            switch (descriptor.type) {
                case 'coin':
                    return await CoinObject_1.CoinObject.Create(gl_matrix_18.vec3.fromValues(descriptor.xPos, descriptor.yPos, 1), (c) => this.RemoveGameObject(c));
                case 'health':
                    return await HealthPickup_1.HealthPickup.Create(gl_matrix_18.vec3.fromValues(descriptor.xPos, descriptor.yPos - 1, 1), (c) => this.RemoveGameObject(c));
                case 'spike':
                    return await Spike_1.Spike.Create(gl_matrix_18.vec3.fromValues(descriptor.xPos, descriptor.yPos, 1), gl_matrix_18.vec2.fromValues(1, 1));
                case 'cactus':
                    return await Cactus_1.Cactus.Create(gl_matrix_18.vec3.fromValues(descriptor.xPos, descriptor.yPos - 2, 1), (c) => this.RemoveGameObject(c));
                case 'slime':
                    return await SlimeEnemy_1.SlimeEnemy.Create(gl_matrix_18.vec3.fromValues(descriptor.xPos, descriptor.yPos - 1.8, 1), gl_matrix_18.vec2.fromValues(3, 3), this.MainLayer, (c) => this.RemoveGameObject(c));
                case 'dragon':
                    return await DragonEnemy_1.DragonEnemy.Create(gl_matrix_18.vec3.fromValues(descriptor.xPos, descriptor.yPos - 4, 1), gl_matrix_18.vec2.fromValues(5, 5), this.MainLayer, this.hero, // To track where the hero is, i want to move as much of the game logic from the update loop as possible
                    (sender) => { this.RemoveGameObject(sender); }, // onDeath
                    // Spawn projectile
                    (sender, projectile) => {
                        this.gameObjects.push(projectile);
                        // Despawn projectile that hit
                        // TODO: instead of accessing a public array, projectiles should have a subscribe method
                        projectile.OnHitListeners.push(s => this.RemoveGameObject(s)); // TODO: despawning hero attack should be like this
                    });
                default:
                    throw new Error('Unknown object type');
            }
        }
        RemoveGameObject(toRemove) {
            this.gameObjects = this.gameObjects.filter(e => e !== toRemove);
            toRemove.Dispose();
        }
        DespawnAttack(attack) {
            // TODO: Attack as a gameobject?
            attack === null || attack === void 0 ? void 0 : attack.Dispose();
            this.attack = null;
        }
        async InitGameObjects() {
            const objects = await Promise.all(this.levelDescriptor.gameObjects.map(async (o) => await this.CreateGameObject(o)));
            this.gameObjects.push(...objects);
            const levelEnd = await LevelEnd_1.LevelEnd.Create(gl_matrix_18.vec3.fromValues(this.levelDescriptor.levelEnd.xPos - 1, this.levelDescriptor.levelEnd.yPos, 0), async () => {
                this.nextLevelEventListeners.forEach(l => l.OnNextLevelEvent(this.levelDescriptor.nextLevel));
            }, this);
            this.SubscribeToEndConditionsMetEvent(levelEnd);
            this.gameObjects.push(levelEnd);
            // TODO: 2) change level format and jsons to support multiple levelends
        }
        Dispose() {
            var _a;
            this.layers.forEach(l => l.Dispose());
            this.layers = [];
            this.Background.Dispose();
            this.Hero.Dispose();
            (_a = this.attack) === null || _a === void 0 ? void 0 : _a.Dispose();
            this.gameObjects.forEach(e => e.Dispose());
            this.gameObjects = [];
            this.restartEventListeners = [];
            this.nextLevelEventListeners = [];
            this.endConditionsMetEventListeners = [];
        }
    }
    exports.Level = Level;
});
define("MainScreen", ["require", "exports", "gl-matrix", "Background", "SpriteBatch", "Shader", "TexturePool", "XBoxControllerKeys", "SoundEffectPool", "Keys", "Textbox"], function (require, exports, gl_matrix_19, Background_2, SpriteBatch_15, Shader_15, TexturePool_14, XBoxControllerKeys_2, SoundEffectPool_12, Keys_2, Textbox_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainScreen = void 0;
    class MainScreen {
        constructor(batch, shader, gamepadHandler, keyHandler, sound, pressStartTextbox, width, height) {
            this.batch = batch;
            this.shader = shader;
            this.gamepadHandler = gamepadHandler;
            this.keyHandler = keyHandler;
            this.sound = sound;
            this.pressStartTextbox = pressStartTextbox;
            this.startEventListeners = [];
            this.currentTime = 0;
            this.textProjMat = gl_matrix_19.mat4.ortho(gl_matrix_19.mat4.create(), 0, width, height, 0, -1, 1);
        }
        static async Create(keyboardHandler, gamepadHandler, width, height) {
            const background = new Background_2.Background();
            const texture = await TexturePool_14.TexturePool.GetInstance().GetTexture('textures/title.jpeg');
            const shader = await Shader_15.Shader.Create('shaders/VertexShader.vert', 'shaders/FragmentShader.frag');
            const batch = new SpriteBatch_15.SpriteBatch(shader, [background], texture);
            const sound = await SoundEffectPool_12.SoundEffectPool.GetInstance().GetAudio('audio/ui2.mp3', false);
            const dimensions = await Textbox_2.Textbox.PrecalculateDimensions('Consolas', 'Press start or Enter to begin', 1);
            const pressStartText = (await Textbox_2.Textbox.Create('Consolas')).WithText('Press start or Enter to begin', gl_matrix_19.vec2.fromValues(width / 2 - dimensions.width / 2, height - 120), 1);
            return new MainScreen(batch, shader, gamepadHandler, keyboardHandler, sound, pressStartText, width, height);
        }
        Draw(proj) {
            this.batch.Draw(proj, gl_matrix_19.mat4.create());
            this.pressStartTextbox.Draw(this.textProjMat);
        }
        async Update(delta) {
            this.currentTime += delta;
            const frequency = 0.15;
            const amplitude = 0.35;
            const valueOffset = amplitude * Math.sin(2 * Math.PI * frequency * (this.currentTime / 1000));
            const value = 0.65 + Math.abs(valueOffset);
            this.pressStartTextbox.WithValue(value);
            if ((this.gamepadHandler.IsPressed(XBoxControllerKeys_2.XBoxControllerKeys.START) || this.keyHandler.IsPressed(Keys_2.Keys.ENTER)) && this.currentTime > 500) {
                this.sound.Play();
                this.currentTime = 0;
                this.startEventListeners.forEach(async (l) => await l.Start());
            }
        }
        SubscribeToStartEvent(listener) {
            this.startEventListeners.push(listener);
        }
        Dispose() {
            this.pressStartTextbox.Dispose();
            this.batch.Dispose();
            this.shader.Delete();
        }
    }
    exports.MainScreen = MainScreen;
});
define("PauseScreen/SharedVariables", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("PauseScreen/IState", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("PauseScreen/PauseStateBase", ["require", "exports", "Keys", "XBoxControllerKeys"], function (require, exports, Keys_3, XBoxControllerKeys_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PauseStateBase = void 0;
    class PauseStateBase {
        constructor(numberOfItems, keyHandler, gamepadHandler, menuSound, selectSound) {
            this.numberOfItems = numberOfItems;
            this.keyHandler = keyHandler;
            this.gamepadHandler = gamepadHandler;
            this.menuSound = menuSound;
            this.selectSound = selectSound;
            this.keyPressWaitTime = 200;
        }
        Update(delta, shared) {
            shared.elapsedTimeSinceKeypress += delta;
            // Do not trigger enter handling when it is kept hold down. Wait for a release before allowing to trigger again
            if (!this.keyHandler.IsPressed(Keys_3.Keys.ENTER) && !this.gamepadHandler.IsPressed(XBoxControllerKeys_3.XBoxControllerKeys.START)
                && !shared.keyWasReleased && shared.elapsedTimeSinceKeypress > 200) {
                shared.keyWasReleased = true;
            }
        }
    }
    exports.PauseStateBase = PauseStateBase;
});
define("PauseScreen/MainSelectionState", ["require", "exports", "Keys", "PauseScreen/PauseStateBase", "XBoxControllerKeys"], function (require, exports, Keys_4, PauseStateBase_1, XBoxControllerKeys_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainSelectionState = void 0;
    class MainSelectionState extends PauseStateBase_1.PauseStateBase {
        constructor(context, keyhandler, gamepadHandler, resumeListeners, menuSound, selectSound) {
            super(2, keyhandler, gamepadHandler, menuSound, selectSound);
            this.context = context;
            this.resumeListeners = resumeListeners;
            this.selectedIndex = 0;
        }
        Enter() {
        }
        Exit() {
        }
        Update(delta, shared) {
            super.Update(delta, shared);
            if ((this.keyHandler.IsPressed(Keys_4.Keys.S) || this.gamepadHandler.IsPressed(XBoxControllerKeys_4.XBoxControllerKeys.DOWN))
                && shared.elapsedTimeSinceKeypress > this.keyPressWaitTime) {
                this.menuSound.Play(1, 0.5);
                shared.elapsedTimeSinceKeypress = 0;
                this.selectedIndex++;
                if (this.selectedIndex >= this.numberOfItems) {
                    this.selectedIndex = 0;
                }
            }
            else if ((this.keyHandler.IsPressed(Keys_4.Keys.W) || this.gamepadHandler.IsPressed(XBoxControllerKeys_4.XBoxControllerKeys.UP))
                && shared.elapsedTimeSinceKeypress > this.keyPressWaitTime) {
                this.menuSound.Play(1, 0.5);
                shared.elapsedTimeSinceKeypress = 0;
                this.selectedIndex--;
                if (this.selectedIndex < 0) {
                    this.selectedIndex = this.numberOfItems - 1;
                }
            }
            else if ((this.keyHandler.IsPressed(Keys_4.Keys.ENTER)
                || this.gamepadHandler.IsPressed(XBoxControllerKeys_4.XBoxControllerKeys.A)
                || this.gamepadHandler.IsPressed(XBoxControllerKeys_4.XBoxControllerKeys.START))
                && shared.elapsedTimeSinceKeypress > this.keyPressWaitTime && shared.keyWasReleased) {
                shared.elapsedTimeSinceKeypress = 0;
                shared.keyWasReleased = false;
                this.selectSound.Play();
                if (this.selectedIndex === 0) { // resume
                    this.resumeListeners.forEach(l => l.Resume());
                }
                else if (this.selectedIndex === 1) { // quit
                    this.context.ChangeState(this.context.QuitSelectionState);
                }
            }
            this.context.SelectedIndex = this.selectedIndex;
        }
    }
    exports.MainSelectionState = MainSelectionState;
});
define("PauseScreen/QuitMenuState", ["require", "exports", "Keys", "PauseScreen/PauseStateBase", "XBoxControllerKeys"], function (require, exports, Keys_5, PauseStateBase_2, XBoxControllerKeys_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuitMenuState = void 0;
    class QuitMenuState extends PauseStateBase_2.PauseStateBase {
        constructor(context, keyHandler, controllerHandler, quitListeners, menuSound, selectSound) {
            super(2, keyHandler, controllerHandler, menuSound, selectSound);
            this.context = context;
            this.quitListeners = quitListeners;
            this.selectedIndex = 0;
        }
        Enter() {
            this.selectedIndex = 0;
        }
        Exit() {
            this.selectedIndex = 0;
        }
        Update(delta, shared) {
            super.Update(delta, shared);
            if ((this.keyHandler.IsPressed(Keys_5.Keys.A) || this.gamepadHandler.IsPressed(XBoxControllerKeys_5.XBoxControllerKeys.LEFT))
                && shared.elapsedTimeSinceKeypress > this.keyPressWaitTime) {
                this.menuSound.Play(1, 0.5);
                shared.elapsedTimeSinceKeypress = 0;
                this.selectedIndex--;
                if (this.selectedIndex < 0) {
                    this.selectedIndex = this.numberOfItems - 1;
                }
            }
            else if ((this.keyHandler.IsPressed(Keys_5.Keys.D) || this.gamepadHandler.IsPressed(XBoxControllerKeys_5.XBoxControllerKeys.RIGHT))
                && shared.elapsedTimeSinceKeypress > this.keyPressWaitTime) {
                this.menuSound.Play(1, 0.5);
                shared.elapsedTimeSinceKeypress = 0;
                this.selectedIndex++;
                if (this.selectedIndex >= this.numberOfItems) {
                    this.selectedIndex = 0;
                }
            }
            else if ((this.keyHandler.IsPressed(Keys_5.Keys.ENTER)
                || this.gamepadHandler.IsPressed(XBoxControllerKeys_5.XBoxControllerKeys.A)
                || this.gamepadHandler.IsPressed(XBoxControllerKeys_5.XBoxControllerKeys.START))
                && shared.elapsedTimeSinceKeypress > this.keyPressWaitTime && shared.keyWasReleased) {
                shared.elapsedTimeSinceKeypress = 0;
                this.selectSound.Play();
                shared.keyWasReleased = false;
                if (this.selectedIndex === 0) { // yes
                    this.context.SelectedIndex = 0;
                    this.quitListeners.forEach(l => l.Quit());
                }
                this.context.ChangeState(this.context.MainSelectionState);
            }
            this.context.SubSelectionIndex = this.selectedIndex;
        }
    }
    exports.QuitMenuState = QuitMenuState;
});
define("PauseScreen/PauseScreen", ["require", "exports", "Background", "gl-matrix", "Textbox", "SpriteBatch", "Shader", "SoundEffectPool", "PauseScreen/MainSelectionState", "PauseScreen/QuitMenuState"], function (require, exports, Background_3, gl_matrix_20, Textbox_3, SpriteBatch_16, Shader_16, SoundEffectPool_13, MainSelectionState_1, QuitMenuState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PauseScreen = void 0;
    class PauseScreen {
        get MainSelectionState() {
            return this.mainSelectionState;
        }
        get QuitSelectionState() {
            return this.quitSelectionState;
        }
        set SelectedIndex(value) {
            this.selectedIndex = value;
        }
        set SubSelectionIndex(value) {
            this.subselectionIndex = value;
        }
        constructor(width, height, batch, shader, pausedTextbox, resumeTextbox, quitTextbox, areYouSureTextbox, yesTextbox, noTextbox, keyHandler, gamepadHandler, menuSound, selectSound) {
            this.width = width;
            this.height = height;
            this.batch = batch;
            this.shader = shader;
            this.pausedTextbox = pausedTextbox;
            this.resumeTextbox = resumeTextbox;
            this.quitTextbox = quitTextbox;
            this.areYouSureTextbox = areYouSureTextbox;
            this.yesTextbox = yesTextbox;
            this.noTextbox = noTextbox;
            this.keyHandler = keyHandler;
            this.gamepadHandler = gamepadHandler;
            this.menuSound = menuSound;
            this.selectSound = selectSound;
            this.resumeEventListeners = [];
            this.quitEventListeners = [];
            this.selectedIndex = 0;
            this.subselectionIndex = 0;
            this.sharedVariables = {
                elapsedTimeSinceKeypress: 0,
                keyWasReleased: false
            };
            this.textProjMat = gl_matrix_20.mat4.ortho(gl_matrix_20.mat4.create(), 0, width, height, 0, -1, 1);
            this.selection = [resumeTextbox, quitTextbox];
            this.subSelection = [yesTextbox, noTextbox];
            this.ResetStates();
        }
        static async Create(width, height, keyHandler, gamepadHandler) {
            const pausedText = "Paused";
            const pausedTextDimensions = await Textbox_3.Textbox.PrecalculateDimensions('Consolas', pausedText, 1);
            const pausedTextBox = (await Textbox_3.Textbox.Create('Consolas'))
                .WithText(pausedText, gl_matrix_20.vec2.fromValues(width / 2 - pausedTextDimensions.width / 2, height / 4), 1);
            const resumeText = "Resume";
            const resumeTextDimensions = await Textbox_3.Textbox.PrecalculateDimensions('Consolas', resumeText, 0.5);
            const resumeTextBox = (await Textbox_3.Textbox.Create('Consolas'))
                .WithText(resumeText, gl_matrix_20.vec2.fromValues(width / 2 - resumeTextDimensions.width / 2, height / 4 + resumeTextDimensions.height * 3), 0.5);
            const quitText = "Quit";
            const quitTextDimensions = await Textbox_3.Textbox.PrecalculateDimensions('Consolas', quitText, 0.5);
            const quitTextBox = (await Textbox_3.Textbox.Create('Consolas')).WithText(quitText, gl_matrix_20.vec2.fromValues(width / 2 - quitTextDimensions.width / 2, height / 4 + quitTextDimensions.height * 4), 0.5);
            const areYouSureText = "Are you sure?";
            const areYouSureDimensions = await Textbox_3.Textbox.PrecalculateDimensions('Consolas', areYouSureText, 0.5);
            const areYouSureTextBox = ((await Textbox_3.Textbox.Create('Consolas')).WithText(areYouSureText, gl_matrix_20.vec2.fromValues(width / 2 - areYouSureDimensions.width / 2, height / 4 + areYouSureDimensions.height * 5), 0.5));
            const yesNoDimensions = await Textbox_3.Textbox.PrecalculateDimensions('Consolas', 'Yes No', 0.5);
            const spaceDimensions = await Textbox_3.Textbox.PrecalculateDimensions('Consolas', ' ', 0.5);
            const yesTextBox = ((await Textbox_3.Textbox.Create('Consolas')).WithText('Yes', gl_matrix_20.vec2.fromValues(width / 2 - yesNoDimensions.width / 2, height / 4 + yesNoDimensions.height * 6), 0.5));
            const noTextBox = ((await Textbox_3.Textbox.Create('Consolas')).WithText('No', gl_matrix_20.vec2.fromValues(width / 2 + spaceDimensions.width, height / 4 + yesNoDimensions.height * 6), 0.5));
            const menuSound = await SoundEffectPool_13.SoundEffectPool.GetInstance().GetAudio('audio/cursor1.wav');
            const selectSound = await SoundEffectPool_13.SoundEffectPool.GetInstance().GetAudio('audio/pause.mp3');
            const shader = await Shader_16.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            shader.SetVec4Uniform('clr', gl_matrix_20.vec4.fromValues(0, 0, 0, 0.8));
            const background = new Background_3.Background();
            const batch = new SpriteBatch_16.SpriteBatch(shader, [background], null);
            return new PauseScreen(width, height, batch, shader, pausedTextBox, resumeTextBox, quitTextBox, areYouSureTextBox, yesTextBox, noTextBox, keyHandler, gamepadHandler, menuSound, selectSound);
        }
        Draw(proj) {
            this.batch.Draw(proj, gl_matrix_20.mat4.create());
            this.pausedTextbox.Draw(this.textProjMat);
            this.selection.forEach(s => s.WithSaturation(0).WithValue(0.3));
            this.selection[this.selectedIndex].WithHue(1).WithSaturation(0).WithValue(1);
            this.resumeTextbox.Draw(this.textProjMat);
            this.quitTextbox.Draw(this.textProjMat);
            if (this.state === this.quitSelectionState) {
                this.subSelection.forEach(s => s.WithSaturation(0).WithValue(0.3));
                this.subSelection[this.subselectionIndex].WithHue(1).WithSaturation(0).WithValue(1);
                this.areYouSureTextbox.Draw(this.textProjMat);
                this.yesTextbox.Draw(this.textProjMat);
                this.noTextbox.Draw(this.textProjMat);
            }
        }
        Update(elapsed) {
            this.state.Update(elapsed, this.sharedVariables);
        }
        SubscribeToResumeEvent(listener) {
            this.resumeEventListeners.push(listener);
        }
        SubscribeToQuitEvent(listener) {
            this.quitEventListeners.push(listener);
        }
        ChangeState(state) {
            this.state.Exit();
            this.state = state;
            this.state.Enter();
        }
        ResetStates() {
            this.mainSelectionState = new MainSelectionState_1.MainSelectionState(this, this.keyHandler, this.gamepadHandler, this.resumeEventListeners, this.menuSound, this.selectSound);
            this.quitSelectionState = new QuitMenuState_1.QuitMenuState(this, this.keyHandler, this.gamepadHandler, this.quitEventListeners, this.menuSound, this.selectSound);
            this.state = this.mainSelectionState;
        }
        Dispose() {
            this.areYouSureTextbox.Dispose();
            this.noTextbox.Dispose();
            this.pausedTextbox.Dispose();
            this.yesTextbox.Dispose();
            this.batch.Dispose();
            this.shader.Delete();
            this.quitTextbox.Dispose();
            this.resumeTextbox.Dispose();
        }
    }
    exports.PauseScreen = PauseScreen;
});
define("Game", ["require", "exports", "gl-matrix", "Camera", "Environment", "Level", "WebGLUtils", "Keys", "SoundEffectPool", "XBoxControllerKeys", "TexturePool", "Textbox", "MainScreen", "PauseScreen/PauseScreen"], function (require, exports, gl_matrix_21, Camera_1, Environment_4, Level_1, WebGLUtils_5, Keys_6, SoundEffectPool_14, XBoxControllerKeys_6, TexturePool_15, Textbox_4, MainScreen_1, PauseScreen_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Game = void 0;
    // TODO: time to implement a proper state machine at least for the game object
    // TODO: check for key presses and elapsed time since state change
    // TODO: sometimes key release check is also neccessary for a state change
    var State;
    (function (State) {
        State["START_SCREEN"] = "start_screen";
        State["IN_GAME"] = "in_game";
        State["PAUSED"] = "paused";
    })(State || (State = {}));
    // TODO: level editor
    // TODO: resource tracker: keep track of 'alive' opengl and other resurces resources the number shouldnt go up
    // TODO: ui builder framework
    // TODO: flip sprite
    // TODO: recheck every vector passing. Sometimes vectors need to be cloned
    // TODO: FF8 Starting Up/FF9 Hunter's Chance - for the final BOSS music?
    // TODO: update ts version
    // TODO: render bounding boxes in debug mode
    // TODO: texture map padding
    class Game {
        constructor(keyHandler, gamepadHandler, healthTextbox, scoreTextbox, mainScreen, pauseScreen, pauseSoundEffect) {
            this.keyHandler = keyHandler;
            this.gamepadHandler = gamepadHandler;
            this.healthTextbox = healthTextbox;
            this.scoreTextbox = scoreTextbox;
            this.mainScreen = mainScreen;
            this.pauseScreen = pauseScreen;
            this.pauseSoundEffect = pauseSoundEffect;
            this.projectionMatrix = gl_matrix_21.mat4.create();
            this.camera = new Camera_1.Camera(gl_matrix_21.vec3.create());
            this.state = State.START_SCREEN;
            this.level = null;
            this.keyWasReleased = true;
            this.elapsedTimeSinceStateChange = 0;
            this.Width = window.innerWidth;
            this.Height = window.innerHeight;
            this.projectionMatrix = gl_matrix_21.mat4.ortho(this.projectionMatrix, 0, Environment_4.Environment.HorizontalTiles, Environment_4.Environment.VerticalTiles, 0, -1, 1);
            this.textProjMat = gl_matrix_21.mat4.ortho(gl_matrix_21.mat4.create(), 0, this.Width, this.Height, 0, -1, 1);
            WebGLUtils_5.gl.disable(WebGLUtils_5.gl.DEPTH_TEST); // TODO: Depth test has value when rendering layers. Shouldn't be disabled completely
            WebGLUtils_5.gl.blendFunc(WebGLUtils_5.gl.SRC_ALPHA, WebGLUtils_5.gl.ONE_MINUS_SRC_ALPHA);
            WebGLUtils_5.gl.viewport(0, 0, this.Width, this.Height);
            WebGLUtils_5.gl.clearColor(0, 1, 0, 1);
            mainScreen.SubscribeToStartEvent(this);
            pauseScreen.SubscribeToResumeEvent(this);
            pauseScreen.SubscribeToQuitEvent(this);
            this.start = performance.now();
        }
        Dispose() {
            this.mainScreen.Dispose();
            this.healthTextbox.Dispose();
            this.scoreTextbox.Dispose();
            this.pauseScreen.Dispose();
        }
        async OnNextLevelEvent(levelName) {
            this.pauseScreen.ResetStates();
            const nextLevel = await Level_1.Level.Create(levelName, this.keyHandler, this.gamepadHandler);
            await nextLevel.InitLevel();
            nextLevel.SubscribeToNextLevelEvent(this);
            nextLevel.SubscribeToRestartEvent(this);
            const oldLevel = this.level;
            oldLevel.Dispose();
            this.level = nextLevel;
        }
        OnRestartEvent() {
            this.pauseScreen.ResetStates();
        }
        static async Create(keyHandler, controllerHandler) {
            const canvas = document.getElementById('canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            WebGLUtils_5.WebGLUtils.CreateGLRenderingContext(canvas);
            await SoundEffectPool_14.SoundEffectPool.GetInstance().Preload();
            await TexturePool_15.TexturePool.GetInstance().Preload();
            const textbox = await Textbox_4.Textbox.Create('Consolas');
            const scoreTextBox = await Textbox_4.Textbox.Create('Consolas');
            const pauseSoundEffect = await SoundEffectPool_14.SoundEffectPool.GetInstance().GetAudio('audio/pause.mp3');
            const mainScreen = await MainScreen_1.MainScreen.Create(keyHandler, controllerHandler, canvas.width, canvas.height);
            const pauseScreen = await PauseScreen_1.PauseScreen.Create(canvas.width, canvas.height, keyHandler, controllerHandler);
            return new Game(keyHandler, controllerHandler, textbox, scoreTextBox, mainScreen, pauseScreen, pauseSoundEffect);
        }
        async Start() {
            const level = await Level_1.Level.Create('levels/level1.json', this.keyHandler, this.gamepadHandler);
            level.SubscribeToNextLevelEvent(this);
            level.SubscribeToRestartEvent(this);
            this.level = level;
            if (this.state === State.START_SCREEN) {
                await this.level.InitLevel();
                this.state = State.IN_GAME;
                this.elapsedTimeSinceStateChange = 0;
                this.level.PlayMusic(0.4);
            }
        }
        Quit() {
            this.pauseScreen.ResetStates();
            this.level.StopMusic();
            this.level.Dispose();
            this.level = null;
            this.state = State.START_SCREEN;
        }
        async Run() {
            const end = performance.now();
            const elapsed = Math.min(end - this.start, 32);
            this.start = end;
            this.Render(elapsed);
            await this.Update(elapsed);
        }
        Pause() {
            // TODO: state machine: Only can go to paused from ingame
            if (this.state === State.IN_GAME) {
                this.state = State.PAUSED;
                this.elapsedTimeSinceStateChange = 0;
            }
        }
        Play() {
            this.state = State.IN_GAME;
            this.elapsedTimeSinceStateChange = 0;
        }
        async Render(elapsedTime) {
            WebGLUtils_5.gl.clear(WebGLUtils_5.gl.COLOR_BUFFER_BIT | WebGLUtils_5.gl.DEPTH_BUFFER_BIT);
            if (this.state === State.START_SCREEN) {
                this.mainScreen.Draw(this.projectionMatrix);
            }
            else {
                this.level.Draw(this.projectionMatrix, this.camera.ViewMatrix);
                const textColor = (() => {
                    if (this.level.Hero.Health < 35) {
                        return { hue: 0, saturation: 100 / 100, value: 100 / 100 };
                    }
                    else if (this.level.Hero.Health > 100) {
                        return { hue: 120 / 360, saturation: 100 / 100, value: 100 / 100 };
                    }
                    else {
                        return { hue: 0, saturation: 0, value: 100 / 100 };
                    }
                })();
                this.healthTextbox
                    .WithText(`Health: ${this.level.Hero.Health}`, gl_matrix_21.vec2.fromValues(10, 0), 0.5)
                    .WithHue(textColor.hue)
                    .WithSaturation(textColor.saturation)
                    .WithValue(textColor.value)
                    .Draw(this.textProjMat);
                this.scoreTextbox
                    .WithText(`Coins: ${this.level.Hero.CollectedCoins}`, gl_matrix_21.vec2.fromValues(10, this.healthTextbox.Height), 0.5)
                    .Draw(this.textProjMat);
                if (this.state === State.PAUSED) {
                    // Draw the pause screen over the other rendered elements
                    this.pauseScreen.Draw(this.projectionMatrix);
                }
            }
            requestAnimationFrame(this.Run.bind(this));
        }
        async Update(elapsedTime) {
            this.elapsedTimeSinceStateChange += elapsedTime;
            if (this.state === State.START_SCREEN) {
                await this.mainScreen.Update(elapsedTime);
            }
            else if (this.state === State.IN_GAME && this.elapsedTimeSinceStateChange > 150) {
                await this.level.Update(elapsedTime);
                if (!this.keyHandler.IsPressed(Keys_6.Keys.ENTER) && !this.gamepadHandler.IsPressed(XBoxControllerKeys_6.XBoxControllerKeys.START)
                    && !this.keyWasReleased && this.elapsedTimeSinceStateChange > 100) {
                    this.keyWasReleased = true;
                }
                if ((this.keyHandler.IsPressed(Keys_6.Keys.ENTER) || this.gamepadHandler.IsPressed(XBoxControllerKeys_6.XBoxControllerKeys.START))
                    && this.keyWasReleased && this.elapsedTimeSinceStateChange > 100) {
                    this.state = State.PAUSED;
                    this.pauseSoundEffect.Play();
                    this.elapsedTimeSinceStateChange = 0;
                    this.keyWasReleased = false;
                }
                this.camera.LookAtPosition(gl_matrix_21.vec3.clone(this.level.Hero.Position), this.level.MainLayer);
            }
            else if (this.state === State.PAUSED) {
                this.level.SetMusicVolume(0.15);
                this.pauseScreen.Update(elapsedTime);
            }
        }
        Resume() {
            // TODO: statemachine move state
            this.state = State.IN_GAME;
            this.elapsedTimeSinceStateChange = 0;
            this.level.SetMusicVolume(0.4);
        }
    }
    exports.Game = Game;
});
define("main", ["require", "exports", "domready", "Game", "ControllerHandler", "KeyHandler", "Keys"], function (require, exports, domready, Game_1, ControllerHandler_1, KeyHandler_1, Keys_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    domready(async () => {
        const keyHandler = new KeyHandler_1.KeyHandler();
        const controllerHandler = new ControllerHandler_1.ControllerHandler();
        const game = await Game_1.Game.Create(keyHandler, controllerHandler);
        const isSpecialKey = (code) => {
            const specialKeys = [Keys_7.Keys.LEFT_CONTROL, Keys_7.Keys.RIGHT_CONTROL, Keys_7.Keys.SPACE];
            return specialKeys.indexOf(code) > -1;
        };
        const canvas = document.getElementById('canvas');
        canvas.addEventListener('keydown', (event) => {
            keyHandler.SetKey(event.code, true);
            if (isSpecialKey(event.code)) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, false);
        canvas.addEventListener('keyup', (event) => {
            keyHandler.SetKey(event.code, false);
            if (isSpecialKey(event.code)) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, false);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                game.Pause();
            }
        });
        window.addEventListener('gamepadconnected', (e) => {
            controllerHandler.ActivateGamepad(e.gamepad.index);
        });
        canvas.focus();
        await game.Run();
    });
});
//# sourceMappingURL=main.js.map