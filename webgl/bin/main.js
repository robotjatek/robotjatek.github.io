define("Environment", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Environment = void 0;
    class Environment {
    }
    exports.Environment = Environment;
    Environment.VerticalTiles = 18;
    Environment.HorizontalTiles = 32;
    Environment.RenderBoundingBoxes = false;
    Environment.TrackResources = true;
});
define("Sprite", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sprite = void 0;
    class Sprite {
        constructor(vertices, textureCoordinates) {
            this.Vertices = vertices;
            this.TextureCoordinates = textureCoordinates;
        }
    }
    exports.Sprite = Sprite;
});
define("Background", ["require", "exports", "Environment", "Sprite"], function (require, exports, Environment_1, Sprite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Background = void 0;
    /**
     * Background is a full screen sprite
     */
    class Background extends Sprite_1.Sprite {
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
define("ICollider", ["require", "exports", "BoundingBox", "gl-matrix"], function (require, exports, BoundingBox_1, gl_matrix_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullCollider = void 0;
    class NullCollider {
        get BoundingBox() {
            return new BoundingBox_1.BoundingBox(gl_matrix_1.vec3.create(), gl_matrix_1.vec2.create());
        }
        IsCollidingWith(boundingBox, collideWithUndefined) {
            return false;
        }
    }
    exports.NullCollider = NullCollider;
});
define("Lock", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Lock = void 0;
    class Lock {
        constructor() {
            this.waitMap = new Map();
        }
        async lock(key) {
            return new Promise((resolve) => {
                if (!this.waitMap.has(key)) {
                    this.waitMap.set(key, []);
                    resolve();
                }
                else {
                    const waitQueue = this.waitMap.get(key);
                    waitQueue.push(() => resolve());
                }
            });
        }
        async release(key) {
            const waitQueue = this.waitMap.get(key);
            if (!waitQueue || waitQueue.length === 0) {
                this.waitMap.delete(key);
                return Promise.resolve();
            }
            const resolver = waitQueue.shift(); // next task
            if (resolver) {
                resolver();
            }
            return Promise.resolve();
        }
    }
    exports.Lock = Lock;
});
define("ShaderPool", ["require", "exports", "Lock"], function (require, exports, Lock_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShaderPool = void 0;
    class ShaderPool {
        constructor() {
            this.shaderSources = new Map();
            this.lock = new Lock_1.Lock();
        }
        static GetInstance() {
            if (!this.instance) {
                this.instance = new ShaderPool();
            }
            return this.instance;
        }
        async LoadShaderSource(path) {
            await this.lock.lock(path);
            const source = this.shaderSources.get(path);
            if (!source) {
                const loaded = await this.GetSourceFromUrl(path);
                this.shaderSources.set(path, loaded);
                await this.lock.release(path);
                return loaded;
            }
            await this.lock.release(path);
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
define("Texture", ["require", "exports", "WebGLUtils", "ResourceTracker"], function (require, exports, WebGLUtils_1, ResourceTracker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Texture = void 0;
    class Texture {
        constructor(path = null) {
            this.path = path;
            this.valid = false;
            this.texture = WebGLUtils_1.gl.createTexture();
            WebGLUtils_1.gl.bindTexture(WebGLUtils_1.gl.TEXTURE_2D, this.texture);
            WebGLUtils_1.gl.texParameteri(WebGLUtils_1.gl.TEXTURE_2D, WebGLUtils_1.gl.TEXTURE_MIN_FILTER, WebGLUtils_1.gl.NEAREST_MIPMAP_LINEAR);
            WebGLUtils_1.gl.texParameteri(WebGLUtils_1.gl.TEXTURE_2D, WebGLUtils_1.gl.TEXTURE_MAG_FILTER, WebGLUtils_1.gl.NEAREST);
            WebGLUtils_1.gl.texParameteri(WebGLUtils_1.gl.TEXTURE_2D, WebGLUtils_1.gl.TEXTURE_WRAP_S, WebGLUtils_1.gl.CLAMP_TO_EDGE);
            WebGLUtils_1.gl.texParameteri(WebGLUtils_1.gl.TEXTURE_2D, WebGLUtils_1.gl.TEXTURE_WRAP_T, WebGLUtils_1.gl.CLAMP_TO_EDGE);
            ResourceTracker_1.ResourceTracker.GetInstance().TrackTexture(this);
        }
        static fromImage(path, image) {
            const texture = new Texture(path);
            WebGLUtils_1.gl.texImage2D(WebGLUtils_1.gl.TEXTURE_2D, 0, WebGLUtils_1.gl.RGBA, WebGLUtils_1.gl.RGBA, WebGLUtils_1.gl.UNSIGNED_BYTE, image);
            texture.height = image.height;
            texture.width = image.width;
            WebGLUtils_1.gl.generateMipmap(WebGLUtils_1.gl.TEXTURE_2D);
            texture.valid = true;
            return texture;
        }
        static empty(width, height) {
            const texture = new Texture();
            // This is here only to make firefox shut up about a
            // "Error: WebGL warning: drawElements: Tex image TEXTURE_2D level 0 is incurring lazy initialization."
            // Which is a warning. glTexImage2D()'s last param should be null normally...
            const zeroData = new Uint8Array(new ArrayBuffer(width * height * 4));
            WebGLUtils_1.gl.texImage2D(WebGLUtils_1.gl.TEXTURE_2D, 0, WebGLUtils_1.gl.RGBA, width, height, 0, WebGLUtils_1.gl.RGBA, WebGLUtils_1.gl.UNSIGNED_BYTE, zeroData);
            texture.width = width;
            texture.height = height;
            texture.valid = true;
            WebGLUtils_1.gl.generateMipmap(WebGLUtils_1.gl.TEXTURE_2D);
            return texture;
        }
        static async Create(path) {
            const image = await this.LoadImage(path);
            return Texture.fromImage(path, image);
        }
        GetTexture() {
            if (!this.valid) {
                throw new Error("Trying to get a deleted texture!");
            }
            return this.texture;
        }
        Delete() {
            ResourceTracker_1.ResourceTracker.GetInstance().UnTrackTexture(this);
            this.valid = false;
            WebGLUtils_1.gl.deleteTexture(this.texture);
        }
        get Width() {
            return this.width;
        }
        get Height() {
            return this.height;
        }
        get Path() {
            return this.path;
        }
        static async LoadImage(path) {
            const blob = await (await fetch(path)).blob();
            return await createImageBitmap(blob);
        }
    }
    exports.Texture = Texture;
});
define("IDisposable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("SpriteBatch", ["require", "exports", "gl-matrix", "WebGLUtils", "ResourceTracker"], function (require, exports, gl_matrix_2, WebGLUtils_2, ResourceTracker_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpriteBatch = void 0;
    class SpriteBatch {
        constructor(shader, sprites, texture) {
            this.texture = texture;
            this.textureOffset = gl_matrix_2.vec2.create();
            this.ModelMatrix = gl_matrix_2.mat4.create();
            this.BatchShader = shader;
            this.Vertices = [];
            this.TextureCoordinates = [];
            sprites.forEach((sprite) => {
                this.Vertices = this.Vertices.concat(sprite.Vertices);
                this.TextureCoordinates = this.TextureCoordinates.concat(sprite.TextureCoordinates);
            });
            this.ModelMatrix = gl_matrix_2.mat4.identity(this.ModelMatrix);
            this.VertexBuffer = WebGLUtils_2.gl.createBuffer();
            WebGLUtils_2.gl.bindBuffer(WebGLUtils_2.gl.ARRAY_BUFFER, this.VertexBuffer);
            WebGLUtils_2.gl.bufferData(WebGLUtils_2.gl.ARRAY_BUFFER, new Float32Array(this.Vertices), WebGLUtils_2.gl.STATIC_DRAW);
            this.TextureCoordinateBuffer = WebGLUtils_2.gl.createBuffer();
            WebGLUtils_2.gl.bindBuffer(WebGLUtils_2.gl.ARRAY_BUFFER, this.TextureCoordinateBuffer);
            WebGLUtils_2.gl.bufferData(WebGLUtils_2.gl.ARRAY_BUFFER, new Float32Array(this.TextureCoordinates), WebGLUtils_2.gl.STATIC_DRAW);
            WebGLUtils_2.gl.bindBuffer(WebGLUtils_2.gl.ARRAY_BUFFER, null);
            ResourceTracker_2.ResourceTracker.GetInstance().TrackSpriteBatch(this);
        }
        set TextureOffset(value) {
            this.textureOffset = value;
        }
        get TextureOffset() {
            return this.textureOffset;
        }
        Dispose() {
            // Shader & texture are external dependencies: they are not disposed here
            this.Vertices = [];
            this.TextureCoordinates = [];
            WebGLUtils_2.gl.deleteBuffer(this.VertexBuffer);
            WebGLUtils_2.gl.deleteBuffer(this.TextureCoordinateBuffer);
            WebGLUtils_2.gl.bindBuffer(WebGLUtils_2.gl.ARRAY_BUFFER, null);
            ResourceTracker_2.ResourceTracker.GetInstance().UnTrackSpriteBatch(this);
        }
        Draw(projectionMatrix, viewMatrix) {
            const shaderProgram = this.BatchShader.GetProgram();
            this.BatchShader.Use();
            const attribLocation = WebGLUtils_2.gl.getAttribLocation(shaderProgram, "a_pos");
            const textureCoordinateAttribLocation = WebGLUtils_2.gl.getAttribLocation(shaderProgram, "a_texture_coordinate");
            WebGLUtils_2.gl.bindBuffer(WebGLUtils_2.gl.ARRAY_BUFFER, this.VertexBuffer);
            WebGLUtils_2.gl.enableVertexAttribArray(attribLocation);
            WebGLUtils_2.gl.vertexAttribPointer(attribLocation, 3, WebGLUtils_2.gl.FLOAT, false, 0, 0);
            WebGLUtils_2.gl.bindBuffer(WebGLUtils_2.gl.ARRAY_BUFFER, this.TextureCoordinateBuffer);
            WebGLUtils_2.gl.enableVertexAttribArray(textureCoordinateAttribLocation);
            WebGLUtils_2.gl.vertexAttribPointer(textureCoordinateAttribLocation, 2, WebGLUtils_2.gl.FLOAT, false, 0, 0);
            const projectionLocation = WebGLUtils_2.gl.getUniformLocation(shaderProgram, "projection");
            WebGLUtils_2.gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
            const viewLocation = WebGLUtils_2.gl.getUniformLocation(shaderProgram, "view");
            WebGLUtils_2.gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
            const modelLocation = WebGLUtils_2.gl.getUniformLocation(shaderProgram, "model");
            WebGLUtils_2.gl.uniformMatrix4fv(modelLocation, false, this.ModelMatrix);
            if (this.texture) {
                WebGLUtils_2.gl.activeTexture(WebGLUtils_2.gl.TEXTURE0);
                WebGLUtils_2.gl.bindTexture(WebGLUtils_2.gl.TEXTURE_2D, this.texture.GetTexture());
                const textureLocation = WebGLUtils_2.gl.getUniformLocation(shaderProgram, "u_sampler");
                WebGLUtils_2.gl.uniform1i(textureLocation, 0);
            }
            const textureOffsetLocation = WebGLUtils_2.gl.getUniformLocation(shaderProgram, "texOffset");
            WebGLUtils_2.gl.uniform2fv(textureOffsetLocation, this.textureOffset);
            WebGLUtils_2.gl.enable(WebGLUtils_2.gl.BLEND);
            WebGLUtils_2.gl.blendFunc(WebGLUtils_2.gl.SRC_ALPHA, WebGLUtils_2.gl.ONE_MINUS_SRC_ALPHA);
            WebGLUtils_2.gl.drawArrays(WebGLUtils_2.gl.TRIANGLES, 0, this.Vertices.length / 3);
            WebGLUtils_2.gl.bindTexture(WebGLUtils_2.gl.TEXTURE_2D, null);
            WebGLUtils_2.gl.bindBuffer(WebGLUtils_2.gl.ARRAY_BUFFER, null);
            WebGLUtils_2.gl.disableVertexAttribArray(attribLocation);
            WebGLUtils_2.gl.disableVertexAttribArray(textureCoordinateAttribLocation);
            WebGLUtils_2.gl.disable(WebGLUtils_2.gl.BLEND);
        }
    }
    exports.SpriteBatch = SpriteBatch;
});
define("ResourceTracker", ["require", "exports", "Environment"], function (require, exports, Environment_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceTracker = void 0;
    class ResourceTracker {
        constructor() {
            this._tracking = Environment_2.Environment.TrackResources;
            this._shaders = new Map();
            this._textures = new Map();
            this._batches = new Map();
        }
        static GetInstance() {
            if (!this.instance) {
                this.instance = new ResourceTracker();
            }
            return this.instance;
        }
        StartTracking() {
            this._tracking = true;
        }
        StopTracking() {
            this._tracking = false;
        }
        TrackShader(shader) {
            if (!this._tracking) {
                return;
            }
            this._shaders.set(shader, new Error().stack);
        }
        UnTrackShader(shader) {
            if (!this._tracking) {
                return;
            }
            this._shaders.delete(shader);
        }
        TrackTexture(texture) {
            if (!this._tracking) {
                return;
            }
            this._textures.set(texture, new Error().stack);
        }
        UnTrackTexture(texture) {
            if (!this._tracking) {
                return;
            }
            this._textures.delete(texture);
        }
        TrackSpriteBatch(batch) {
            if (!this._tracking) {
                return;
            }
            this._batches.set(batch, new Error().stack);
        }
        UnTrackSpriteBatch(batch) {
            if (!this._tracking) {
                return;
            }
            this._batches.delete(batch);
        }
        get AliveShaderStackTrace() {
            const aliveShadersStackTrace = [];
            this._shaders.forEach(shader => {
                aliveShadersStackTrace.push(shader);
            });
            return aliveShadersStackTrace;
        }
        get AliveTextureStackTrace() {
            const aliveTextureStackTrace = [];
            this._textures.forEach(texture => {
                aliveTextureStackTrace.push(texture);
            });
            return aliveTextureStackTrace;
        }
        get AliveSpriteBatchStackTrace() {
            const aliveSpriteBatchStackTrace = [];
            this._batches.forEach(batch => {
                aliveSpriteBatchStackTrace.push(batch);
            });
            return aliveSpriteBatchStackTrace;
        }
        get AliveResourceStackTrace() {
            return this.AliveTextureStackTrace
                .concat(this.AliveShaderStackTrace)
                .concat(this.AliveSpriteBatchStackTrace);
        }
    }
    exports.ResourceTracker = ResourceTracker;
    ResourceTracker.instance = null;
});
define("Shader", ["require", "exports", "ShaderPool", "WebGLUtils", "ResourceTracker"], function (require, exports, ShaderPool_1, WebGLUtils_3, ResourceTracker_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Shader = void 0;
    class Shader {
        constructor(vertexShader, fragmentShader) {
            this.program = this.createProgram(vertexShader, fragmentShader);
            this.valid = true;
            ResourceTracker_3.ResourceTracker.GetInstance().TrackShader(this);
        }
        static async Create(vertexPath, fragmentPath) {
            const vertexShader = await Shader.LoadShader(vertexPath, WebGLUtils_3.gl.VERTEX_SHADER);
            const fragmentShader = await Shader.LoadShader(fragmentPath, WebGLUtils_3.gl.FRAGMENT_SHADER);
            const shader = new Shader(vertexShader, fragmentShader);
            WebGLUtils_3.gl.deleteShader(vertexShader);
            WebGLUtils_3.gl.deleteShader(fragmentShader);
            return shader;
        }
        Use() {
            if (!this.valid) {
                throw new Error("Trying to use a deleted shader program!");
            }
            WebGLUtils_3.gl.useProgram(this.program);
        }
        GetProgram() {
            if (!this.valid) {
                throw new Error("Trying to get a deleted shader program!");
            }
            return this.program;
        }
        Delete() {
            ResourceTracker_3.ResourceTracker.GetInstance().UnTrackShader(this);
            this.valid = false;
            WebGLUtils_3.gl.deleteProgram(this.program);
        }
        SetFloatUniform(name, value) {
            this.Use();
            const location = WebGLUtils_3.gl.getUniformLocation(this.program, name);
            WebGLUtils_3.gl.uniform1f(location, value);
        }
        SetVec2Uniform(name, value) {
            this.Use();
            const location = WebGLUtils_3.gl.getUniformLocation(this.program, name);
            WebGLUtils_3.gl.uniform2fv(location, value);
        }
        SetVec4Uniform(name, value) {
            this.Use();
            const location = WebGLUtils_3.gl.getUniformLocation(this.program, name);
            WebGLUtils_3.gl.uniform4fv(location, value);
        }
        createProgram(vertex, fragment) {
            const program = WebGLUtils_3.gl.createProgram();
            WebGLUtils_3.gl.attachShader(program, vertex);
            WebGLUtils_3.gl.attachShader(program, fragment);
            WebGLUtils_3.gl.linkProgram(program);
            WebGLUtils_3.gl.detachShader(program, vertex);
            WebGLUtils_3.gl.detachShader(program, fragment);
            return program;
        }
        static async LoadShader(elementPath, type) {
            const id = WebGLUtils_3.gl.createShader(type);
            const src = await ShaderPool_1.ShaderPool.GetInstance().LoadShaderSource(elementPath);
            WebGLUtils_3.gl.shaderSource(id, src);
            WebGLUtils_3.gl.compileShader(id);
            const error = WebGLUtils_3.gl.getShaderInfoLog(id);
            if (error !== null && error.length > 0) {
                throw new Error(`Failed to compile shader (${elementPath}): ` + error);
            }
            return id;
        }
    }
    exports.Shader = Shader;
});
define("Tile", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Tile = void 0;
    class Tile {
        // TODO: position vector instead of primitives
        constructor(positionX, positionY, texture) {
            this.positionX = positionX;
            this.positionY = positionY;
            this.texture = texture;
            this.collidable = true;
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
        get Collidable() {
            return this.collidable;
        }
        set Collidable(value) {
            this.collidable = value;
        }
        IsPointInside(point, offsetX, offsetY) {
            // A tile is always 1x1
            const minX = this.positionX + offsetX;
            const maxX = this.positionX + offsetX + 1;
            const minY = this.positionY + offsetY;
            const maxY = this.positionY + offsetY + 1;
            return point[0] >= minX && point[0] <= maxX &&
                point[1] >= minY && point[1] <= maxY;
        }
        IsCollidingWith(boundingBox, offsetX, offsetY) {
            if (!this.collidable) {
                return false;
            }
            // A tile is always 1x1
            const minX = this.positionX + offsetX;
            const maxX = this.positionX + offsetX + 1;
            const minY = this.positionY + offsetY;
            const maxY = this.positionY + offsetY + 1;
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
define("Utils", ["require", "exports", "Environment"], function (require, exports, Environment_3) {
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
                positionX + 1.0, positionY + 1.0, 0.0
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
                positionX + width, positionY + height
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
        1.0, 1.0, 0.0
    ];
    Utils.DefaultSpriteTextureCoordinates = [
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1
    ];
    Utils.DefaultFullscreenQuadVertices = [
        0.0, 0.0, 0.0,
        Environment_3.Environment.HorizontalTiles, 0.0, 0.0,
        0, Environment_3.Environment.VerticalTiles, 0.0,
        0, Environment_3.Environment.VerticalTiles, 0.0,
        Environment_3.Environment.HorizontalTiles, 0, 0.0,
        Environment_3.Environment.HorizontalTiles, Environment_3.Environment.VerticalTiles, 0.0
    ];
    Utils.DefaultFullscreenQuadTextureCoordinates = [
        0, 1,
        1, 1,
        0, 0,
        0, 0,
        1, 1,
        1, 0
    ];
});
define("Layer", ["require", "exports", "BoundingBox", "gl-matrix", "Shader", "Sprite", "SpriteBatch", "Tile", "Utils", "Environment"], function (require, exports, BoundingBox_2, gl_matrix_3, Shader_1, Sprite_2, SpriteBatch_1, Tile_1, Utils_1, Environment_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Layer = void 0;
    class Layer {
        constructor(spriteBatches, tiles, parallaxOffsetFactorX, parallaxOffsetFactorY, layerOffsetX, layerOffsetY, layerShader) {
            this.spriteBatches = spriteBatches;
            this.tiles = tiles;
            this.parallaxOffsetFactorX = parallaxOffsetFactorX;
            this.parallaxOffsetFactorY = parallaxOffsetFactorY;
            this.layerOffsetX = layerOffsetX;
            this.layerOffsetY = layerOffsetY;
            this.layerShader = layerShader;
            this.initialTileData = [];
            this.initialLayerOffsetX = layerOffsetX;
            this.initialLayerOffsetY = layerOffsetY;
            this.tiles.forEach(t => {
                const tile = new Tile_1.Tile(t.PositionX, t.PositionY, t.Texture);
                tile.Collidable = t.Collidable;
                this.initialTileData.push(tile);
            });
        }
        static async Create(tiles, parallaxOffsetFactorX, parallaxOffsetFactorY, layerOffsetX, layerOffsetY) {
            const shader = await Shader_1.Shader.Create("shaders/VertexShader.vert", "shaders/FragmentShader.frag");
            const tileMap = Layer.CreateTileMap(tiles);
            const batches = await Layer.CreateSpriteBatches(tileMap, shader);
            return new Layer(batches, tiles, parallaxOffsetFactorX, parallaxOffsetFactorY, layerOffsetX, layerOffsetY, shader);
        }
        ResetState() {
            this.layerOffsetX = this.initialLayerOffsetX;
            this.layerOffsetY = this.initialLayerOffsetY;
            this.tiles = [];
            this.initialTileData.forEach(t => {
                this.tiles.push(t);
            });
        }
        get BoundingBox() {
            return new BoundingBox_2.BoundingBox(gl_matrix_3.vec3.fromValues(this.MinX, this.MinY, 0), gl_matrix_3.vec2.fromValues(this.MaxX - this.MinX, this.MaxY - this.MinY));
        }
        get ParallaxOffsetFactorX() {
            return this.parallaxOffsetFactorX;
        }
        get ParallaxOffsetFactorY() {
            return this.parallaxOffsetFactorY;
        }
        get LayerOffsetX() {
            return this.layerOffsetX;
        }
        get LayerOffsetY() {
            return this.layerOffsetY;
        }
        set LayerOffsetX(offset) {
            this.layerOffsetX = offset;
        }
        set LayerOffsetY(offset) {
            this.layerOffsetY = offset;
        }
        IsCollidingWith(boundingBox, collideWithUndefined) {
            // Areas outside the boundaries are treated as collisions when collideWithUndefined is set to true
            // This way a hero cant fall of the edge of the world.
            if (this.IsOutsideBoundary(boundingBox) && collideWithUndefined) {
                return true;
            }
            return this.tiles.some(tile => tile.IsCollidingWith(boundingBox, this.LayerOffsetX, this.LayerOffsetY));
        }
        get MaxX() {
            return Math.max(...this.tiles.map(t => t.PositionX + 1), Environment_4.Environment.HorizontalTiles);
        }
        get MinX() {
            return Math.min(...this.tiles.map(t => t.PositionX));
        }
        get MinY() {
            return Math.min(...this.tiles.map(t => t.PositionY));
        }
        get MaxY() {
            return Math.max(...this.tiles.map(t => t.PositionY + 1));
        }
        SetCollision(x, y, collidable) {
            const tile = this.tiles.find(t => t.PositionX === x && t.PositionY === y);
            if (tile) {
                tile.Collidable = collidable;
            }
            else {
                const invisibleTile = new Tile_1.Tile(x, y, null);
                invisibleTile.Collidable = collidable;
                this.tiles.push(invisibleTile);
            }
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
            this.spriteBatches.forEach(batch => batch.Draw(projectionMatrix, viewMatrix));
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
                if (tile.Texture) {
                    const tileBatch = tileMap.get(tile.Texture);
                    if (!tileBatch) {
                        tileMap.set(tile.Texture, [tile]);
                    }
                    else {
                        tileBatch.push(tile);
                    }
                }
            });
            return tileMap;
        }
        static async CreateSpriteBatches(tileMap, shader) {
            const batches = [];
            tileMap.forEach((tiles, texture) => {
                const sprites = tiles.map((t) => {
                    const vertices = Utils_1.Utils.CreateSpriteVertices(t.PositionX, t.PositionY);
                    return new Sprite_2.Sprite(vertices, Utils_1.Utils.DefaultSpriteTextureCoordinates);
                });
                batches.push(new SpriteBatch_1.SpriteBatch(shader, sprites, texture));
            });
            return batches;
        }
        Dispose() {
            this.layerShader.Delete();
            this.spriteBatches.forEach(s => s.Dispose());
        }
    }
    exports.Layer = Layer;
});
define("Camera", ["require", "exports", "gl-matrix", "Environment"], function (require, exports, gl_matrix_4, Environment_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Camera = void 0;
    class Camera {
        constructor(position) {
            this.position = position;
            this.shake = false;
            this.viewMatrix = gl_matrix_4.mat4.create();
        }
        get ViewMatrix() {
            return this.viewMatrix;
        }
        get Shake() {
            return this.shake;
        }
        set Shake(value) {
            this.shake = value;
        }
        /**
         * The camera centers its view on the given position with its viewport confined in the boundaries of the given layer
         * @param position The position to look at
         * @param layer The layer where the camera's viewport is confined in
         */
        LookAtPosition(position, layer) {
            const xShake = this.shake ? Math.random() * (0.2 - 0.1) + 0.1 : 0;
            const yShake = this.shake ? Math.random() * (0.2 - 0.1) + 0.1 : 0;
            position[0] = this.Clamp(position[0], layer.MinX + Environment_5.Environment.HorizontalTiles / 2, layer.MaxX - Environment_5.Environment.HorizontalTiles / 2) + xShake;
            position[1] = this.Clamp(position[1], layer.MinY - Environment_5.Environment.VerticalTiles / 2, layer.MaxY - Environment_5.Environment.VerticalTiles / 2) + yShake;
            gl_matrix_4.mat4.translate(this.viewMatrix, gl_matrix_4.mat4.create(), gl_matrix_4.vec3.fromValues(-position[0] + Environment_5.Environment.HorizontalTiles / 2, -position[1] + Environment_5.Environment.VerticalTiles / 2, 0));
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
        constructor() {
            this.activeControllerId = null;
        }
        ActivateGamepad(index) {
            this.activeControllerId = index;
        }
        IsPressed(keyId) {
            if (this.activeControllerId === null) {
                return false;
            }
            const activeController = navigator.getGamepads()[this.activeControllerId];
            if (activeController) {
                return activeController.buttons[keyId].pressed;
            }
            return false;
        }
        get LeftStick() {
            if (this.activeControllerId === null) {
                return gl_matrix_5.vec2.create();
            }
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
define("TexturePool", ["require", "exports", "Lock", "Texture"], function (require, exports, Lock_2, Texture_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TexturePool = void 0;
    class TexturePool {
        constructor() {
            this.textures = new Map();
            this.lock = new Lock_2.Lock();
        }
        static GetInstance() {
            if (!this.Instance) {
                this.Instance = new TexturePool();
            }
            return this.Instance;
        }
        async GetTexture(path) {
            await this.lock.lock(path);
            const texture = this.textures.get(path);
            if (!texture) {
                const created = await Texture_1.Texture.Create(path);
                this.textures.set(path, created);
                await this.lock.release(path);
                return created;
            }
            await this.lock.release(path);
            return texture;
        }
        /**
         * Empties the texture cache AND frees any OpenGL resources
         */
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
                this.GetTexture('textures/title.jpeg'),
                this.GetTexture('textures/firebomb.png')
            ]);
        }
        RemoveAllIn(paths) {
            paths.forEach(path => {
                const texture = this.textures.get(path);
                if (texture) {
                    this.textures.delete(path);
                    texture.Delete();
                }
            });
        }
    }
    exports.TexturePool = TexturePool;
});
define("Textbox", ["require", "exports", "gl-matrix", "Shader", "TexturePool", "Utils", "Sprite", "SpriteBatch", "WebGLUtils", "FontConfigPool"], function (require, exports, gl_matrix_6, Shader_2, TexturePool_1, Utils_2, Sprite_3, SpriteBatch_2, WebGLUtils_4, FontConfigPool_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Textbox = exports.FontConfig = void 0;
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
            this.sprite = new Sprite_3.Sprite(vertices, uvs);
        }
    }
    class Textbox {
        constructor(fontMap, shader, fontConfig) {
            this.fontMap = fontMap;
            this.shader = shader;
            this.fontConfig = fontConfig;
            this.previousText = null;
            this.previousScale = null;
            this.previousPosition = gl_matrix_6.vec2.create();
            this.text = [];
            this.cursorX = 0;
            this.maxCharacterHeight = 0;
            this.position = gl_matrix_6.vec2.create();
            this.batch = null;
        }
        static async Create(fontName) {
            const shader = await Shader_2.Shader.Create('shaders/VertexShader.vert', 'shaders/Font.frag');
            const fontMap = await TexturePool_1.TexturePool.GetInstance().GetTexture(`textures/Fonts/${fontName}/font.png`);
            const fontConfig = await FontConfigPool_1.FontConfigPool.GetInstance().GetFontConfig(`textures/Fonts/${fontName}/font.json`);
            return new Textbox(fontMap, shader, fontConfig)
                .WithHue(1).WithSaturation(0).WithValue(1);
        }
        WithText(text, position, scale = 1.0) {
            var _a;
            if (this.previousText === text && this.previousScale === scale && gl_matrix_6.vec2.equals(this.previousPosition, position)) {
                // Nothing has changed we can skip all processing
                return this;
            }
            this.previousText = text;
            this.previousScale = scale;
            this.previousPosition = position;
            this.text = [];
            this.cursorX = 0;
            this.position = position;
            const heights = [...this.fontConfig.characters.values()].map(c => c.height);
            this.maxCharacterHeight = Math.max(...heights) * scale;
            for (const character of text) {
                const charConfig = this.fontConfig.characters.get(character);
                const charPos = gl_matrix_6.vec2.fromValues(position[0] + this.cursorX, position[1] + this.maxCharacterHeight);
                const renderableChar = new Character(this.shader, this.fontMap, charConfig, charPos, scale);
                this.text.push(renderableChar);
                this.cursorX += renderableChar.Advance;
            }
            // Recreate the texture batch on change
            (_a = this.batch) === null || _a === void 0 ? void 0 : _a.Dispose();
            const sprites = this.text.map(t => t.Sprite);
            this.batch = new SpriteBatch_2.SpriteBatch(this.shader, sprites, this.fontMap);
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
            var _a;
            WebGLUtils_4.gl.enable(WebGLUtils_4.gl.BLEND);
            if (this.text.length > 0) {
                (_a = this.batch) === null || _a === void 0 ? void 0 : _a.Draw(proj, gl_matrix_6.mat4.create());
            }
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
         * @param scale The scaling factor of the rendered text
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
            var _a;
            this.shader.Delete();
            (_a = this.batch) === null || _a === void 0 ? void 0 : _a.Dispose();
        }
    }
    exports.Textbox = Textbox;
});
define("FontConfigPool", ["require", "exports", "Lock", "Textbox"], function (require, exports, Lock_3, Textbox_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FontConfigPool = void 0;
    class FontConfigPool {
        constructor() {
            this.configs = new Map();
            this.lock = new Lock_3.Lock();
        }
        static GetInstance() {
            if (!this.instance) {
                this.instance = new FontConfigPool();
            }
            return this.instance;
        }
        async GetFontConfig(fontPath) {
            await this.lock.lock(fontPath);
            const config = this.configs.get(fontPath);
            if (!config) {
                const created = await Textbox_1.FontConfig.Create(fontPath);
                this.configs.set(fontPath, created);
                await this.lock.release(fontPath);
                return created;
            }
            await this.lock.release(fontPath);
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
            var _a;
            return (_a = this.keys.get(code)) !== null && _a !== void 0 ? _a : false;
        }
    }
    exports.KeyHandler = KeyHandler;
});
define("SoundEffect", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SoundEffect = void 0;
    class SoundEffect {
        constructor(buffer, context, allowMultiple = true, path) {
            this.buffer = buffer;
            this.context = context;
            this.allowMultiple = allowMultiple;
            this.path = path;
            this.activeSources = new Set();
        }
        static async Create(path, allowMultiple = true) {
            const blob = await ((await fetch(path)).arrayBuffer());
            const context = new AudioContext();
            const buffer = await context.decodeAudioData(blob);
            return new SoundEffect(buffer, context, allowMultiple, path);
        }
        async Play(playbackRate = 1, volume = 1, onEndCallback = null, loop = false) {
            if (!this.allowMultiple && this.activeSources.size > 0) {
                return;
            }
            const gainNode = this.context.createGain();
            gainNode.gain.value = volume;
            const source = this.context.createBufferSource();
            source.buffer = this.buffer;
            source.playbackRate.value = playbackRate;
            source.loop = loop;
            source.connect(gainNode).connect(this.context.destination);
            const entry = { source, gainNode };
            this.activeSources.add(entry);
            source.onended = () => {
                this.activeSources.delete(entry);
                if (onEndCallback) {
                    onEndCallback();
                }
            };
            await this.context.resume();
            source.start();
        }
        Stop() {
            this.activeSources.forEach(({ source }) => {
                source.stop();
            });
            this.activeSources.clear();
        }
        set Volume(volume) {
            this.activeSources.forEach((entry) => {
                entry.gainNode.gain.value = volume;
            });
        }
        get Volume() {
            if (this.activeSources.size === 0) {
                return 0;
            }
            const firstGainNode = Array.from(this.activeSources)[0].gainNode;
            return firstGainNode.gain.value;
        }
        get Path() {
            return this.path;
        }
    }
    exports.SoundEffect = SoundEffect;
});
define("SoundEffectPool", ["require", "exports", "Lock", "SoundEffect"], function (require, exports, Lock_4, SoundEffect_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SoundEffectPool = void 0;
    class SoundEffectPool {
        constructor() {
            this.effects = new Map();
            this.lock = new Lock_4.Lock();
        }
        static GetInstance() {
            if (!this.instance) {
                this.instance = new SoundEffectPool();
            }
            return this.instance;
        }
        // TODO:key should be path + allowparallel pair
        async GetAudio(path, allowParallel = true) {
            await this.lock.lock(path);
            const effect = this.effects.get(path);
            if (!effect) {
                const created = await SoundEffect_1.SoundEffect.Create(path, allowParallel);
                this.effects.set(path, created);
                await this.lock.release(path);
                return created;
            }
            await this.lock.release(path);
            return effect;
        }
        async Preload() {
            await Promise.all([
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
        StopAll() {
            this.effects.forEach(e => e.Stop());
        }
    }
    exports.SoundEffectPool = SoundEffectPool;
});
define("IGameobject", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Projectiles/IProjectile", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("SpriteRenderer", ["require", "exports", "SpriteBatch", "gl-matrix"], function (require, exports, SpriteBatch_3, gl_matrix_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpriteRenderer = void 0;
    class SpriteRenderer {
        constructor(shader, texture, sprite, visualScale) {
            this.shader = shader;
            this.texture = texture;
            this.sprite = sprite;
            this.visualScale = visualScale;
            this.batch = new SpriteBatch_3.SpriteBatch(this.shader, [this.sprite], this.texture);
        }
        Draw(proj, view, position, rotation) {
            this.UpdateModelMatrix(position, rotation);
            this.batch.Draw(proj, view);
        }
        set TextureOffset(offset) {
            this.batch.TextureOffset = offset;
        }
        UpdateModelMatrix(position, rotation) {
            const modelMatrix = gl_matrix_7.mat4.create();
            this.Rotate(modelMatrix, position, rotation);
            gl_matrix_7.mat4.translate(modelMatrix, modelMatrix, position);
            gl_matrix_7.mat4.scale(modelMatrix, modelMatrix, gl_matrix_7.vec3.fromValues(this.visualScale[0], this.visualScale[1], 1));
            this.batch.ModelMatrix = modelMatrix;
        }
        Rotate(modelMat, position, rotation) {
            // Rotation has to consider the center of the rotated object, and not its top-left position
            const centerX = position[0] + this.visualScale[0] * 0.5;
            const centerY = position[1] + this.visualScale[1] * 0.5;
            gl_matrix_7.mat4.translate(modelMat, modelMat, gl_matrix_7.vec3.fromValues(centerX, centerY, 0));
            gl_matrix_7.mat4.rotateZ(modelMat, modelMat, rotation);
            gl_matrix_7.mat4.translate(modelMat, modelMat, gl_matrix_7.vec3.fromValues(-centerX, -centerY, 0));
        }
        Dispose() {
            this.batch.Dispose();
        }
    }
    exports.SpriteRenderer = SpriteRenderer;
});
define("Components/Animation", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Animation = void 0;
    class Animation {
        constructor(frameTime, renderer) {
            this.frameTime = frameTime;
            this.renderer = renderer;
            this.currentFrameTime = 0;
            this.currentFrameIndex = 0;
            // Shows if the animation looped at least once
            this.animationFinished = false;
            this.playing = true;
        }
        Animate(delta, frameSet) {
            if (this.playing) {
                this.currentFrameTime += delta;
                this.renderer.TextureOffset = frameSet[this.currentFrameIndex];
                if (this.currentFrameTime > this.frameTime) {
                    this.currentFrameIndex++;
                    if (this.currentFrameIndex >= frameSet.length) {
                        this.currentFrameIndex = 0;
                        this.animationFinished = true;
                    }
                    this.currentFrameTime = 0;
                }
            }
            return this.animationFinished;
        }
        Stop() {
            this.playing = false;
        }
        Start() {
            this.playing = true;
        }
    }
    exports.Animation = Animation;
});
define("Components/PhysicsComponent", ["require", "exports", "gl-matrix", "BoundingBox"], function (require, exports, gl_matrix_8, BoundingBox_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PhysicsComponent = void 0;
    class PhysicsComponent {
        constructor(position, lastPosition, boundingBox, bbOffset, collider, flying, canGoOutOfBounds = false) {
            this.position = position;
            this.lastPosition = lastPosition;
            this.boundingBox = boundingBox;
            this.bbOffset = bbOffset;
            this.collider = collider;
            this.flying = flying;
            this.canGoOutOfBounds = canGoOutOfBounds;
            this.gravityEnabled = true;
            this.GRAVITY = gl_matrix_8.vec3.fromValues(0, 0.00023, 0);
            this.velocity = gl_matrix_8.vec3.create();
            this.externalForce = gl_matrix_8.vec3.create();
            this.onGround = false;
            this.xCollide = false;
            this.yCollide = false;
        }
        Update(delta) {
            gl_matrix_8.vec3.copy(this.lastPosition, this.position);
            this.xCollide = false;
            this.yCollide = false;
            if (!this.flying && this.gravityEnabled) {
                this.ApplyGravityToVelocity(delta);
            }
            this.ApplyDamping();
            this.ApplyExternalForceToVelocity();
            const boundingBox = this.boundingBox();
            const nextX = this.CalculateNextPosition(gl_matrix_8.vec3.fromValues(this.velocity[0], 0, 0), delta);
            const bbPosX = gl_matrix_8.vec3.add(gl_matrix_8.vec3.create(), nextX, this.bbOffset);
            const bbX = new BoundingBox_3.BoundingBox(bbPosX, boundingBox.size);
            if (this.collider.IsCollidingWith(bbX, !this.canGoOutOfBounds)) {
                this.velocity[0] = 0;
                this.xCollide = true;
            }
            else {
                this.position[0] = nextX[0];
            }
            const nextY = this.CalculateNextPosition(gl_matrix_8.vec3.fromValues(0, this.velocity[1], 0), delta);
            const bbPosY = gl_matrix_8.vec3.add(gl_matrix_8.vec3.create(), gl_matrix_8.vec3.fromValues(this.position[0], nextY[1], this.position[2]), this.bbOffset);
            const bbY = new BoundingBox_3.BoundingBox(bbPosY, boundingBox.size);
            if (this.collider.IsCollidingWith(bbY, !this.canGoOutOfBounds)) {
                const movingDownward = this.velocity[1] > 0;
                const stopped = Math.abs(this.velocity[1]) < 0.00001;
                this.velocity[1] = 0;
                this.yCollide = true;
                this.onGround = movingDownward || stopped;
            }
            else {
                this.position[1] = nextY[1];
                this.onGround = false;
            }
            gl_matrix_8.vec3.set(this.externalForce, 0, 0, 0);
        }
        get OnGround() {
            return this.onGround;
        }
        get Colliding() {
            return this.xCollide || this.yCollide;
        }
        get Velocity() {
            return this.velocity;
        }
        DisableGravity() {
            this.gravityEnabled = false;
        }
        EnableGravity() {
            this.gravityEnabled = true;
        }
        AddToExternalForce(force) {
            gl_matrix_8.vec3.add(this.externalForce, this.externalForce, force);
        }
        WillCollide(delta) {
            const nextX = this.CalculateNextPosition(gl_matrix_8.vec3.fromValues(this.velocity[0], 0, 0), delta);
            const nextY = this.CalculateNextPosition(gl_matrix_8.vec3.fromValues(0, this.velocity[1], 0), delta);
            return this.CheckCollisionWithCollider(nextX, this.boundingBox(), this.bbOffset) ||
                this.CheckCollisionWithCollider(nextY, this.boundingBox(), this.bbOffset);
        }
        ResetVelocity() {
            gl_matrix_8.vec3.set(this.velocity, 0, 0, 0);
            this.externalForce = gl_matrix_8.vec3.create();
        }
        ResetVerticalVelocity() {
            this.velocity[1] = 0;
            this.externalForce[1] = 0;
        }
        ApplyExternalForceToVelocity() {
            gl_matrix_8.vec3.add(this.velocity, this.velocity, this.externalForce);
        }
        ApplyGravityToVelocity(delta) {
            gl_matrix_8.vec3.add(this.velocity, this.velocity, gl_matrix_8.vec3.scale(gl_matrix_8.vec3.create(), this.GRAVITY, delta));
        }
        CalculateNextPosition(velocity, delta) {
            return gl_matrix_8.vec3.scaleAndAdd(gl_matrix_8.vec3.create(), this.position, velocity, delta);
        }
        CheckCollisionWithCollider(nextPosition, boundingBox, bbOffset) {
            const nextBbPos = gl_matrix_8.vec3.add(gl_matrix_8.vec3.create(), nextPosition, bbOffset);
            const nextBoundingBox = new BoundingBox_3.BoundingBox(nextBbPos, boundingBox.size);
            return this.collider.IsCollidingWith(nextBoundingBox, !this.canGoOutOfBounds);
        }
        ApplyDamping() {
            const groundDamping = 0.75;
            const airDamping = 0.9;
            const nonFlyingAirDamping = 0.75;
            // flying enemies only affected by air damping
            const damping = this.flying ? airDamping :
                this.onGround ? groundDamping : nonFlyingAirDamping;
            gl_matrix_8.vec3.scale(this.velocity, this.velocity, damping);
            if (Math.abs(this.velocity[0]) < 0.00001) {
                this.velocity[0] = 0;
            }
            if (Math.abs(this.velocity[1]) < 0.00001) {
                this.velocity[1] = 0;
            }
        }
    }
    exports.PhysicsComponent = PhysicsComponent;
});
define("IState", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Hero/States/DeadState", ["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DeadState = void 0;
    class DeadState {
        constructor(hero, onDeath, dieSound, sharedStateVariables, animation) {
            this.hero = hero;
            this.onDeath = onDeath;
            this.dieSound = dieSound;
            this.sharedStateVariables = sharedStateVariables;
            this.animation = animation;
            this.timeLeftInDeadState = 3000;
            this.dirOnDeath = gl_matrix_9.vec3.create();
        }
        async Enter() {
            await this.dieSound.Play();
            await this.animation.Stop();
        }
        async Exit() {
            await this.animation.Start();
        }
        async Update(delta) {
            this.timeLeftInDeadState -= delta;
            if (this.timeLeftInDeadState <= 0) {
                this.onDeath();
            }
            this.dirOnDeath = gl_matrix_9.vec3.clone(this.hero.FacingDirection);
            this.sharedStateVariables.bbSize = gl_matrix_9.vec2.fromValues(this.sharedStateVariables.bbSize[1], this.sharedStateVariables.bbSize[0]);
            // This is only kind-of correct, but im already in dead state so who cares if the bb is not correctly aligned.
            // The only important thing is not to fall through the geometry...
            this.sharedStateVariables.bbOffset[1] = this.dirOnDeath[0] > 0 ?
                1.5 - this.sharedStateVariables.bbOffset[1] : 1.5 - this.sharedStateVariables.bbOffset[1];
            this.sharedStateVariables.rotation = this.dirOnDeath[0] > 0 ? -Math.PI / 2 : Math.PI / 2;
        }
    }
    exports.DeadState = DeadState;
});
define("Components/Input/IControlSource", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    Keys.RIGHT_SHIFT = 'ShiftRight';
    Keys.ENTER = 'Enter';
    Keys.LEFT_ARROW = 'ArrowLeft';
    Keys.RIGHT_ARROW = 'ArrowRight';
    Keys.UP_ARROW = 'ArrowUp';
    Keys.DOWN_ARROW = 'ArrowDown';
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
define("Components/Input/PlayerControlSource", ["require", "exports", "Keys", "XBoxControllerKeys"], function (require, exports, Keys_1, XBoxControllerKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PlayerControlSource = void 0;
    class PlayerControlSource {
        constructor(keyHandler, gamepadHandler) {
            this.keyHandler = keyHandler;
            this.gamepadHandler = gamepadHandler;
        }
        Attack() {
            return (this.keyHandler.IsPressed(Keys_1.Keys.E) || this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.X) ||
                this.keyHandler.IsPressed(Keys_1.Keys.LEFT_CONTROL) || this.keyHandler.IsPressed(Keys_1.Keys.RIGHT_SHIFT));
        }
        Dash() {
            return (this.keyHandler.IsPressed(Keys_1.Keys.LEFT_SHIFT) ||
                this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.RB));
        }
        Jump() {
            return (this.keyHandler.IsPressed(Keys_1.Keys.SPACE) ||
                this.keyHandler.IsPressed(Keys_1.Keys.UP_ARROW) ||
                this.keyHandler.IsPressed(Keys_1.Keys.W) ||
                this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.A));
        }
        Left() {
            return (this.keyHandler.IsPressed(Keys_1.Keys.A) ||
                this.keyHandler.IsPressed(Keys_1.Keys.LEFT_ARROW) ||
                this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.LEFT) ||
                this.gamepadHandler.LeftStick[0] < -0.5);
        }
        Right() {
            return (this.keyHandler.IsPressed(Keys_1.Keys.D) ||
                this.keyHandler.IsPressed(Keys_1.Keys.RIGHT_ARROW) ||
                this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.RIGHT) ||
                this.gamepadHandler.LeftStick[0] > 0.5);
        }
        Stomp() {
            return (this.keyHandler.IsPressed(Keys_1.Keys.S) ||
                this.keyHandler.IsPressed(Keys_1.Keys.DOWN_ARROW) ||
                this.gamepadHandler.IsPressed(XBoxControllerKeys_1.XBoxControllerKeys.DOWN) ||
                this.gamepadHandler.LeftStick[1] > 0.8);
        }
    }
    exports.PlayerControlSource = PlayerControlSource;
});
define("Components/Input/InputSource", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputSource = void 0;
    class InputSource {
        constructor() {
            this.pressedKeys = new Set();
        }
        PressKey(key) {
            this.pressedKeys.add(key);
        }
        IsPressed(key) {
            if (this.pressedKeys.has(key)) {
                this.pressedKeys.delete(key);
                return true;
            }
            return false;
        }
    }
    exports.InputSource = InputSource;
});
define("Components/Input/ScriptControlSource", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScriptControlSource = void 0;
    class ScriptControlSource {
        constructor(input) {
            this.input = input;
        }
        Attack() {
            return false;
        }
        Dash() {
            return false;
        }
        Jump() {
            return false;
        }
        Left() {
            return this.input.IsPressed("left");
        }
        Right() {
            return this.input.IsPressed("right");
        }
        Stomp() {
            return false;
        }
    }
    exports.ScriptControlSource = ScriptControlSource;
});
define("Components/FlashOverlayComponent", ["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FlashOverlayComponent = void 0;
    /**
     * Flashes the given entity for a given amount of time with a given color.
     * NOTE: the used shader must have a 'colorOverlay' uniform defined
     */
    class FlashOverlayComponent {
        constructor(shader) {
            this.shader = shader;
            this.DAMAGE_FLASH_DURATION = 1. / 60 * 1000 * 15;
            this.DAMAGE_OVERLAY_COLOR = gl_matrix_10.vec4.fromValues(1, 0, 0, 0);
            this.ATTACK_SIGNAL_DURATION = 5 / 60 * 1000;
            this.ATTACK_SIGNAL_COLOR = gl_matrix_10.vec4.fromValues(0.65, 0.65, 0.65, 0);
            this.flashing = false;
            this.flashTimer = 0;
            this.flashDuration = 0;
        }
        Update(delta) {
            if (this.flashing) {
                this.flashTimer += delta;
            }
            // remove the damage overlay
            if (this.flashTimer >= this.flashDuration) {
                this.RemoveFlash();
            }
        }
        Flash(color, duration) {
            // remove the existing overlays
            if (this.flashing) {
                this.RemoveFlash();
            }
            this.flashDuration = duration;
            this.shader.SetVec4Uniform('colorOverlay', color);
            this.flashing = true;
        }
        RemoveFlash() {
            this.shader.SetVec4Uniform('colorOverlay', gl_matrix_10.vec4.create());
            this.flashing = false;
            this.flashTimer = 0;
        }
    }
    exports.FlashOverlayComponent = FlashOverlayComponent;
});
define("Components/DamageComponent", ["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DamageComponent = void 0;
    class DamageComponent {
        constructor(entity, flashOverlay, damageSound, physicsComponent, invincibleFrames) {
            this.entity = entity;
            this.flashOverlay = flashOverlay;
            this.damageSound = damageSound;
            this.physicsComponent = physicsComponent;
            this.invincibleFrames = invincibleFrames;
            this.invincible = false;
            this.invincibleTime = 0;
            this.isDamaged = false;
            this.remainingJumpTime = 0;
            this.pushbackForce = gl_matrix_11.vec3.create();
        }
        Update(delta) {
            this.DisableInvincibleStateAfter(delta, this.invincibleFrames);
            this.flashOverlay.Update(delta);
            if (this.invincible) {
                this.invincibleTime += delta;
            }
            if (this.isDamaged && this.remainingJumpTime > 0) {
                this.Pushback(delta, this.pushbackForce);
            }
            else {
                this.isDamaged = false;
            }
        }
        async Damage(force, damageAmount) {
            // Damage method should not consider the invincible flag because I don't want to cancel damage with projectiles when stomping
            if (this.entity.Health > 0) {
                this.invincible = true;
                this.flashOverlay.Flash(this.flashOverlay.DAMAGE_OVERLAY_COLOR, this.flashOverlay.DAMAGE_FLASH_DURATION);
                await this.damageSound.Play();
                this.entity.Health -= damageAmount;
                this.isDamaged = true;
                this.pushbackForce = gl_matrix_11.vec3.clone(force);
                this.remainingJumpTime = 150; // Time remaining in air after pushback. This is needed to keep adding force to the physics component for a given time
            }
        }
        async DamageWithInvincibilityConsidered(pushbackForce, damage) {
            if (!this.invincible) {
                await this.Damage(pushbackForce, damage);
            }
        }
        Pushback(delta, force) {
            const jDelta = Math.min(this.remainingJumpTime, delta);
            this.physicsComponent.AddToExternalForce(force);
            this.remainingJumpTime -= jDelta;
        }
        DisableInvincibleStateAfter(delta, numberOfFrames) {
            if (this.invincibleTime > 1.0 / 60 * 1000 * numberOfFrames) {
                this.invincible = false;
                this.invincibleTime = 0;
            }
            this.invincible ? this.invincibleTime += delta : this.invincibleTime = 0;
        }
    }
    exports.DamageComponent = DamageComponent;
});
define("Hero/HeroMovementBehaviour", ["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HeroMovementBehaviour = void 0;
    class HeroMovementBehaviour {
        constructor(hero, physicsComponent) {
            this.hero = hero;
            this.physicsComponent = physicsComponent;
        }
        MoveLeft(delta) {
            this.physicsComponent.AddToExternalForce(gl_matrix_12.vec3.scale(gl_matrix_12.vec3.create(), gl_matrix_12.vec3.fromValues(-this.hero.Speed, 0, 0), delta));
            this.hero.SetAnimationFrameset("left_walk");
            this.hero.FaceLeft();
        }
        MoveRight(delta) {
            this.physicsComponent.AddToExternalForce(gl_matrix_12.vec3.scale(gl_matrix_12.vec3.create(), gl_matrix_12.vec3.fromValues(this.hero.Speed, 0, 0), delta));
            this.hero.SetAnimationFrameset("right_walk");
            this.hero.FaceRight();
        }
    }
    exports.HeroMovementBehaviour = HeroMovementBehaviour;
});
define("Projectiles/ProjectileBase", ["require", "exports", "BoundingBox", "gl-matrix", "Sprite", "Utils", "Environment", "SpriteRenderer", "Components/PhysicsComponent", "Hero/States/DeadState"], function (require, exports, BoundingBox_4, gl_matrix_13, Sprite_4, Utils_3, Environment_6, SpriteRenderer_1, PhysicsComponent_1, DeadState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProjectileBase = void 0;
    class ProjectileBase {
        constructor(shader, texture, sprite, position, visualScale, bbOffset, bbSize, hitSound, animationMustComplete, collider, bbShader) {
            this.shader = shader;
            this.texture = texture;
            this.sprite = sprite;
            this.position = position;
            this.visualScale = visualScale;
            this.bbOffset = bbOffset;
            this.bbSize = bbSize;
            this.hitSound = hitSound;
            this.animationMustComplete = animationMustComplete;
            this.collider = collider;
            this.bbShader = bbShader;
            this.bbSprite = new Sprite_4.Sprite(Utils_3.Utils.DefaultSpriteVertices, Utils_3.Utils.DefaultSpriteTextureCoordinates);
            this.alreadyHit = false;
            this.OnHitListeners = [];
            this.renderer = new SpriteRenderer_1.SpriteRenderer(shader, texture, sprite, visualScale);
            this.bbRenderer = new SpriteRenderer_1.SpriteRenderer(bbShader, null, this.bbSprite, bbSize);
            this.physicsComponent = new PhysicsComponent_1.PhysicsComponent(position, gl_matrix_13.vec3.create(), () => this.BoundingBox, bbOffset, collider, true, true);
            bbShader.SetVec4Uniform('clr', gl_matrix_13.vec4.fromValues(1, 0, 0, 0.4));
        }
        Draw(proj, view) {
            if (!this.AlreadyHit || this.animationMustComplete) {
                this.renderer.Draw(proj, view, this.position, 0);
            }
            if (Environment_6.Environment.RenderBoundingBoxes) {
                this.bbRenderer.Draw(proj, view, this.BoundingBox.position, 0);
            }
        }
        get AlreadyHit() {
            return this.alreadyHit;
        }
        get EndCondition() {
            return false;
        }
        get BoundingBox() {
            const bbPos = gl_matrix_13.vec3.add(gl_matrix_13.vec3.create(), this.position, this.bbOffset); // Adjust bb position with the offset
            return new BoundingBox_4.BoundingBox(bbPos, this.bbSize);
        }
        async CollideWithAttack(attack) {
            // Do nothing
            // NOTE: overriding this could be used to cancel a projectile with an attack
        }
        async OnHit() {
            this.alreadyHit = true;
        }
        SubscribeToHitEvent(onHitListener) {
            this.OnHitListeners.push(onHitListener);
        }
        Dispose() {
            this.renderer.Dispose();
            this.bbRenderer.Dispose();
        }
        IsCollidingWith(boundingBox) {
            return this.BoundingBox.IsCollidingWith(boundingBox);
        }
        async Visit(hero) {
            if (!this.AlreadyHit && hero.StateClass !== DeadState_1.DeadState.name) {
                const pushbackForce = this.PushbackForce;
                await hero.Damage(pushbackForce, 20);
                await this.OnHit();
            }
        }
        async Move(direction, delta) {
            var _a;
            if (!this.physicsComponent.Colliding) {
                this.physicsComponent.AddToExternalForce(gl_matrix_13.vec3.scale(gl_matrix_13.vec3.create(), direction, delta));
            }
            else {
                await ((_a = this.hitSound) === null || _a === void 0 ? void 0 : _a.Play());
                this.alreadyHit = true;
            }
        }
        async Update(delta) {
            this.physicsComponent.Update(delta);
        }
    }
    exports.ProjectileBase = ProjectileBase;
});
define("Projectiles/MeleeAttack", ["require", "exports", "gl-matrix", "Shader", "Sprite", "TexturePool", "Utils", "SoundEffectPool", "Projectiles/ProjectileBase", "Components/Animation", "ICollider"], function (require, exports, gl_matrix_14, Shader_3, Sprite_5, TexturePool_2, Utils_4, SoundEffectPool_1, ProjectileBase_1, Animation_1, ICollider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MeleeAttack = void 0;
    // MeleeAttack is considered as a stationary projectile
    class MeleeAttack extends ProjectileBase_1.ProjectileBase {
        constructor(position, facingDirection, shader, bbShader, attackSound, texture) {
            const spriteVisualScale = gl_matrix_14.vec2.fromValues(4, 3);
            const bbSize = gl_matrix_14.vec2.fromValues(1.25, 2);
            const bbOffset = facingDirection[0] > 0 ?
                gl_matrix_14.vec3.fromValues(1.25, 0.5, 0) :
                gl_matrix_14.vec3.fromValues(-(bbSize[0] - 2.75), 0.5, 0);
            const sprite = new Sprite_5.Sprite(Utils_4.Utils.DefaultSpriteVertices, Utils_4.Utils.CreateTextureCoordinates(0.0 / 5.0, 0.0 / 2.0, 1.0 / 5.0, 1.0 / 2.0));
            const animationMustComplete = true;
            super(shader, texture, sprite, position, spriteVisualScale, bbOffset, bbSize, null, animationMustComplete, new ICollider_1.NullCollider(), bbShader);
            this.facingDirection = facingDirection;
            this.attackSound = attackSound;
            this.attackSoundPlayed = false;
            this.currentFrameSet = [
                gl_matrix_14.vec2.fromValues(1 / 5.0, 1 / 2.0),
                gl_matrix_14.vec2.fromValues(2 / 5.0, 1 / 2.0),
                gl_matrix_14.vec2.fromValues(3 / 5.0, 1 / 2.0)
            ];
            this.animation = new Animation_1.Animation(1 / 30 * 1000, this.renderer);
            this.renderer.TextureOffset = this.currentFrameSet[0];
        }
        async CollideWithAttack(attack) {
            // No-op as hero attacks shouldn't interact with each other
        }
        static async Create(position, facingDirection) {
            // TODO: i really should rename the fragment shader from Hero.frag as everything seems to use it...
            const shader = await Shader_3.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_3.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const attackSound = await SoundEffectPool_1.SoundEffectPool.GetInstance().GetAudio('audio/sword.mp3');
            const texture = await TexturePool_2.TexturePool.GetInstance().GetTexture('textures/Sword1.png');
            return new MeleeAttack(position, facingDirection, shader, bbShader, attackSound, texture);
        }
        get PushbackForce() {
            return gl_matrix_14.vec3.fromValues(this.facingDirection[0] * 0.0075, -0.005, 0);
        }
        async OnHit() {
            this.alreadyHit = true;
            // no hit sound here for the moment as it can differ on every enemy type
        }
        async Visit(hero) {
            // this shouldn't happen as melee attack is an attack by the hero. In the future enemies could use it too...
            throw new Error('Method not implemented.');
        }
        async Update(delta) {
            if (!this.attackSoundPlayed) {
                const pitch = 0.8 + Math.random() * (1.4 - 0.8);
                await this.attackSound.Play(pitch);
                this.attackSoundPlayed = true;
            }
            const animationFinished = this.animation.Animate(delta, this.currentFrameSet);
            if (animationFinished) {
                this.alreadyHit = true;
                this.OnHitListeners.forEach(l => l.DespawnAttack(this));
            }
        }
        Dispose() {
            super.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
    }
    exports.MeleeAttack = MeleeAttack;
});
define("Hero/States/SharedHeroStateVariables", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Hero/States/HeroBaseState", ["require", "exports", "Hero/HeroMovementBehaviour", "Projectiles/MeleeAttack", "gl-matrix"], function (require, exports, HeroMovementBehaviour_1, MeleeAttack_1, gl_matrix_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HeroBaseState = void 0;
    class HeroBaseState {
        constructor(hero, physicsComponent, damageComponent, SpawnProjectile, sharedStateVariables) {
            this.hero = hero;
            this.physicsComponent = physicsComponent;
            this.damageComponent = damageComponent;
            this.SpawnProjectile = SpawnProjectile;
            this.sharedStateVariables = sharedStateVariables;
            this.movementBehaviour = new HeroMovementBehaviour_1.HeroMovementBehaviour(hero, physicsComponent);
        }
        async Update(delta) {
            // Handle death
            if (this.hero.Health <= 0) {
                await this.hero.ChangeState(this.hero.DEAD_STATE());
            }
            await this.HandleInput();
            this.OverHealCountdown();
            this.sharedStateVariables.timeSinceLastMeleeAttack += delta;
            this.sharedStateVariables.timeInOverHeal += delta;
            this.sharedStateVariables.timeSinceLastDash += delta;
            this.sharedStateVariables.timeSinceLastStomp += delta;
            this.damageComponent.Update(delta);
            await this.UpdateState(delta);
        }
        async HandleInput() {
            if (this.hero.InputSource.Attack()) {
                const attackPosition = this.AttackSpawnPosition;
                if (this.sharedStateVariables.timeSinceLastMeleeAttack > 350) {
                    this.sharedStateVariables.timeSinceLastMeleeAttack = 0;
                    if (this.SpawnProjectile) {
                        // TODO: creating an attack instance on every attack is wasteful.
                        this.SpawnProjectile(this.hero, await MeleeAttack_1.MeleeAttack.Create(attackPosition, this.hero.FacingDirection));
                    }
                }
            }
        }
        get AttackSpawnPosition() {
            return this.hero.FacingDirection[0] > 0 ?
                gl_matrix_15.vec3.add(gl_matrix_15.vec3.create(), this.hero.CenterPosition, gl_matrix_15.vec3.fromValues(0, -1, 0)) :
                gl_matrix_15.vec3.add(gl_matrix_15.vec3.create(), this.hero.CenterPosition, gl_matrix_15.vec3.fromValues(-4, -1, 0));
        }
        OverHealCountdown() {
            if (this.hero.Health > 100) {
                if (this.sharedStateVariables.timeInOverHeal > 1000) {
                    this.hero.Health--;
                    this.sharedStateVariables.timeInOverHeal = 0;
                }
            }
        }
    }
    exports.HeroBaseState = HeroBaseState;
});
define("Hero/States/IdleState", ["require", "exports", "Hero/States/HeroBaseState"], function (require, exports, HeroBaseState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IdleState = void 0;
    class IdleState extends HeroBaseState_1.HeroBaseState {
        constructor(hero, spawnProjectile, physicsComponent, damageComponent, sharedStateVariables, animation) {
            super(hero, physicsComponent, damageComponent, spawnProjectile, sharedStateVariables);
            this.animation = animation;
        }
        async UpdateState(delta) {
            if (this.hero.InputSource.Left()) {
                this.movementBehaviour.MoveLeft(delta);
                await this.hero.ChangeState(this.hero.WALK_STATE());
            }
            else if (this.hero.InputSource.Right()) {
                this.movementBehaviour.MoveRight(delta);
                await this.hero.ChangeState(this.hero.WALK_STATE());
            }
            else if (this.hero.InputSource.Jump()) {
                await this.hero.ChangeState(this.hero.JUMP_STATE());
            }
            else if (this.hero.InputSource.Stomp() &&
                this.sharedStateVariables.timeSinceLastStomp > 500 &&
                !this.physicsComponent.OnGround) {
                await this.hero.ChangeState(this.hero.STOMP_STATE());
            }
            if (this.physicsComponent.OnGround && this.sharedStateVariables.dashUsed) {
                this.sharedStateVariables.dashAvailable = true;
                this.sharedStateVariables.dashUsed = false;
            }
        }
        async Enter() {
            this.animation.Stop();
        }
        async Exit() {
            this.animation.Start();
        }
    }
    exports.IdleState = IdleState;
});
define("Hero/States/DashState", ["require", "exports", "Hero/States/HeroBaseState", "gl-matrix"], function (require, exports, HeroBaseState_2, gl_matrix_16) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DashState = void 0;
    class DashState extends HeroBaseState_2.HeroBaseState {
        constructor(hero, spawnProjectile, physicsComponent, damageComponent, dashSound, sharedStateVariables) {
            super(hero, physicsComponent, damageComponent, spawnProjectile, sharedStateVariables);
            this.dashSound = dashSound;
            this.done = false;
        }
        async UpdateState(delta) {
            if (!this.done) {
                this.sharedStateVariables.timeSinceLastDash = 0;
                this.sharedStateVariables.dashAvailable = false;
                this.sharedStateVariables.dashUsed = true;
                this.physicsComponent.AddToExternalForce(gl_matrix_16.vec3.fromValues(0.08 * this.hero.FacingDirection[0], 0, 0));
                const pitch = 0.8 + Math.random() * (1.25 - 0.8);
                await this.dashSound.Play(pitch);
                this.done = true;
            }
            if (this.sharedStateVariables.timeSinceLastDash > 300) {
                await this.hero.ChangeState(this.hero.IDLE_STATE());
            }
        }
        async Enter() {
            this.physicsComponent.DisableGravity();
            this.physicsComponent.ResetVerticalVelocity();
        }
        async Exit() {
            this.physicsComponent.EnableGravity();
        }
    }
    exports.DashState = DashState;
});
define("Hero/States/StompState", ["require", "exports", "Hero/States/HeroBaseState", "gl-matrix"], function (require, exports, HeroBaseState_3, gl_matrix_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StompState = void 0;
    class StompState extends HeroBaseState_3.HeroBaseState {
        constructor(hero, spawnProjectile, physicsComponent, damageComponent, stompSound, sharedStateVariables, landSound) {
            super(hero, physicsComponent, damageComponent, spawnProjectile, sharedStateVariables);
            this.stompSound = stompSound;
            this.landSound = landSound;
        }
        async UpdateState(delta) {
            if (this.physicsComponent.OnGround) {
                if (gl_matrix_17.vec3.squaredLength(this.physicsComponent.Velocity) < 0.00001) {
                    await this.hero.ChangeState(this.hero.IDLE_STATE());
                    this.sharedStateVariables.dashAvailable = true;
                    await this.landSound.Play(1.8, 0.5);
                }
            }
        }
        async Enter() {
            // using Enter() so we only run this part of the code once
            this.physicsComponent.AddToExternalForce(gl_matrix_17.vec3.fromValues(0, 0.05, 0));
            this.sharedStateVariables.timeSinceLastStomp = 0;
            const pitch = 0.8 + Math.random() * (1.25 - 0.8);
            await this.stompSound.Play(pitch);
        }
        async Exit() {
        }
    }
    exports.StompState = StompState;
});
define("Hero/States/AfterStompState", ["require", "exports", "Hero/States/HeroBaseState", "gl-matrix"], function (require, exports, HeroBaseState_4, gl_matrix_18) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AfterStompState = void 0;
    class AfterStompState extends HeroBaseState_4.HeroBaseState {
        constructor(hero, spawnProjectile, physicsComponent, damageComponent, sharedStateVariables) {
            super(hero, physicsComponent, damageComponent, spawnProjectile, sharedStateVariables);
        }
        async UpdateState(delta) {
            this.physicsComponent.AddToExternalForce(gl_matrix_18.vec3.fromValues(0, -0.10, 0));
            await this.hero.ChangeState(this.hero.IDLE_STATE());
        }
        async Enter() {
            return Promise.resolve(undefined);
        }
        async Exit() {
            return Promise.resolve(undefined);
        }
    }
    exports.AfterStompState = AfterStompState;
});
define("Hero/States/JumpState", ["require", "exports", "Hero/States/HeroBaseState", "gl-matrix"], function (require, exports, HeroBaseState_5, gl_matrix_19) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JumpState = void 0;
    // TODO: variable jump height
    class JumpState extends HeroBaseState_5.HeroBaseState {
        constructor(hero, spawnProjectile, jumpSound, landSound, physicsComponent, damageComponent, sharedStateVariables) {
            super(hero, physicsComponent, damageComponent, spawnProjectile, sharedStateVariables);
            this.jumpSound = jumpSound;
            this.landSound = landSound;
            this.remainingJumpTime = 0;
            this.isJumping = false;
            this.wasInAir = false;
        }
        async UpdateState(delta) {
            if (this.isJumping && this.remainingJumpTime > 0) {
                const force = gl_matrix_19.vec3.fromValues(0, -0.013, 0);
                const jDelta = Math.min(this.remainingJumpTime, delta);
                this.physicsComponent.AddToExternalForce(force);
                this.remainingJumpTime -= jDelta;
                if (this.remainingJumpTime <= 0 && this.physicsComponent.OnGround) {
                    this.isJumping = false;
                }
            }
            if (this.hero.InputSource.Left()) {
                this.movementBehaviour.MoveLeft(delta);
            }
            else if (this.hero.InputSource.Right()) {
                this.movementBehaviour.MoveRight(delta);
            }
            if (this.hero.InputSource.Dash()) {
                if (this.sharedStateVariables.timeSinceLastDash > 300 && this.sharedStateVariables.dashAvailable) {
                    await this.hero.ChangeState(this.hero.DASH_STATE());
                }
            }
            if (this.hero.InputSource.Stomp() &&
                this.sharedStateVariables.timeSinceLastStomp > 500) {
                await this.hero.ChangeState(this.hero.STOMP_STATE());
            }
            if (this.physicsComponent.OnGround) {
                if ((this.wasInAir)) {
                    await this.hero.ChangeState(this.hero.IDLE_STATE());
                    this.wasInAir = false;
                    this.isJumping = false;
                    await this.landSound.Play(1.8, 0.5);
                }
            }
            else {
                this.wasInAir = true;
            }
        }
        async Enter() {
            this.remainingJumpTime = 150;
            await this.jumpSound.Play();
            this.isJumping = true;
        }
        async Exit() {
        }
    }
    exports.JumpState = JumpState;
});
define("Hero/States/WalkState", ["require", "exports", "Hero/States/HeroBaseState"], function (require, exports, HeroBaseState_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalkState = void 0;
    class WalkState extends HeroBaseState_6.HeroBaseState {
        constructor(hero, spawnProjectile, animation, physicsComponent, damageComponent, walkSound, sharedStateVariables) {
            super(hero, physicsComponent, damageComponent, spawnProjectile, sharedStateVariables);
            this.animation = animation;
            this.walkSound = walkSound;
        }
        async Enter() {
        }
        async Exit() {
        }
        async UpdateState(delta) {
            if (this.hero.InputSource.Left()) {
                this.movementBehaviour.MoveLeft(delta);
            }
            else if (this.hero.InputSource.Right()) {
                this.movementBehaviour.MoveRight(delta);
            }
            else {
                await this.hero.ChangeState(this.hero.IDLE_STATE());
            }
            if (this.hero.InputSource.Dash()) {
                if (this.sharedStateVariables.timeSinceLastDash > 300 && this.sharedStateVariables.dashAvailable) {
                    await this.hero.ChangeState(this.hero.DASH_STATE());
                }
            }
            if (this.hero.InputSource.Jump()) {
                await this.hero.ChangeState(this.hero.JUMP_STATE());
            }
            await this.PlayWalkSounds();
        }
        async PlayWalkSounds() {
            if (this.hero.IsWalking && this.physicsComponent.OnGround) {
                await this.walkSound.Play(1.8, 0.8);
            }
        }
    }
    exports.WalkState = WalkState;
});
define("Hero/Hero", ["require", "exports", "gl-matrix", "Shader", "Sprite", "TexturePool", "Utils", "BoundingBox", "SoundEffectPool", "SpriteRenderer", "Environment", "Components/Animation", "Components/PhysicsComponent", "Hero/States/DeadState", "Components/Input/PlayerControlSource", "Components/Input/InputSource", "Components/Input/ScriptControlSource", "Components/FlashOverlayComponent", "Components/DamageComponent", "Hero/States/IdleState", "Hero/States/DashState", "Hero/States/StompState", "Hero/States/AfterStompState", "Hero/States/JumpState", "Hero/States/WalkState"], function (require, exports, gl_matrix_20, Shader_4, Sprite_6, TexturePool_3, Utils_5, BoundingBox_5, SoundEffectPool_2, SpriteRenderer_2, Environment_7, Animation_2, PhysicsComponent_2, DeadState_2, PlayerControlSource_1, InputSource_1, ScriptControlSource_1, FlashOverlayComponent_1, DamageComponent_1, IdleState_1, DashState_1, StompState_1, AfterStompState_1, JumpState_1, WalkState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Hero = void 0;
    class Hero {
        IDLE_STATE() {
            return new IdleState_1.IdleState(this, this.SpawnProjectile, this.physicsComponent, this.damageComponent, this.sharedStateVariables, this.animation);
        }
        WALK_STATE() {
            return new WalkState_1.WalkState(this, this.SpawnProjectile, this.animation, this.physicsComponent, this.damageComponent, this.walkSound, this.sharedStateVariables);
        }
        JUMP_STATE() {
            return new JumpState_1.JumpState(this, this.SpawnProjectile, this.jumpSound, this.landSound, this.physicsComponent, this.damageComponent, this.sharedStateVariables);
        }
        DASH_STATE() {
            return new DashState_1.DashState(this, this.SpawnProjectile, this.physicsComponent, this.damageComponent, this.stompSound, this.sharedStateVariables);
        }
        STOMP_STATE() {
            return new StompState_1.StompState(this, this.SpawnProjectile, this.physicsComponent, this.damageComponent, this.stompSound, this.sharedStateVariables, this.landSound);
        }
        DEAD_STATE() {
            return new DeadState_2.DeadState(this, this.onDeath, this.dieSound, this.sharedStateVariables, this.animation);
        }
        AFTER_STOMP_STATE() {
            return new AfterStompState_1.AfterStompState(this, this.SpawnProjectile, this.physicsComponent, this.damageComponent, this.sharedStateVariables);
        }
        SetAnimationFrameset(name) {
            this.currentFrameSet = this.framesets[name];
        }
        // http://www.davetech.co.uk/gamedevplatformer
        // TODO: buffer jump -- can jump if pressed jump right before landing
        // TODO: coyote time -- can jump for little time after falling
        // TODO: double jump
        // TODO: longer range but much slower attack
        get BoundingBox() {
            if (this.StateClass !== StompState_1.StompState.name) {
                const bbPosition = gl_matrix_20.vec3.add(gl_matrix_20.vec3.create(), this.position, this.bbOffset);
                return new BoundingBox_5.BoundingBox(bbPosition, this.bbSize);
            }
            else {
                const bbPosition = gl_matrix_20.vec3.add(gl_matrix_20.vec3.create(), this.position, gl_matrix_20.vec3.fromValues(0.75, 1.0, 0));
                return new BoundingBox_5.BoundingBox(bbPosition, gl_matrix_20.vec2.fromValues(1.5, 2));
            }
        }
        get CollectedCoins() {
            return this.collectedCoins;
        }
        IncrementCollectedCoins() {
            this.collectedCoins++;
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
        get InputSource() {
            return this.input;
        }
        TakeoverControl() {
            const scriptInput = new InputSource_1.InputSource();
            this.input = new ScriptControlSource_1.ScriptControlSource(scriptInput);
            return scriptInput;
        }
        ReleaseControl() {
            this.input = new PlayerControlSource_1.PlayerControlSource(this.keyHandler, this.gamepadHandler);
        }
        set Speed(value) {
            this.speed = value;
        }
        get Speed() {
            return this.speed;
        }
        get FacingDirection() {
            return this.lastFacingDirection;
        }
        get Position() {
            return this.position;
        }
        get CenterPosition() {
            return gl_matrix_20.vec3.fromValues(this.position[0] + this.visualScale[0] / 2, this.position[1] + this.visualScale[1] / 2, 0);
        }
        get IsWalking() {
            return gl_matrix_20.vec3.distance(this.Position, this.lastPosition) > 0.0005;
        }
        get StateClass() {
            return this.internalState.constructor.name;
        }
        constructor(position, visualScale, collider, onDeath, SpawnProjectile, shader, bbShader, jumpSound, landSound, walkSound, stompSound, damageSound, dieSound, texture, keyHandler, gamepadHandler) {
            this.position = position;
            this.visualScale = visualScale;
            this.collider = collider;
            this.onDeath = onDeath;
            this.SpawnProjectile = SpawnProjectile;
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
            // TODO: make bb variables parametrizable
            this.bbOffset = gl_matrix_20.vec3.fromValues(1.2, 1.1, 0);
            this.bbSize = gl_matrix_20.vec2.fromValues(0.8, 1.8);
            this.invincibleFrames = 15;
            this.sharedStateVariables = {
                timeSinceLastDash: 500,
                dashAvailable: true,
                dashUsed: false,
                timeSinceLastStomp: 500,
                bbOffset: this.bbOffset,
                bbSize: this.bbSize,
                rotation: 0,
                timeSinceLastMeleeAttack: 0,
                timeInOverHeal: 0
            };
            this.health = 100;
            this.collectedCoins = 0;
            this.bbSprite = new Sprite_6.Sprite(Utils_5.Utils.DefaultSpriteVertices, Utils_5.Utils.DefaultSpriteTextureCoordinates);
            this.lastPosition = gl_matrix_20.vec3.fromValues(0, 0, 1);
            this.leftFacingAnimationFrames = [
                gl_matrix_20.vec2.fromValues(0.0 / 12.0, 3.0 / 8.0),
                gl_matrix_20.vec2.fromValues(1.0 / 12.0, 3.0 / 8.0),
                gl_matrix_20.vec2.fromValues(2.0 / 12.0, 3.0 / 8.0)
            ];
            this.rightFacingAnimationFrames = [
                gl_matrix_20.vec2.fromValues(0.0 / 12.0, 1.0 / 8.0),
                gl_matrix_20.vec2.fromValues(1.0 / 12.0, 1.0 / 8.0),
                gl_matrix_20.vec2.fromValues(2.0 / 12.0, 1.0 / 8.0)
            ];
            this.framesets = {
                "left_walk": this.leftFacingAnimationFrames,
                "right_walk": this.rightFacingAnimationFrames
            };
            this.currentFrameSet = this.rightFacingAnimationFrames;
            this.DEFAULT_SPEED = 0.00025;
            this.speed = this.DEFAULT_SPEED;
            this.lastFacingDirection = gl_matrix_20.vec3.fromValues(1, 0, 0);
            this.sprite = new Sprite_6.Sprite(Utils_5.Utils.DefaultSpriteVertices, 
            // TODO: parametrize tex coords
            Utils_5.Utils.CreateTextureCoordinates(// texture-offset is added to these coordinates, so it must be (0,0)
            0.0 / 12.0, // These constants are hardcoded with "hero1.png" in mind
            0.0 / 8.0, 1.0 / 12.0, 1.0 / 8.0));
            this.input = new PlayerControlSource_1.PlayerControlSource(this.keyHandler, this.gamepadHandler);
            this.renderer = new SpriteRenderer_2.SpriteRenderer(shader, texture, this.sprite, visualScale);
            this.renderer.TextureOffset = this.currentFrameSet[0];
            this.animation = new Animation_2.Animation(1 / 60 * 8 * 1000, this.renderer);
            const flashOverlayComponent = new FlashOverlayComponent_1.FlashOverlayComponent(this.shader);
            this.bbRenderer = new SpriteRenderer_2.SpriteRenderer(bbShader, null, this.bbSprite, this.bbSize);
            this.bbShader.SetVec4Uniform('clr', gl_matrix_20.vec4.fromValues(1, 0, 0, 0.4));
            this.physicsComponent = new PhysicsComponent_2.PhysicsComponent(position, this.lastPosition, () => this.BoundingBox, this.bbOffset, collider, false, false);
            this.damageComponent = new DamageComponent_1.DamageComponent(this, flashOverlayComponent, this.damageSound, this.physicsComponent, this.invincibleFrames);
            this.internalState = this.IDLE_STATE();
        }
        static async Create(position, visualScale, collider, onDeath, spawnProjectile, keyHandler, gamepadHandler) {
            const shader = await Shader_4.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_4.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const jumpSound = await SoundEffectPool_2.SoundEffectPool.GetInstance().GetAudio('audio/jump.wav');
            const landSound = await SoundEffectPool_2.SoundEffectPool.GetInstance().GetAudio('audio/land.wav', false);
            const walkSound = await SoundEffectPool_2.SoundEffectPool.GetInstance().GetAudio('audio/walk1.wav', false);
            const stompSound = await SoundEffectPool_2.SoundEffectPool.GetInstance().GetAudio('audio/hero_stomp.wav', true);
            const damageSound = await SoundEffectPool_2.SoundEffectPool.GetInstance().GetAudio('audio/hero_damage.wav');
            const dieSound = await SoundEffectPool_2.SoundEffectPool.GetInstance().GetAudio('audio/hero_die.wav', false);
            const texture = await TexturePool_3.TexturePool.GetInstance().GetTexture('textures/hero1.png');
            const hero = new Hero(position, visualScale, collider, onDeath, spawnProjectile, shader, bbShader, jumpSound, landSound, walkSound, stompSound, damageSound, dieSound, texture, keyHandler, gamepadHandler);
            await hero.Initialize();
            return hero;
        }
        Draw(proj, view) {
            this.renderer.Draw(proj, view, this.position, this.sharedStateVariables.rotation);
            // TODO: a megváltozott bb méret nem látszik rajzolásnál mert nem updatelem a rendererben a vertexeket csak a positiont
            // Draw bounding box
            if (Environment_7.Environment.RenderBoundingBoxes) {
                this.bbRenderer.Draw(proj, view, this.BoundingBox.position, this.sharedStateVariables.rotation);
            }
        }
        async Initialize() {
            await this.internalState.Enter();
        }
        async Update(delta) {
            await this.internalState.Update(delta);
            this.animation.Animate(delta, this.currentFrameSet);
            await this.physicsComponent.Update(delta);
        }
        FaceLeft() {
            gl_matrix_20.vec3.set(this.lastFacingDirection, -1, 0, 0);
        }
        FaceRight() {
            gl_matrix_20.vec3.set(this.lastFacingDirection, 1, 0, 0);
        }
        async DamageWithInvincibilityConsidered(pushbackForce, damage) {
            await this.damageComponent.DamageWithInvincibilityConsidered(pushbackForce, damage);
        }
        async Damage(pushbackForce, damage) {
            await this.damageComponent.Damage(pushbackForce, damage);
        }
        Kill() {
            if (this.StateClass !== DeadState_2.DeadState.name) {
                this.Health = 0;
            }
        }
        async ChangeState(state) {
            await this.internalState.Exit();
            this.internalState = state;
            await this.internalState.Enter();
        }
        Dispose() {
            this.renderer.Dispose();
            this.bbRenderer.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
    }
    exports.Hero = Hero;
});
define("LevelEnd", ["require", "exports", "Sprite", "gl-matrix", "BoundingBox", "TexturePool", "Shader", "Utils", "SoundEffectPool", "SpriteRenderer"], function (require, exports, Sprite_7, gl_matrix_21, BoundingBox_6, TexturePool_4, Shader_5, Utils_6, SoundEffectPool_3, SpriteRenderer_3) {
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
            this.size = gl_matrix_21.vec2.fromValues(2, 1);
            this.interacted = false;
            this.sprite = new Sprite_7.Sprite(Utils_6.Utils.DefaultSpriteVertices, Utils_6.Utils.DefaultSpriteTextureCoordinates);
            this.renderer = new SpriteRenderer_3.SpriteRenderer(shader, texture, this.sprite, this.size);
            this.shader.SetFloatUniform('alpha', LevelEnd.transparentValue);
        }
        OnEndConditionsMet() {
            this.enabled = true;
            this.shader.SetFloatUniform('alpha', this.enabled ? 1.0 : LevelEnd.transparentValue);
        }
        OnEndConditionsLost() {
            this.enabled = false;
            this.shader.SetFloatUniform('alpha', this.enabled ? 1.0 : LevelEnd.transparentValue);
        }
        get EndCondition() {
            return false;
        }
        set Interacted(interacted) {
            this.interacted = interacted;
        }
        async CollideWithAttack(attack) {
            // NO-OP
        }
        get BoundingBox() {
            return new BoundingBox_6.BoundingBox(this.position, gl_matrix_21.vec2.fromValues(this.size[0], this.size[1]));
        }
        static async Create(position, interactCallback, level) {
            const shader = await Shader_5.Shader.Create('shaders/VertexShader.vert', 'shaders/Transparent.frag');
            const endReachedEffect = await SoundEffectPool_3.SoundEffectPool.GetInstance().GetAudio('audio/ding.wav', false);
            const texture = await TexturePool_4.TexturePool.GetInstance().GetTexture('textures/exit.png');
            return new LevelEnd(position, shader, endReachedEffect, texture, interactCallback, level);
        }
        Draw(projection, view) {
            this.renderer.Draw(projection, view, this.position, 0);
        }
        async Update(delta) {
        }
        IsCollidingWith(boundingBox) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        async Visit(hero) {
            if (this.enabled && !this.interacted) {
                this.level.updateDisabled = true; // pause level updates
                await this.endReachedEffect.Play(1, 1, async () => {
                    /**
                     * Wait for the sound effect to play then restart level update loop.
                    */
                    this.interacted = true;
                    await this.interactCallback();
                });
            }
        }
        Dispose() {
            this.renderer.Dispose();
            this.shader.Delete();
        }
    }
    exports.LevelEnd = LevelEnd;
    LevelEnd.transparentValue = 0.5;
});
define("Enemies/IEnemy", ["require", "exports", "gl-matrix", "BoundingBox", "Sprite", "Utils", "Environment", "SpriteRenderer"], function (require, exports, gl_matrix_22, BoundingBox_7, Sprite_8, Utils_7, Environment_8, SpriteRenderer_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnemyBase = void 0;
    class EnemyBase {
        constructor(shader, sprite, texture, bbShader, bbSize, bbOffset, position, visualScale, health) {
            this.shader = shader;
            this.sprite = sprite;
            this.texture = texture;
            this.bbShader = bbShader;
            this.bbSize = bbSize;
            this.bbOffset = bbOffset;
            this.position = position;
            this.visualScale = visualScale;
            this.health = health;
            this.bbSprite = new Sprite_8.Sprite(Utils_7.Utils.DefaultSpriteVertices, Utils_7.Utils.DefaultSpriteTextureCoordinates);
            this.renderer = new SpriteRenderer_4.SpriteRenderer(shader, texture, sprite, visualScale);
            this.bbRenderer = new SpriteRenderer_4.SpriteRenderer(bbShader, null, this.bbSprite, bbSize);
            bbShader.SetVec4Uniform('clr', gl_matrix_22.vec4.fromValues(1, 0, 0, 0.4));
        }
        Draw(proj, view) {
            this.renderer.Draw(proj, view, this.position, 0);
            // Bounding box drawing
            if (Environment_8.Environment.RenderBoundingBoxes) {
                this.bbRenderer.Draw(proj, view, this.BoundingBox.position, 0);
            }
        }
        get BoundingBox() {
            return new BoundingBox_7.BoundingBox(gl_matrix_22.vec3.add(gl_matrix_22.vec3.create(), this.position, this.bbOffset), this.bbSize);
        }
        async CollideWithAttack(attack) {
            await this.Damage(attack.PushbackForce, 1);
        }
        Dispose() {
            this.renderer.Dispose();
            this.bbRenderer.Dispose();
        }
        ;
        get Health() {
            return this.health;
        }
        set Health(health) {
            this.health = health;
        }
        IsCollidingWith(boundingBox) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        get Position() {
            return this.position;
        }
    }
    exports.EnemyBase = EnemyBase;
});
define("Enemies/Dragon/States/SharedDragonStateVariables", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedDragonStateVariables = void 0;
    class SharedDragonStateVariables {
        constructor() {
            this.timeSinceLastCharge = 9999;
            this.timeSinceLastAttack = 0;
            this.timeSinceLastFireBall = 0;
        }
    }
    exports.SharedDragonStateVariables = SharedDragonStateVariables;
});
define("Projectiles/BiteProjectile", ["require", "exports", "gl-matrix", "Shader", "Sprite", "TexturePool", "Utils", "SoundEffectPool", "Projectiles/ProjectileBase", "Components/Animation", "ICollider"], function (require, exports, gl_matrix_23, Shader_6, Sprite_9, TexturePool_5, Utils_8, SoundEffectPool_4, ProjectileBase_2, Animation_3, ICollider_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BiteProjectile = void 0;
    /**
     * A stationary projectile that attacks the player
     */
    class BiteProjectile extends ProjectileBase_2.ProjectileBase {
        constructor(position, facingDirection, shader, bbShader, biteDamageSound, texture) {
            const sprite = new Sprite_9.Sprite(Utils_8.Utils.DefaultSpriteVertices, Utils_8.Utils.CreateTextureCoordinates(0 / 5, 0 / 2, 1 / 5, 1 / 2));
            const bbSize = gl_matrix_23.vec2.fromValues(2.0, 2.0);
            const spriteVisualScale = gl_matrix_23.vec2.fromValues(5, 5);
            const bbOffset = facingDirection[0] > 0 ?
                gl_matrix_23.vec3.fromValues(spriteVisualScale[0] - bbSize[0] - 1.25, 1.25, 0) : // left box
                gl_matrix_23.vec3.fromValues(1.25, 1.25, 0); // right box
            const animationMustComplete = true;
            super(shader, texture, sprite, position, spriteVisualScale, bbOffset, bbSize, null, animationMustComplete, new ICollider_2.NullCollider(), bbShader);
            this.facingDirection = facingDirection;
            this.biteDamageSound = biteDamageSound;
            // TODO: flip texture, to achieve left and right facing bite attack
            this.currentFrameSet = [
                gl_matrix_23.vec2.fromValues(0 / 5, 0 / 2),
                gl_matrix_23.vec2.fromValues(1 / 5, 0 / 2),
                gl_matrix_23.vec2.fromValues(0 / 5, 1 / 2),
                gl_matrix_23.vec2.fromValues(1 / 5, 1 / 2),
            ];
            this.animation = new Animation_3.Animation(64, this.renderer);
        }
        static async Create(position, facingDirection) {
            const shader = await Shader_6.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_6.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const biteDamageSound = await SoundEffectPool_4.SoundEffectPool.GetInstance().GetAudio('audio/bite.wav');
            const texture = await TexturePool_5.TexturePool.GetInstance().GetTexture('textures/fang.png');
            return new BiteProjectile(position, facingDirection, shader, bbShader, biteDamageSound, texture);
        }
        async OnHit() {
            await this.biteDamageSound.Play();
            this.alreadyHit = true;
        }
        get PushbackForce() {
            const damagePushback = gl_matrix_23.vec3.scale(gl_matrix_23.vec3.create(), this.facingDirection, -0.01);
            damagePushback[1] -= 0.01;
            return damagePushback;
        }
        async Update(delta) {
            const animationFinished = this.animation.Animate(delta, this.currentFrameSet);
            if (animationFinished) {
                this.OnHitListeners.forEach(l => l.RemoveGameObject(this));
            }
            // TODO: do not damage hero right after animation has started, but wait a little (spawn bb out of bounds, then move it to the correct position)
        }
        IsCollidingWith(boundingBox) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        Dispose() {
            super.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
    }
    exports.BiteProjectile = BiteProjectile;
});
define("Enemies/Dragon/States/DragonStateBase", ["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_24) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DragonStateBase = void 0;
    class DragonStateBase {
        constructor(hero, dragon) {
            this.hero = hero;
            this.dragon = dragon;
        }
        /**
         * Follow hero on the Y axis with a little delay.
         * "Delay" is achieved by moving the dragon slower than the hero movement speed.
         */
        MatchHeroHeight(delta) {
            // Reduce shaking by only moving when the distance is larger than a limit
            const distance = Math.abs(this.hero.CenterPosition[1] - this.dragon.CenterPosition[1]);
            if (distance > 0.2) {
                const dir = gl_matrix_24.vec3.sub(gl_matrix_24.vec3.create(), this.dragon.CenterPosition, this.hero.CenterPosition);
                if (dir[1] > 0) {
                    this.dragon.Move(gl_matrix_24.vec3.fromValues(0, -0.00004, 0), delta);
                }
                else if (dir[1] < 0) {
                    this.dragon.Move(gl_matrix_24.vec3.fromValues(0, 0.00004, 0), delta);
                }
            }
        }
    }
    exports.DragonStateBase = DragonStateBase;
});
define("Enemies/Dragon/States/IdleState", ["require", "exports", "gl-matrix", "Projectiles/BiteProjectile", "Enemies/Dragon/States/DragonStateBase"], function (require, exports, gl_matrix_25, BiteProjectile_1, DragonStateBase_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IdleState = void 0;
    /**
     * The default state for the dragon behaviour.
     * If the hero is near enough then the dragon can bite him.
     * If the hero is far away then the dragon will spit fireballs at him.
     * Can transition to {@link RushState} if distance to hero is between 5 and 20 and there were enough time since the last rush attack
     */
    class IdleState extends DragonStateBase_1.DragonStateBase {
        constructor(hero, dragon, collider, biteAttackSound, spawnProjectile, shared) {
            super(hero, dragon);
            this.collider = collider;
            this.biteAttackSound = biteAttackSound;
            this.spawnProjectile = spawnProjectile;
            this.shared = shared;
        }
        async Update(delta) {
            const distance = gl_matrix_25.vec3.distance(this.dragon.CenterPosition, this.hero.CenterPosition);
            // Bite when the hero is near
            if (this.shared.timeSinceLastAttack > 2000) {
                this.shared.timeSinceLastAttack = 0;
                // Bite
                if (distance < 3.0) {
                    this.dragon.ResetVelocity();
                    const projectilePosition = this.dragon.BiteProjectilePosition;
                    const bite = await BiteProjectile_1.BiteProjectile.Create(projectilePosition, this.dragon.FacingDirection);
                    await this.biteAttackSound.Play();
                    this.spawnProjectile(this.dragon, bite);
                }
            }
            // Random chance to change into a different state
            const chance = Math.random();
            if (chance > 0.25 && chance < 0.30) {
                // Idle => fly state
                await this.dragon.ChangeState(this.dragon.FLY_ATTACK_STATE());
                return;
            }
            else if (chance > 0.30 && chance < 0.35) {
                // idle => rush state
                await this.dragon.ChangeState(this.dragon.RUSH_STATE());
                return;
            }
            else if (chance > 0.35) {
                await this.dragon.ChangeState(this.dragon.GROUND_ATTACK_STATE());
                return;
            }
        }
        async Enter() {
            // Do nothing
        }
        async Exit() {
            // Do nothing
        }
    }
    exports.IdleState = IdleState;
});
define("Enemies/Dragon/States/RushStates/StartState", ["require", "exports", "Enemies/Dragon/States/DragonStateBase"], function (require, exports, DragonStateBase_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartState = void 0;
    class StartState extends DragonStateBase_2.DragonStateBase {
        constructor(hero, dragon, context) {
            super(hero, dragon);
            this.context = context;
        }
        async Enter() {
            // do nothing
        }
        async Exit() {
            // do nothing
        }
        async Update(delta) {
            await this.context.ChangeState(this.context.BACKING_STATE());
            this.MatchHeroHeight(delta);
        }
    }
    exports.StartState = StartState;
});
define("Enemies/Dragon/States/RushStates/BackingState", ["require", "exports", "gl-matrix", "Enemies/Dragon/States/DragonStateBase"], function (require, exports, gl_matrix_26, DragonStateBase_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackingState = void 0;
    class BackingState extends DragonStateBase_3.DragonStateBase {
        constructor(hero, dragon, context, backingStartSound) {
            super(hero, dragon);
            this.context = context;
            this.backingStartSound = backingStartSound;
            this.timeInBacking = 0;
        }
        async Update(delta) {
            this.timeInBacking += delta;
            const dir = gl_matrix_26.vec3.sub(gl_matrix_26.vec3.create(), this.dragon.CenterPosition, this.hero.CenterPosition);
            if (dir[0] > 0) {
                this.dragon.Move(gl_matrix_26.vec3.fromValues(0.000475, 0, 0), delta);
            }
            else if (dir[0] < 0) {
                this.dragon.Move(gl_matrix_26.vec3.fromValues(-0.000475, 0, 0), delta);
            }
            if (this.timeInBacking > 1500 ||
                (gl_matrix_26.vec3.distance(this.dragon.CenterPosition, this.hero.CenterPosition) > 15 &&
                    this.timeInBacking > 500)) {
                this.timeInBacking = 0;
                await this.context.ChangeState(this.context.CHARGE_STATE());
            }
            this.MatchHeroHeight(delta);
        }
        async Enter() {
            this.dragon.SignalAttack();
            this.timeInBacking = 0;
            await this.backingStartSound.Play(1.0, 0.3);
        }
        async Exit() {
            this.timeInBacking = 0;
        }
    }
    exports.BackingState = BackingState;
});
define("Enemies/Dragon/States/RushStates/ChargeState", ["require", "exports", "gl-matrix", "Enemies/Dragon/States/DragonStateBase"], function (require, exports, gl_matrix_27, DragonStateBase_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChargeState = void 0;
    class ChargeState extends DragonStateBase_4.DragonStateBase {
        constructor(hero, dragon, context, rushSound, shared) {
            super(hero, dragon);
            this.context = context;
            this.rushSound = rushSound;
            this.shared = shared;
        }
        async Update(delta) {
            this.shared.timeSinceLastAttack = 0;
            this.shared.timeSinceLastCharge = 0;
            const dir = gl_matrix_27.vec3.sub(gl_matrix_27.vec3.create(), this.dragon.CenterPosition, this.hero.CenterPosition);
            if (dir[0] > 0) {
                this.dragon.Move(gl_matrix_27.vec3.fromValues(-0.0002, 0, 0), delta);
            }
            else if (dir[0] < 0) {
                this.dragon.Move(gl_matrix_27.vec3.fromValues(0.0002, 0, 0), delta);
            }
            // Move out of charge state when distance on the Y axis is close enough
            const distanceOnX = Math.abs(this.dragon.CenterPosition[0] - this.hero.CenterPosition[0]);
            if (distanceOnX < 3) {
                await this.context.ChangeState(this.context.PREATTACK_STATE());
            }
        }
        async Enter() {
            await this.rushSound.Play();
        }
        async Exit() {
            // Do nothing
        }
    }
    exports.ChargeState = ChargeState;
});
define("Enemies/Dragon/States/RushStates/PreAttackState", ["require", "exports", "Enemies/Dragon/States/DragonStateBase"], function (require, exports, DragonStateBase_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreAttackState = void 0;
    class PreAttackState extends DragonStateBase_5.DragonStateBase {
        constructor(hero, dragon, context) {
            super(hero, dragon);
            this.context = context;
            this.timeInPreAttack = 0;
        }
        async Update(delta) {
            // The charge is completed but we wait a couple of frames before executing an attack
            this.timeInPreAttack += delta;
            if (this.timeInPreAttack > 96) {
                this.timeInPreAttack = 0;
                await this.context.ChangeState(this.context.ATTACK_STATE());
            }
            this.MatchHeroHeight(delta);
        }
        async Enter() {
            this.timeInPreAttack = 0;
        }
        async Exit() {
            // Do nothing
        }
    }
    exports.PreAttackState = PreAttackState;
});
define("Enemies/Dragon/States/RushStates/AttackState", ["require", "exports", "gl-matrix", "Projectiles/BiteProjectile", "Enemies/Dragon/States/DragonStateBase"], function (require, exports, gl_matrix_28, BiteProjectile_2, DragonStateBase_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AttackState = void 0;
    class AttackState extends DragonStateBase_6.DragonStateBase {
        constructor(hero, dragon, context, biteAttackSound, spawnProjectile, shared) {
            super(hero, dragon);
            this.context = context;
            this.biteAttackSound = biteAttackSound;
            this.spawnProjectile = spawnProjectile;
            this.shared = shared;
        }
        async Update(delta) {
            // Spawn a bite projectile
            // This is handled differently from the normal attack, when the hero remains close
            this.dragon.ResetVelocity();
            const projectilePosition = this.dragon.BiteProjectilePosition;
            const bite = await BiteProjectile_2.BiteProjectile.Create(projectilePosition, gl_matrix_28.vec3.clone(this.dragon.FacingDirection));
            await this.biteAttackSound.Play();
            this.spawnProjectile(this.dragon, bite);
            await this.dragon.ChangeState(this.dragon.IDLE_STATE());
            this.shared.timeSinceLastAttack = 0;
            return;
        }
        async Enter() {
            // Do nothing
        }
        async Exit() {
            // Do nothing
        }
    }
    exports.AttackState = AttackState;
});
define("Enemies/Dragon/States/RushStates/RushState", ["require", "exports", "Enemies/Dragon/States/DragonStateBase", "Enemies/Dragon/States/RushStates/StartState", "Enemies/Dragon/States/RushStates/BackingState", "Enemies/Dragon/States/RushStates/ChargeState", "Enemies/Dragon/States/RushStates/PreAttackState", "Enemies/Dragon/States/RushStates/AttackState"], function (require, exports, DragonStateBase_7, StartState_1, BackingState_1, ChargeState_1, PreAttackState_1, AttackState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RushState = void 0;
    class RushState extends DragonStateBase_7.DragonStateBase {
        constructor(hero, dragon, rushSound, backingStartSound, biteAttackSound, spawnProjectile, shared) {
            super(hero, dragon);
            this.rushSound = rushSound;
            this.backingStartSound = backingStartSound;
            this.biteAttackSound = biteAttackSound;
            this.spawnProjectile = spawnProjectile;
            this.shared = shared;
            this.START_STATE = () => new StartState_1.StartState(this.hero, this.dragon, this);
            this.BACKING_STATE = () => new BackingState_1.BackingState(this.hero, this.dragon, this, this.backingStartSound);
            this.CHARGE_STATE = () => new ChargeState_1.ChargeState(this.hero, this.dragon, this, this.rushSound, this.shared);
            this.PREATTACK_STATE = () => new PreAttackState_1.PreAttackState(this.hero, this.dragon, this);
            this.ATTACK_STATE = () => new AttackState_1.AttackState(this.hero, this.dragon, this, this.biteAttackSound, this.spawnProjectile, this.shared);
            this.internalState = this.START_STATE();
        }
        async ChangeState(state) {
            await this.internalState.Exit();
            this.internalState = state;
            await this.internalState.Enter();
        }
        async Update(delta) {
            await this.internalState.Update(delta);
        }
        async Enter() {
            this.internalState = this.START_STATE();
        }
        async Exit() {
            // Do nothing
        }
    }
    exports.RushState = RushState;
});
define("Enemies/Dragon/States/FlyAttackStates/ReachAltitudeState", ["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_29) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReachAltitudeState = void 0;
    class ReachAltitudeState {
        constructor(context, dragon) {
            this.context = context;
            this.dragon = dragon;
        }
        async Update(delta) {
            // fly up
            const destinationHeight = 6;
            const verticalDistance = destinationHeight - this.dragon.CenterPosition[1];
            if (verticalDistance < -0.01) {
                this.dragon.Move(gl_matrix_29.vec3.fromValues(0, -0.0001, 0), delta);
            }
            else {
                await this.context.ChangeState(this.context.SWEEPING_STATE());
            }
        }
        async Enter() {
        }
        async Exit() {
        }
    }
    exports.ReachAltitudeState = ReachAltitudeState;
});
define("Projectiles/Firebomb", ["require", "exports", "gl-matrix", "Projectiles/ProjectileBase", "Shader", "SoundEffectPool", "TexturePool", "Sprite", "Utils"], function (require, exports, gl_matrix_30, ProjectileBase_3, Shader_7, SoundEffectPool_5, TexturePool_6, Sprite_10, Utils_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Firebomb = void 0;
    class Firebomb extends ProjectileBase_3.ProjectileBase {
        constructor(shader, texture, position, bbShader, hitSound, spawnSound, despawnSound, collider) {
            const sprite = new Sprite_10.Sprite(Utils_9.Utils.DefaultSpriteVertices, Utils_9.Utils.DefaultSpriteTextureCoordinates);
            const visualScale = gl_matrix_30.vec2.fromValues(0.85, 0.85);
            const bbOffset = gl_matrix_30.vec3.fromValues(0, 0, 0);
            const bbSize = gl_matrix_30.vec2.fromValues(0.85, 0.85);
            super(shader, texture, sprite, position, visualScale, bbOffset, bbSize, hitSound, false, collider, bbShader);
            this.spawnSound = spawnSound;
            this.despawnSound = despawnSound;
            this.moveDirection = gl_matrix_30.vec3.scale(gl_matrix_30.vec3.create(), gl_matrix_30.vec3.fromValues(0, 1, 0), 0.0001);
            this.spawnSoundPlayed = false;
        }
        static async Create(position, collider) {
            const shader = await Shader_7.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_7.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const hitSound = await SoundEffectPool_5.SoundEffectPool.GetInstance().GetAudio('audio/hero_stomp.wav');
            const spawnSound = await SoundEffectPool_5.SoundEffectPool.GetInstance().GetAudio('audio/fireball_spawn.mp3');
            const despawnSound = await SoundEffectPool_5.SoundEffectPool.GetInstance().GetAudio('audio/enemy_damage.wav');
            const texture = await TexturePool_6.TexturePool.GetInstance().GetTexture('textures/firebomb.png');
            return new Firebomb(shader, texture, position, bbShader, hitSound, spawnSound, despawnSound, collider);
        }
        get PushbackForce() {
            return gl_matrix_30.vec3.create();
        }
        ;
        async Update(delta) {
            await super.Update(delta);
            if (!this.spawnSoundPlayed) {
                await this.spawnSound.Play(1, 0.5);
                this.spawnSoundPlayed = true;
            }
            await this.Move(this.moveDirection, delta);
            if (this.AlreadyHit) {
                this.OnHitListeners.forEach(l => l.RemoveGameObject(this));
            }
        }
        Dispose() {
            super.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
        async CollideWithAttack(attack) {
            if (!this.AlreadyHit) {
                await this.despawnSound.Play();
                await this.OnHit();
            }
        }
    }
    exports.Firebomb = Firebomb;
});
define("Enemies/Dragon/States/FlyAttackStates/SweepingState", ["require", "exports", "gl-matrix", "Projectiles/Firebomb"], function (require, exports, gl_matrix_31, Firebomb_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SweepingState = void 0;
    class SweepingState {
        constructor(context, dragon, spawnProjectile, collider, shared) {
            this.context = context;
            this.dragon = dragon;
            this.spawnProjectile = spawnProjectile;
            this.collider = collider;
            this.shared = shared;
            this.dir = gl_matrix_31.vec3.fromValues(-0.00010, 0, 0);
        }
        async Update(delta) {
            // left-right movement
            // change direction on collision
            if (this.dragon.WillCollide(this.dir, delta)) {
                this.dragon.ResetVelocity();
                this.dir = gl_matrix_31.vec3.fromValues(this.dir[0] * -1, 0, 0);
            }
            this.dragon.Move(this.dir, delta);
            // spit fireballs while sweeping
            const variance = 1500 + Math.random() * 1000; // 1500-2500
            if (this.shared.timeSinceLastFireBall > variance) {
                this.shared.timeSinceLastFireBall = 0;
                const fireball = await Firebomb_1.Firebomb.Create(this.dragon.FireBallProjectileSpawnPosition, this.collider);
                this.spawnProjectile(this.dragon, fireball);
            }
            const randomTrigger = Math.random();
            if (randomTrigger < 0.01) {
                await this.context.ChangeState(this.context.PRE_FLY_ATTACK_STATE());
            }
        }
        async Enter() {
        }
        async Exit() {
        }
    }
    exports.SweepingState = SweepingState;
});
define("Enemies/Dragon/States/FlyAttackStates/SharedFlyAttackVariables", ["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_32) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedFlyAttackVariables = void 0;
    class SharedFlyAttackVariables {
        constructor() {
            this.savedHeroPosition = gl_matrix_32.vec3.create();
        }
    }
    exports.SharedFlyAttackVariables = SharedFlyAttackVariables;
});
define("Enemies/Dragon/States/FlyAttackStates/PreFlyAttackState", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreFlyAttackState = void 0;
    /**
     * This state is used to signal an attack before executing the fly attack
     */
    class PreFlyAttackState {
        constructor(context, dragon, hero, attackSignal, sharedFlyAttackVariables) {
            this.context = context;
            this.dragon = dragon;
            this.hero = hero;
            this.attackSignal = attackSignal;
            this.sharedFlyAttackVariables = sharedFlyAttackVariables;
            this.timeSignalingAttack = 0;
        }
        async Update(delta) {
            this.timeSignalingAttack += delta;
            // Wait a few frames after the signal before attacking
            // save hero position before attacking
            if (this.timeSignalingAttack > 10 / 60 * 1000) {
                this.sharedFlyAttackVariables.savedHeroPosition = this.hero.CenterPosition;
                // move to fly attack
                this.timeSignalingAttack = 0;
                await this.context.ChangeState(this.context.FLY_ATTACK_STATE());
            }
        }
        async Enter() {
            this.dragon.SignalAttack();
        }
        async Exit() {
            await this.attackSignal.Play();
        }
    }
    exports.PreFlyAttackState = PreFlyAttackState;
});
define("Enemies/Dragon/States/FlyAttackStates/AttackState", ["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_33) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AttackState = void 0;
    class AttackState {
        constructor(context, dragon, shared) {
            this.context = context;
            this.dragon = dragon;
            this.shared = shared;
        }
        async Update(delta) {
            // Diagonal attack from above
            // The attack/bite itself is handled by the idle state
            // Move the dragon based on the position of the bite attack
            const attackDirection = gl_matrix_33.vec3.sub(gl_matrix_33.vec3.create(), this.shared.savedHeroPosition, this.dragon.BiteProjectilePosition);
            attackDirection[2] = 0;
            gl_matrix_33.vec3.normalize(attackDirection, attackDirection);
            gl_matrix_33.vec3.scale(attackDirection, attackDirection, 0.0003); // hard coded attack speed
            this.dragon.Move(attackDirection, delta);
            const distanceToRushPosition = gl_matrix_33.vec3.distance(this.shared.savedHeroPosition, this.dragon.CenterPosition);
            if (distanceToRushPosition < 2.0 || this.dragon.WillCollide(attackDirection, delta)) {
                await this.dragon.ChangeState(this.dragon.IDLE_STATE());
                return;
            }
        }
        async Enter() {
        }
        async Exit() {
        }
    }
    exports.AttackState = AttackState;
});
define("Enemies/Dragon/States/FlyAttackStates/FlyAttackState", ["require", "exports", "Enemies/Dragon/States/DragonStateBase", "gl-matrix", "Enemies/Dragon/States/FlyAttackStates/ReachAltitudeState", "Enemies/Dragon/States/FlyAttackStates/SweepingState", "Enemies/Dragon/States/FlyAttackStates/PreFlyAttackState", "Enemies/Dragon/States/FlyAttackStates/AttackState"], function (require, exports, DragonStateBase_8, gl_matrix_34, ReachAltitudeState_1, SweepingState_1, PreFlyAttackState_1, AttackState_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FlyAttackState = void 0;
    // TODO: 125 TODOs in 12/01 on boss_event branch - 77 TODOs on master as of 01/01 - 35 todos on component branch on 07/10
    class FlyAttackState extends DragonStateBase_8.DragonStateBase {
        REACH_ALTITUDE_STATE() {
            return new ReachAltitudeState_1.ReachAltitudeState(this, this.dragon);
        }
        SWEEPING_STATE() {
            return new SweepingState_1.SweepingState(this, this.dragon, this.spawnProjectile, this.collider, this.shared);
        }
        PRE_FLY_ATTACK_STATE() {
            return new PreFlyAttackState_1.PreFlyAttackState(this, this.dragon, this.hero, this.attackSignal, this.sharedFlyAttackVariables);
        }
        FLY_ATTACK_STATE() {
            return new AttackState_2.AttackState(this, this.dragon, this.sharedFlyAttackVariables);
        }
        async ChangeState(state) {
            await this.internalState.Exit();
            this.internalState = state;
            await this.internalState.Enter();
        }
        constructor(hero, dragon, attackSignal, collider, spawnProjectile, shared) {
            super(hero, dragon);
            this.attackSignal = attackSignal;
            this.collider = collider;
            this.spawnProjectile = spawnProjectile;
            this.shared = shared;
            this.internalState = this.REACH_ALTITUDE_STATE();
            this.sharedFlyAttackVariables = {
                savedHeroPosition: gl_matrix_34.vec3.create()
            };
            this.sharedFlyAttackVariables.savedHeroPosition = hero.CenterPosition;
            this.savedHeroPosition = hero.CenterPosition;
        }
        async Update(delta) {
            await this.internalState.Update(delta);
        }
        async Enter() {
        }
        async Exit() {
        }
    }
    exports.FlyAttackState = FlyAttackState;
});
define("Enemies/Dragon/States/EnterArenaState", ["require", "exports", "Enemies/Dragon/States/DragonStateBase", "gl-matrix"], function (require, exports, DragonStateBase_9, gl_matrix_35) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnterArenaState = void 0;
    /**
     * Starting state for the dragon. Makes the dragon to move to a correct place inside the arena after spawning.
     * Transitions to {@link IdleState} when the correct position is reached.
     */
    class EnterArenaState extends DragonStateBase_9.DragonStateBase {
        constructor(hero, dragon, layer, enterWaypoint) {
            super(hero, dragon);
            this.layer = layer;
            this.enterWaypoint = enterWaypoint;
        }
        async Enter() { }
        async Update(delta) {
            if (this.enterWaypoint === null) {
                await this.dragon.ChangeState(this.dragon.IDLE_STATE());
                return;
            }
            // Move to the predefined coordinates
            if (this.dragon.CenterPosition[0] > this.enterWaypoint[0]) {
                const dir = gl_matrix_35.vec3.fromValues(-0.00015, 0, 0);
                this.dragon.Move(dir, delta);
            }
            else {
                // close tiles
                // TODO: ezt a hardcodeot is meg kéne szüntetni
                this.layer.SetCollision(29, 11, true);
                this.layer.SetCollision(29, 12, true);
                this.layer.SetCollision(29, 13, true);
                this.layer.SetCollision(29, 14, true);
                await this.dragon.ChangeState(this.dragon.IDLE_STATE());
                return;
            }
        }
        async Exit() { }
    }
    exports.EnterArenaState = EnterArenaState;
});
define("Projectiles/Fireball", ["require", "exports", "gl-matrix", "Shader", "Sprite", "TexturePool", "Utils", "SoundEffectPool", "Projectiles/ProjectileBase", "Components/Animation"], function (require, exports, gl_matrix_36, Shader_8, Sprite_11, TexturePool_7, Utils_10, SoundEffectPool_6, ProjectileBase_4, Animation_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Fireball = void 0;
    class Fireball extends ProjectileBase_4.ProjectileBase {
        constructor(position, facingDirection, moveSpeed, collider, shader, bbShader, hitSound, spawnSound, despawnSound, texture) {
            const bbSize = gl_matrix_36.vec2.fromValues(2.0, 1.0);
            const visualScale = gl_matrix_36.vec2.fromValues(3, 3);
            const bbOffset = facingDirection[0] > 0 ?
                gl_matrix_36.vec3.fromValues(0, 1, 0) :
                gl_matrix_36.vec3.fromValues(1, 1, 0);
            const sprite = new Sprite_11.Sprite(Utils_10.Utils.DefaultSpriteVertices, Utils_10.Utils.CreateTextureCoordinates(0, 0, 1 / 8, 1 / 8));
            super(shader, texture, sprite, position, visualScale, bbOffset, bbSize, hitSound, false, collider, bbShader);
            this.moveSpeed = moveSpeed;
            this.spawnSound = spawnSound;
            this.despawnSound = despawnSound;
            this.spawnSoundPlayed = false;
            this.leftFacingAnimationFrames = [
                gl_matrix_36.vec2.fromValues(0 / 8, 0 / 8),
                gl_matrix_36.vec2.fromValues(1 / 8, 0 / 8),
                gl_matrix_36.vec2.fromValues(2 / 8, 0 / 8),
                gl_matrix_36.vec2.fromValues(3 / 8, 0 / 8),
                gl_matrix_36.vec2.fromValues(4 / 8, 0 / 8),
                gl_matrix_36.vec2.fromValues(5 / 8, 0 / 8),
                gl_matrix_36.vec2.fromValues(6 / 8, 0 / 8),
                gl_matrix_36.vec2.fromValues(7 / 8, 0 / 8),
            ];
            this.rightFacingAnimationFrames = [
                gl_matrix_36.vec2.fromValues(0 / 8, 4 / 8),
                gl_matrix_36.vec2.fromValues(1 / 8, 4 / 8),
                gl_matrix_36.vec2.fromValues(2 / 8, 4 / 8),
                gl_matrix_36.vec2.fromValues(3 / 8, 4 / 8),
                gl_matrix_36.vec2.fromValues(4 / 8, 4 / 8),
                gl_matrix_36.vec2.fromValues(5 / 8, 4 / 8),
                gl_matrix_36.vec2.fromValues(6 / 8, 4 / 8),
                gl_matrix_36.vec2.fromValues(7 / 8, 4 / 8),
            ];
            this.currentFrameSet = this.leftFacingAnimationFrames;
            this.animation = new Animation_4.Animation(1 / 30 * 1000, this.renderer);
            shader.SetVec4Uniform('clr', gl_matrix_36.vec4.fromValues(0, 1, 0, 0.4));
        }
        static async Create(position, facingDir, moveSpeed, collider) {
            const shader = await Shader_8.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_8.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const hitSound = await SoundEffectPool_6.SoundEffectPool.GetInstance().GetAudio('audio/hero_stomp.wav');
            const despawnSound = await SoundEffectPool_6.SoundEffectPool.GetInstance().GetAudio('audio/enemy_damage.wav');
            const spawnSound = await SoundEffectPool_6.SoundEffectPool.GetInstance().GetAudio('audio/fireball_spawn.mp3');
            const texture = await TexturePool_7.TexturePool.GetInstance().GetTexture('textures/fireball.png');
            return new Fireball(position, facingDir, moveSpeed, collider, shader, bbShader, hitSound, spawnSound, despawnSound, texture);
        }
        get PushbackForce() {
            // No pushback from a fireball
            return gl_matrix_36.vec3.create();
        }
        Dispose() {
            super.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
        async Update(delta) {
            await super.Update(delta);
            this.currentFrameSet = this.moveSpeed[0] > 0 ?
                this.rightFacingAnimationFrames :
                this.leftFacingAnimationFrames;
            this.animation.Animate(delta, this.currentFrameSet);
            if (!this.spawnSoundPlayed) {
                await this.spawnSound.Play(1, 0.5);
                this.spawnSoundPlayed = true;
            }
            await this.Move(this.moveSpeed, delta);
            if (this.AlreadyHit) {
                this.OnHitListeners.forEach(l => l.RemoveGameObject(this));
            }
        }
        async CollideWithAttack(attack) {
            if (!this.AlreadyHit) {
                await this.despawnSound.Play();
                await this.OnHit();
            }
        }
    }
    exports.Fireball = Fireball;
});
define("Enemies/Dragon/States/GroundAttackStates/SweepingState", ["require", "exports", "gl-matrix", "Projectiles/Fireball"], function (require, exports, gl_matrix_37, Fireball_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SweepingState = void 0;
    class SweepingState {
        constructor(context, hero, dragon, collider, spawnProjectile, shared) {
            this.context = context;
            this.hero = hero;
            this.dragon = dragon;
            this.collider = collider;
            this.spawnProjectile = spawnProjectile;
            this.shared = shared;
            this.timeSignalingFireballAttack = 0;
            this.signalingFireball = false;
        }
        async Update(delta) {
            // In sweeping state the dragon can spit a fireball
            const distance = gl_matrix_37.vec3.distance(this.hero.CenterPosition, this.dragon.CenterPosition);
            if (this.shared.timeSinceLastFireBall > 1500) {
                // spit fireball
                if (distance < 30 && distance > 5) {
                    // internal state in sweep: signal => (time in signaling) => spawn fireball
                    if (!this.signalingFireball) {
                        this.dragon.SignalAttack();
                        this.signalingFireball = true;
                    }
                }
                if (this.signalingFireball) {
                    this.timeSignalingFireballAttack += delta;
                }
                if (this.timeSignalingFireballAttack > 10 / 60 * 1000) {
                    // In ground attack the dragon spits the fireball on the x-axis only
                    const position = this.dragon.FireBallProjectileSpawnPosition;
                    const fireball = await Fireball_1.Fireball.Create(position, this.dragon.FacingDirection, gl_matrix_37.vec3.scale(gl_matrix_37.vec3.create(), this.dragon.FacingDirection, -0.00015), this.collider);
                    this.spawnProjectile(this.dragon, fireball);
                    this.timeSignalingFireballAttack = 0;
                    this.signalingFireball = false;
                    this.shared.timeSinceLastFireBall = 0;
                }
                if (distance < 6) {
                    await this.context.ChangeState(this.context.ATTACK_STATE());
                }
            }
            // Random change back to "idle" to be able to change into different states
            const chance = Math.random();
            if (chance < 0.01) {
                await this.dragon.ChangeState(this.dragon.IDLE_STATE());
                return;
            }
        }
        async Enter() {
        }
        async Exit() {
        }
    }
    exports.SweepingState = SweepingState;
});
define("Enemies/Dragon/States/GroundAttackStates/AttackState", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AttackState = void 0;
    class AttackState {
        constructor(dragon) {
            this.dragon = dragon;
        }
        async Update(delta) {
            // Bite attack is handled in the "idle" state
            await this.dragon.ChangeState(this.dragon.IDLE_STATE());
            return;
        }
        async Enter() {
        }
        async Exit() {
        }
    }
    exports.AttackState = AttackState;
});
define("Enemies/Dragon/States/GroundAttackStates/GroundAttackState", ["require", "exports", "Enemies/Dragon/States/DragonStateBase", "gl-matrix", "Enemies/Dragon/States/GroundAttackStates/SweepingState", "Enemies/Dragon/States/GroundAttackStates/AttackState"], function (require, exports, DragonStateBase_10, gl_matrix_38, SweepingState_2, AttackState_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GroundAttackState = void 0;
    class GroundAttackState extends DragonStateBase_10.DragonStateBase {
        SWEEPING_STATE() {
            return new SweepingState_2.SweepingState(this, this.hero, this.dragon, this.collider, this.spawnProjectile, this.shared);
        }
        ATTACK_STATE() {
            return new AttackState_3.AttackState(this.dragon);
        }
        async ChangeState(state) {
            await this.internalState.Exit();
            this.internalState = state;
            await this.internalState.Enter();
        }
        constructor(hero, dragon, collider, spawnProjectile, shared) {
            super(hero, dragon);
            this.collider = collider;
            this.spawnProjectile = spawnProjectile;
            this.shared = shared;
            this.internalState = this.SWEEPING_STATE();
            this.dir = gl_matrix_38.vec3.fromValues(-0.00010, 0, 0);
        }
        async Update(delta) {
            // Move left and right. Change direction when colliding with a wall
            if (this.dragon.WillCollide(this.dir, delta)) {
                this.dir = gl_matrix_38.vec3.fromValues(this.dir[0] * -1, 0, 0);
                this.dragon.ResetVelocity();
            }
            this.dragon.Move(this.dir, delta);
            this.MatchHeroHeight(delta);
            await this.internalState.Update(delta);
        }
        async Enter() {
        }
        async Exit() {
        }
    }
    exports.GroundAttackState = GroundAttackState;
});
define("Point", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Enemies/Dragon/DragonEnemy", ["require", "exports", "gl-matrix", "Shader", "Sprite", "TexturePool", "Utils", "SoundEffectPool", "Enemies/IEnemy", "Enemies/Dragon/States/IdleState", "Enemies/Dragon/States/RushStates/RushState", "Enemies/Dragon/States/FlyAttackStates/FlyAttackState", "Enemies/Dragon/States/EnterArenaState", "Enemies/Dragon/States/GroundAttackStates/GroundAttackState", "Components/Animation", "Components/PhysicsComponent", "Components/FlashOverlayComponent", "Components/DamageComponent", "Hero/States/StompState"], function (require, exports, gl_matrix_39, Shader_9, Sprite_12, TexturePool_8, Utils_11, SoundEffectPool_7, IEnemy_1, IdleState_2, RushState_1, FlyAttackState_1, EnterArenaState_1, GroundAttackState_1, Animation_5, PhysicsComponent_3, FlashOverlayComponent_2, DamageComponent_2, StompState_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DragonEnemy = void 0;
    class DragonEnemy extends IEnemy_1.EnemyBase {
        async ChangeState(state) {
            await this.state.Exit();
            this.state = state;
            await this.state.Enter();
        }
        IDLE_STATE() {
            return new IdleState_2.IdleState(this.hero, this, this.collider, this.biteAttackSound, this.spawnProjectile, this.shared);
        }
        RUSH_STATE() {
            return new RushState_1.RushState(this.hero, this, this.rushSound, this.backingStartSound, this.biteAttackSound, this.spawnProjectile, this.shared);
        }
        FLY_ATTACK_STATE() {
            return new FlyAttackState_1.FlyAttackState(this.hero, this, this.rushSound, this.collider, this.spawnProjectile, this.shared);
        }
        ENTER_ARENA_STATE() {
            const enterWaypoint = this.enterWaypoint ?
                gl_matrix_39.vec3.fromValues(this.enterWaypoint.x, this.enterWaypoint.y, 0) : null;
            return new EnterArenaState_1.EnterArenaState(this.hero, this, this.collider, enterWaypoint);
        }
        GROUND_ATTACK_STATE() {
            return new GroundAttackState_1.GroundAttackState(this.hero, this, this.collider, this.spawnProjectile, this.shared);
        }
        constructor(position, health, shader, bbShader, visualScale, // TODO: this should not be a parameter but hardcoded
        collider, hero, onDeath, spawnProjectile, enemyDamageSound, enemyDeathSound, biteAttackSound, rushSound, backingStartSound, texture, enterWaypoint) {
            const sprite = new Sprite_12.Sprite(Utils_11.Utils.DefaultSpriteVertices, Utils_11.Utils.CreateTextureCoordinates(0.0 / 12.0, 0.0 / 8.0, 1.0 / 12.0, 1.0 / 8.0));
            const bbSize = gl_matrix_39.vec2.fromValues(4.8, 3);
            const bbOffset = gl_matrix_39.vec3.fromValues(0.1, 1.5, 0);
            super(shader, sprite, texture, bbShader, bbSize, bbOffset, position, visualScale, health);
            this.collider = collider;
            this.hero = hero;
            this.onDeath = onDeath;
            this.spawnProjectile = spawnProjectile;
            this.enemyDamageSound = enemyDamageSound;
            this.enemyDeathSound = enemyDeathSound;
            this.biteAttackSound = biteAttackSound;
            this.rushSound = rushSound;
            this.backingStartSound = backingStartSound;
            this.enterWaypoint = enterWaypoint;
            this.state = this.ENTER_ARENA_STATE();
            this.leftFacingAnimationFrames = [
                gl_matrix_39.vec2.fromValues(3 / 12, 3 / 8),
                gl_matrix_39.vec2.fromValues(4 / 12, 3 / 8),
                gl_matrix_39.vec2.fromValues(5 / 12, 3 / 8)
            ];
            this.rightFacingAnimationFrames = [
                gl_matrix_39.vec2.fromValues(3 / 12, 1 / 8),
                gl_matrix_39.vec2.fromValues(4 / 12, 1 / 8),
                gl_matrix_39.vec2.fromValues(5 / 12, 1 / 8)
            ];
            this.currentFrameSet = this.leftFacingAnimationFrames;
            // Behaviour related
            this.shared = {
                timeSinceLastAttack: 0,
                timeSinceLastCharge: 9999,
                timeSinceLastFireBall: 0
            };
            this.lastFacingDirection = gl_matrix_39.vec3.fromValues(-1, 0, 0); // Facing right by default
            this.lastPosition = gl_matrix_39.vec3.create();
            this.animation = new Animation_5.Animation(1 / 60 * 1000 * 15, this.renderer);
            this.physicsComponent = new PhysicsComponent_3.PhysicsComponent(position, this.lastPosition, () => this.BoundingBox, bbOffset, collider, true);
            this.flashOverlayComponent = new FlashOverlayComponent_2.FlashOverlayComponent(this.shader);
            this.damageComponent = new DamageComponent_2.DamageComponent(this, this.flashOverlayComponent, this.enemyDamageSound, this.physicsComponent, 15);
        }
        static async Create(position, health, visualScale, collider, hero, onDeath, spawnProjectile, enterWaypoint) {
            const shader = await Shader_9.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_9.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            // TODO: ezeket a soundokat a state-ekben kéne létrehozni, nem innen lepasszolgatni
            const enemyDamageSound = await SoundEffectPool_7.SoundEffectPool.GetInstance().GetAudio('audio/enemy_damage.wav');
            const enemyDeathSound = await SoundEffectPool_7.SoundEffectPool.GetInstance().GetAudio('audio/enemy_death.wav');
            const biteAttackSound = await SoundEffectPool_7.SoundEffectPool.GetInstance().GetAudio('audio/bite2.wav');
            const rushSound = await SoundEffectPool_7.SoundEffectPool.GetInstance().GetAudio('audio/dragon_roar.mp3');
            const backingStartSound = await SoundEffectPool_7.SoundEffectPool.GetInstance().GetAudio('audio/charge_up.mp3');
            const texture = await TexturePool_8.TexturePool.GetInstance().GetTexture('textures/Monster2.png');
            return new DragonEnemy(position, health, shader, bbShader, visualScale, collider, hero, onDeath, spawnProjectile, enemyDamageSound, enemyDeathSound, biteAttackSound, rushSound, backingStartSound, texture, enterWaypoint);
        }
        async Visit(hero) {
            if (this.hero.StateClass === StompState_2.StompState.name) {
                this.physicsComponent.AddToExternalForce(gl_matrix_39.vec3.fromValues(0, -0.05, 0));
                await hero.ChangeState(hero.AFTER_STOMP_STATE());
                await this.DamageWithInvincibilityConsidered(gl_matrix_39.vec3.create(), 1); // Damage the enemy without pushing it to any direction
            }
        }
        get CenterPosition() {
            return gl_matrix_39.vec3.fromValues(this.position[0] + this.visualScale[0] / 2, this.position[1] + this.visualScale[1] / 2, 0);
        }
        get FacingDirection() {
            return this.lastFacingDirection;
        }
        get BiteProjectilePosition() {
            return this.FacingDirection[0] > 0 ?
                gl_matrix_39.vec3.add(gl_matrix_39.vec3.create(), this.position, gl_matrix_39.vec3.fromValues((-0) - 1.6, 1, 0)) :
                gl_matrix_39.vec3.add(gl_matrix_39.vec3.create(), this.position, gl_matrix_39.vec3.fromValues((+0) + 1.6, 1, 0));
        }
        get FireBallProjectileSpawnPosition() {
            return this.FacingDirection[0] > 0 ?
                gl_matrix_39.vec3.add(gl_matrix_39.vec3.create(), this.CenterPosition, gl_matrix_39.vec3.fromValues(-3, -1, 0)) :
                gl_matrix_39.vec3.add(gl_matrix_39.vec3.create(), this.CenterPosition, gl_matrix_39.vec3.fromValues(3, -1, 0));
        }
        get EndCondition() {
            return true;
        }
        async Damage(pushbackForce, damage) {
            await this.DamageWithInvincibilityConsidered(pushbackForce, damage);
        }
        async DamageWithInvincibilityConsidered(pushbackForce, damage) {
            await this.damageComponent.DamageWithInvincibilityConsidered(pushbackForce, damage);
            if (this.health <= 0) {
                if (this.onDeath) {
                    await this.enemyDeathSound.Play();
                    await this.onDeath(this);
                }
            }
            // force state change on damage
            if (!(this.state instanceof EnterArenaState_1.EnterArenaState)) {
                await this.ChangeState(this.IDLE_STATE());
            }
        }
        SignalAttack() {
            this.flashOverlayComponent.Flash(this.flashOverlayComponent.ATTACK_SIGNAL_COLOR, this.flashOverlayComponent.ATTACK_SIGNAL_DURATION);
        }
        async Update(delta) {
            this.shared.timeSinceLastAttack += delta;
            this.shared.timeSinceLastCharge += delta;
            this.shared.timeSinceLastFireBall += delta;
            this.damageComponent.Update(delta);
            // Face in the direction of the hero
            const dir = gl_matrix_39.vec3.sub(gl_matrix_39.vec3.create(), this.CenterPosition, this.hero.CenterPosition);
            if (dir[0] < 0) {
                this.currentFrameSet = this.rightFacingAnimationFrames;
                gl_matrix_39.vec3.set(this.lastFacingDirection, -1, 0, 0);
            }
            else if (dir[0] > 0) {
                this.currentFrameSet = this.leftFacingAnimationFrames;
                gl_matrix_39.vec3.set(this.lastFacingDirection, 1, 0, 0);
            }
            this.animation.Animate(delta, this.currentFrameSet);
            this.physicsComponent.Update(delta);
            this.flashOverlayComponent.Update(delta);
            await this.state.Update(delta);
        }
        Move(direction, delta) {
            this.physicsComponent.AddToExternalForce(gl_matrix_39.vec3.scale(gl_matrix_39.vec3.create(), direction, delta));
        }
        /**
         * Check if movement to the direction would cause a collision
         */
        WillCollide(direction, delta) {
            return this.physicsComponent.WillCollide(delta);
        }
        ResetVelocity() {
            this.physicsComponent.ResetVelocity();
        }
        Dispose() {
            super.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
    }
    exports.DragonEnemy = DragonEnemy;
});
define("Waypoint", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Waypoint = void 0;
    class Waypoint {
        constructor(position, next) {
            this.position = position;
            this.next = next;
        }
    }
    exports.Waypoint = Waypoint;
});
define("Enemies/SlimeEnemy", ["require", "exports", "gl-matrix", "Sprite", "Utils", "Shader", "TexturePool", "SoundEffectPool", "Waypoint", "Enemies/IEnemy", "Components/Animation", "Components/PhysicsComponent", "Components/FlashOverlayComponent", "Components/DamageComponent", "Hero/States/StompState"], function (require, exports, gl_matrix_40, Sprite_13, Utils_12, Shader_10, TexturePool_9, SoundEffectPool_8, Waypoint_1, IEnemy_2, Animation_6, PhysicsComponent_4, FlashOverlayComponent_3, DamageComponent_3, StompState_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SlimeEnemy = void 0;
    /**
     * Slime enemy is a passive enemy, meaning it does not actively attack the player, but it hurts when contacted directly
     */
    class SlimeEnemy extends IEnemy_2.EnemyBase {
        constructor(position, shader, bbShader, visualScale, collider, onDeath, enemyDamageSound, enemyDeathSound, texture) {
            const sprite = new Sprite_13.Sprite(Utils_12.Utils.DefaultSpriteVertices, Utils_12.Utils.CreateTextureCoordinates(0.0 / 12.0, // These constants are hardcoded with "monster1.png" in mind
            0.0 / 8.0, 1.0 / 12.0, 1.0 / 8.0));
            const bbSize = gl_matrix_40.vec2.fromValues(0.8, 1.0);
            const bbOffset = gl_matrix_40.vec3.fromValues(1.2, 1.8, 0);
            const health = 3;
            super(shader, sprite, texture, bbShader, bbSize, bbOffset, position, visualScale, health);
            this.collider = collider;
            this.onDeath = onDeath;
            this.enemyDamageSound = enemyDamageSound;
            this.enemyDeathSound = enemyDeathSound;
            // A little variation in movement speed;
            this.minSpeed = 0.00004;
            this.maxSpeed = 0.00006;
            this.movementSpeed = Math.random() * (this.maxSpeed - this.minSpeed) + this.minSpeed;
            this.leftFacingAnimationFrames = [
                gl_matrix_40.vec2.fromValues(0 / 12, 3 / 8),
                gl_matrix_40.vec2.fromValues(1 / 12, 3 / 8),
                gl_matrix_40.vec2.fromValues(2 / 12, 3 / 8)
            ];
            this.rightFacingAnimationFrames = [
                gl_matrix_40.vec2.fromValues(0 / 12, 1 / 8),
                gl_matrix_40.vec2.fromValues(1 / 12, 1 / 8),
                gl_matrix_40.vec2.fromValues(2 / 12, 1 / 8)
            ];
            this.currentFrameSet = this.leftFacingAnimationFrames;
            this.animation = new Animation_6.Animation(1 / 60 * 1000 * 15, this.renderer);
            // For now, slimes walk between their start position and another position with some constant offset
            const originalWaypoint = new Waypoint_1.Waypoint(gl_matrix_40.vec3.clone(this.position), null);
            const targetPosition = gl_matrix_40.vec3.add(gl_matrix_40.vec3.create(), gl_matrix_40.vec3.clone(this.position), gl_matrix_40.vec3.fromValues(-6, 0, 0));
            this.targetWaypoint = new Waypoint_1.Waypoint(targetPosition, originalWaypoint);
            originalWaypoint.next = this.targetWaypoint;
            this.physicsComponent = new PhysicsComponent_4.PhysicsComponent(this.position, gl_matrix_40.vec3.create(), () => this.BoundingBox, this.bbOffset, this.collider, false);
            const damageFlashComponent = new FlashOverlayComponent_3.FlashOverlayComponent(this.shader);
            this.damageComponent = new DamageComponent_3.DamageComponent(this, damageFlashComponent, this.enemyDamageSound, this.physicsComponent, 0);
        }
        static async Create(position, visualScale, collider, onDeath) {
            const shader = await Shader_10.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_10.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const enemyDamageSound = await SoundEffectPool_8.SoundEffectPool.GetInstance().GetAudio('audio/enemy_damage.wav');
            const enemyDeathSound = await SoundEffectPool_8.SoundEffectPool.GetInstance().GetAudio('audio/enemy_death.wav');
            const texture = await TexturePool_9.TexturePool.GetInstance().GetTexture('textures/monster1.png');
            return new SlimeEnemy(position, shader, bbShader, visualScale, collider, onDeath, enemyDamageSound, enemyDeathSound, texture);
        }
        async Visit(hero) {
            if (hero.StateClass !== StompState_3.StompState.name) {
                const pushbackForceRatio = gl_matrix_40.vec3.fromValues(hero.FacingDirection[0] * -0.0075, -0.003, 0);
                await hero.DamageWithInvincibilityConsidered(pushbackForceRatio, 34);
            }
            else if (hero.StateClass === StompState_3.StompState.name) {
                await hero.ChangeState(hero.AFTER_STOMP_STATE());
                await this.Damage(gl_matrix_40.vec3.create(), 1); // Damage the enemy without pushing it to any direction
            }
        }
        get EndCondition() {
            return false;
        }
        async Damage(pushbackForce, damage) {
            await this.damageComponent.Damage(pushbackForce, damage);
            if (this.health <= 0) {
                if (this.onDeath) {
                    await this.enemyDeathSound.Play();
                    this.onDeath(this);
                }
            }
        }
        async DamageWithInvincibilityConsidered(pushbackForce, damage) {
            throw new Error('Method not implemented.');
        }
        async Update(delta) {
            this.damageComponent.Update(delta);
            if (this.physicsComponent.OnGround) { // This way, the AI will not override velocity
                this.MoveTowardsNextWaypoint(delta);
            }
            this.animation.Animate(delta, this.currentFrameSet);
            this.physicsComponent.Update(delta);
        }
        MoveTowardsNextWaypoint(delta) {
            const dir = gl_matrix_40.vec3.sub(gl_matrix_40.vec3.create(), this.position, this.targetWaypoint.position);
            if (dir[0] < 0) {
                this.currentFrameSet = this.rightFacingAnimationFrames;
                this.Move(gl_matrix_40.vec3.fromValues(this.movementSpeed, 0, 0), delta);
            }
            else {
                this.currentFrameSet = this.leftFacingAnimationFrames;
                this.Move(gl_matrix_40.vec3.fromValues(-this.movementSpeed, 0, 0), delta);
            }
            if (gl_matrix_40.vec3.distance(this.position, this.targetWaypoint.position) < 0.025 && this.targetWaypoint.next) {
                this.targetWaypoint = this.targetWaypoint.next;
            }
        }
        Move(direction, delta) {
            this.physicsComponent.AddToExternalForce(gl_matrix_40.vec3.scale(gl_matrix_40.vec3.create(), direction, delta));
        }
        Dispose() {
            super.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
    }
    exports.SlimeEnemy = SlimeEnemy;
});
define("Enemies/Spike", ["require", "exports", "gl-matrix", "Enemies/IEnemy", "TexturePool", "Sprite", "Utils", "Shader", "Hero/States/StompState"], function (require, exports, gl_matrix_41, IEnemy_3, TexturePool_10, Sprite_14, Utils_13, Shader_11, StompState_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Spike = void 0;
    /**
     * Stationary enemy. Cannot be damaged. Can damage the hero
     */
    class Spike extends IEnemy_3.EnemyBase {
        constructor(position, visualScale, shader, bbShader, texture) {
            const sprite = new Sprite_14.Sprite(Utils_13.Utils.DefaultSpriteVertices, Utils_13.Utils.DefaultSpriteTextureCoordinates);
            const bbSize = gl_matrix_41.vec2.fromValues(1, 1);
            const bbOffset = gl_matrix_41.vec3.fromValues(0, 0, 0);
            super(shader, sprite, texture, bbShader, bbSize, bbOffset, position, visualScale, 0);
        }
        static async Create(position, visualScale) {
            const shader = await Shader_11.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_11.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const texture = await TexturePool_10.TexturePool.GetInstance().GetTexture('textures/spike.png');
            return new Spike(position, visualScale, shader, bbShader, texture);
        }
        async Update(delta) {
            // No update for spike at the moment
        }
        async Damage(pushbackForce, damage) {
            // Cannot damage a spike
        }
        async DamageWithInvincibilityConsidered(pushbackForce, damage) {
            // Cannot damage a spike
        }
        get EndCondition() {
            return false;
        }
        async Visit(hero) {
            if (hero.StateClass !== StompState_4.StompState.name) {
                const pushbackForceRatio = gl_matrix_41.vec3.fromValues(0, -0.008, 0);
                await hero.DamageWithInvincibilityConsidered(pushbackForceRatio, 20);
            }
            else {
                await hero.Damage(gl_matrix_41.vec3.fromValues(0, -0.008, 0), 20);
                await hero.ChangeState(hero.AFTER_STOMP_STATE());
            }
        }
        Dispose() {
            super.Dispose();
            this.shader.Delete();
            this.bbShader.Delete();
        }
    }
    exports.Spike = Spike;
});
define("Enemies/Cactus", ["require", "exports", "gl-matrix", "Enemies/IEnemy", "TexturePool", "Shader", "Sprite", "Utils", "SoundEffectPool", "Components/Animation", "Components/FlashOverlayComponent", "Components/DamageComponent", "Components/PhysicsComponent", "ICollider", "Hero/States/StompState"], function (require, exports, gl_matrix_42, IEnemy_4, TexturePool_11, Shader_12, Sprite_15, Utils_14, SoundEffectPool_9, Animation_7, FlashOverlayComponent_4, DamageComponent_4, PhysicsComponent_5, ICollider_3, StompState_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Cactus = void 0;
    /**
     * Stationary enemy that cannot be stomped on (like spikes), but it can be damaged with a sword attack
     */
    class Cactus extends IEnemy_4.EnemyBase {
        constructor(position, onDeath, shader, bbShader, texture, enemyDamageSound, enemyDeathSound) {
            const sprite = new Sprite_15.Sprite(Utils_14.Utils.DefaultSpriteVertices, Utils_14.Utils.CreateTextureCoordinates(0 / 6, 0 / 8, 1 / 6, 1 / 8));
            const bbSize = gl_matrix_42.vec2.fromValues(2.3, 2.5);
            const bbOffset = gl_matrix_42.vec3.fromValues(0.35, 0.5, 0);
            const visualScale = gl_matrix_42.vec2.fromValues(3, 3);
            const health = 3;
            super(shader, sprite, texture, bbShader, bbSize, bbOffset, position, visualScale, health);
            this.onDeath = onDeath;
            this.enemyDamageSound = enemyDamageSound;
            this.enemyDeathSound = enemyDeathSound;
            this.currentFrameSet = [
                gl_matrix_42.vec2.fromValues(0 / 6, 0 / 8),
                gl_matrix_42.vec2.fromValues(1 / 6, 0 / 8),
                gl_matrix_42.vec2.fromValues(2 / 6, 0 / 8),
                gl_matrix_42.vec2.fromValues(3 / 6, 0 / 8),
                gl_matrix_42.vec2.fromValues(4 / 6, 0 / 8),
                gl_matrix_42.vec2.fromValues(5 / 6, 0 / 8),
                gl_matrix_42.vec2.fromValues(0 / 6, 1 / 8),
                gl_matrix_42.vec2.fromValues(1 / 6, 1 / 8),
                gl_matrix_42.vec2.fromValues(2 / 6, 1 / 8),
                gl_matrix_42.vec2.fromValues(3 / 6, 1 / 8),
                gl_matrix_42.vec2.fromValues(4 / 6, 1 / 8),
                gl_matrix_42.vec2.fromValues(5 / 6, 1 / 8),
                gl_matrix_42.vec2.fromValues(0 / 6, 2 / 8),
                gl_matrix_42.vec2.fromValues(1 / 6, 2 / 8),
                gl_matrix_42.vec2.fromValues(2 / 6, 2 / 8),
                gl_matrix_42.vec2.fromValues(3 / 6, 2 / 8),
                gl_matrix_42.vec2.fromValues(4 / 6, 2 / 8),
                gl_matrix_42.vec2.fromValues(5 / 6, 2 / 8),
                gl_matrix_42.vec2.fromValues(0 / 6, 3 / 8),
                gl_matrix_42.vec2.fromValues(1 / 6, 3 / 8),
                gl_matrix_42.vec2.fromValues(2 / 6, 3 / 8),
                gl_matrix_42.vec2.fromValues(3 / 6, 3 / 8),
                gl_matrix_42.vec2.fromValues(4 / 6, 3 / 8),
                gl_matrix_42.vec2.fromValues(5 / 6, 3 / 8),
                gl_matrix_42.vec2.fromValues(0 / 6, 4 / 8),
                gl_matrix_42.vec2.fromValues(1 / 6, 4 / 8),
                gl_matrix_42.vec2.fromValues(2 / 6, 4 / 8),
                gl_matrix_42.vec2.fromValues(3 / 6, 4 / 8),
                gl_matrix_42.vec2.fromValues(4 / 6, 4 / 8),
                gl_matrix_42.vec2.fromValues(5 / 6, 4 / 8),
                gl_matrix_42.vec2.fromValues(0 / 6, 5 / 8),
                gl_matrix_42.vec2.fromValues(1 / 6, 5 / 8),
                gl_matrix_42.vec2.fromValues(2 / 6, 5 / 8),
                gl_matrix_42.vec2.fromValues(3 / 6, 5 / 8),
                gl_matrix_42.vec2.fromValues(4 / 6, 5 / 8),
                gl_matrix_42.vec2.fromValues(5 / 6, 5 / 8),
                gl_matrix_42.vec2.fromValues(0 / 6, 6 / 8),
                gl_matrix_42.vec2.fromValues(1 / 6, 6 / 8),
                gl_matrix_42.vec2.fromValues(2 / 6, 6 / 8),
                gl_matrix_42.vec2.fromValues(3 / 6, 6 / 8),
                gl_matrix_42.vec2.fromValues(4 / 6, 6 / 8),
                gl_matrix_42.vec2.fromValues(5 / 6, 6 / 8),
                gl_matrix_42.vec2.fromValues(0 / 6, 7 / 8),
                gl_matrix_42.vec2.fromValues(1 / 6, 7 / 8),
            ];
            this.animation = new Animation_7.Animation(1 / 15 * 1000, this.renderer); // 15 fps animation
            this.physicsComponent = new PhysicsComponent_5.PhysicsComponent(this.position, gl_matrix_42.vec3.create(), () => this.BoundingBox, this.bbOffset, new ICollider_3.NullCollider(), false, false);
            const damageFlashComponent = new FlashOverlayComponent_4.FlashOverlayComponent(this.shader);
            this.damageComponent = new DamageComponent_4.DamageComponent(this, damageFlashComponent, this.enemyDamageSound, this.physicsComponent, 0);
        }
        static async Create(position, onDeath) {
            const shader = await Shader_12.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const bbShader = await Shader_12.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            const damageSound = await SoundEffectPool_9.SoundEffectPool.GetInstance().GetAudio('audio/enemy_damage.wav');
            const deathSound = await SoundEffectPool_9.SoundEffectPool.GetInstance().GetAudio('audio/enemy_death.wav');
            const texture = await TexturePool_11.TexturePool.GetInstance().GetTexture('textures/cactus1.png');
            return new Cactus(position, onDeath, shader, bbShader, texture, damageSound, deathSound);
        }
        async Update(delta) {
            this.animation.Animate(delta, this.currentFrameSet);
            this.damageComponent.Update(delta);
        }
        async Damage(pushbackForce, damage) {
            await this.damageComponent.Damage(gl_matrix_42.vec3.create(), damage);
            if (this.health <= 0) {
                if (this.onDeath) {
                    await this.enemyDeathSound.Play();
                    this.onDeath(this);
                }
            }
        }
        async DamageWithInvincibilityConsidered(pushbackForce, damage) {
            await this.damageComponent.DamageWithInvincibilityConsidered(pushbackForce, damage);
        }
        get EndCondition() {
            return false;
        }
        async Visit(hero) {
            if (hero.StateClass !== StompState_5.StompState.name) {
                await hero.DamageWithInvincibilityConsidered(gl_matrix_42.vec3.fromValues(0, -0.01, 0), 20);
            }
            else {
                // cactus will hurt the hero when stomping on it
                await hero.Damage(gl_matrix_42.vec3.fromValues(0, -0.008, 0), 20);
                await hero.ChangeState(hero.AFTER_STOMP_STATE());
            }
        }
        Dispose() {
            super.Dispose();
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
define("Pickups/CoinObject", ["require", "exports", "gl-matrix", "BoundingBox", "Shader", "Sprite", "Utils", "TexturePool", "SoundEffectPool", "SpriteRenderer", "Components/Animation"], function (require, exports, gl_matrix_43, BoundingBox_8, Shader_13, Sprite_16, Utils_15, TexturePool_12, SoundEffectPool_10, SpriteRenderer_5, Animation_8) {
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
            this.currentFrameSet = [
                gl_matrix_43.vec2.fromValues(0 / 10, 0),
                gl_matrix_43.vec2.fromValues(1 / 10, 0),
                gl_matrix_43.vec2.fromValues(2 / 10, 0),
                gl_matrix_43.vec2.fromValues(3 / 10, 0),
                gl_matrix_43.vec2.fromValues(4 / 10, 0),
                gl_matrix_43.vec2.fromValues(5 / 10, 0),
                gl_matrix_43.vec2.fromValues(6 / 10, 0),
                gl_matrix_43.vec2.fromValues(7 / 10, 0),
                gl_matrix_43.vec2.fromValues(8 / 10, 0),
                gl_matrix_43.vec2.fromValues(9 / 10, 0)
            ];
            // this is hardcoded for coin.png
            this.sprite = new Sprite_16.Sprite(Utils_15.Utils.DefaultSpriteVertices, Utils_15.Utils.CreateTextureCoordinates(0, 0, 1.0 / 10, 1.0));
            this.renderer = new SpriteRenderer_5.SpriteRenderer(shader, texture, this.sprite, gl_matrix_43.vec2.fromValues(1, 1));
            this.animation = new Animation_8.Animation(1 / 60 * 1000 * 3, this.renderer);
        }
        static async Create(position, onPickup) {
            const shader = await Shader_13.Shader.Create('shaders/VertexShader.vert', 'shaders/FragmentShader.frag');
            const pickupSound = await SoundEffectPool_10.SoundEffectPool.GetInstance().GetAudio('audio/collect.mp3');
            const texture = await TexturePool_12.TexturePool.GetInstance().GetTexture('textures/coin.png');
            return new CoinObject(position, onPickup, shader, pickupSound, texture);
        }
        get BoundingBox() {
            return new BoundingBox_8.BoundingBox(this.position, gl_matrix_43.vec2.fromValues(1, 1));
        }
        get EndCondition() {
            return true;
        }
        async CollideWithAttack(attack) {
            // No-op
        }
        async Visit(hero) {
            await this.pickupSound.Play();
            hero.IncrementCollectedCoins();
            this.onPickup(this);
        }
        IsCollidingWith(boundingBox) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        async Update(delta) {
            this.animation.Animate(delta, this.currentFrameSet);
        }
        Draw(proj, view) {
            this.renderer.Draw(proj, view, this.position, 0);
        }
        Dispose() {
            this.renderer.Dispose();
            this.shader.Delete();
        }
    }
    exports.CoinObject = CoinObject;
});
define("Pickups/HealthPickup", ["require", "exports", "gl-matrix", "BoundingBox", "Shader", "TexturePool", "Sprite", "Utils", "SoundEffectPool", "SpriteRenderer"], function (require, exports, gl_matrix_44, BoundingBox_9, Shader_14, TexturePool_13, Sprite_17, Utils_16, SoundEffectPool_11, SpriteRenderer_6) {
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
            this.visualScale = gl_matrix_44.vec2.fromValues(2, 2);
            this.sprite = new Sprite_17.Sprite(Utils_16.Utils.DefaultSpriteVertices, Utils_16.Utils.DefaultSpriteTextureCoordinates);
            this.currentTime = 0;
            this.startPosition = gl_matrix_44.vec3.clone(position);
            this.renderer = new SpriteRenderer_6.SpriteRenderer(shader, texture, this.sprite, this.visualScale);
        }
        static async Create(position, onPickup) {
            const shader = await Shader_14.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const pickupSound = await SoundEffectPool_11.SoundEffectPool.GetInstance().GetAudio('audio/item1.wav', false);
            const texture = await TexturePool_13.TexturePool.GetInstance().GetTexture('textures/potion.png');
            return new HealthPickup(position, onPickup, shader, pickupSound, texture);
        }
        get EndCondition() {
            return false;
        }
        get BoundingBox() {
            return new BoundingBox_9.BoundingBox(this.position, gl_matrix_44.vec2.fromValues(this.visualScale[0], this.visualScale[1]));
        }
        get Increase() {
            return 20;
        }
        Draw(proj, view) {
            this.renderer.Draw(proj, view, this.position, 0);
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
        async CollideWithAttack(attack) {
            // No-op
        }
        async Visit(hero) {
            await this.pickupSound.Play();
            hero.Health += this.Increase;
            // De-spawning is handled by the Game object, so we need no notify it that it can now despawn the object
            this.onPickup(this);
        }
        Dispose() {
            this.renderer.Dispose();
            this.shader.Delete();
        }
    }
    exports.HealthPickup = HealthPickup;
});
define("Events/ILevelEvent", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Events/EscapeEvent", ["require", "exports", "gl-matrix", "SoundEffectPool"], function (require, exports, gl_matrix_45, SoundEffectPool_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EscapeEvent = void 0;
    // TODO: animate lava
    class EscapeEvent {
        constructor(camera, eventLayer, mainLayer, hero, eventLayerStopPosition, eventLayerSpeed, cameraStopPos, cameraSpeed, shakeSound, explosionSound, music) {
            this.camera = camera;
            this.eventLayer = eventLayer;
            this.mainLayer = mainLayer;
            this.hero = hero;
            this.eventLayerStopPosition = eventLayerStopPosition;
            this.eventLayerSpeed = eventLayerSpeed;
            this.cameraStopPos = cameraStopPos;
            this.cameraSpeed = cameraSpeed;
            this.shakeSound = shakeSound;
            this.explosionSound = explosionSound;
            this.music = music;
            this.elapsedTime = 0;
            // Using the sequence of event pattern here (like in the outro conversation) made the code less readable than this state so this will remain as is
            this.state = 0;
            this.started = false;
            this.eventCameraYPos = eventLayer.MaxY;
            this.music.Stop();
        }
        get EventKey() {
            return EscapeEvent.EVENT_KEY;
        }
        get CanStart() {
            return !this.started;
        }
        static async Create(camera, eventLayer, mainLayer, hero, eventLayerStopPosition, eventLayerSpeed, cameraStopPosition, cameraSpeed) {
            const shakeSound = await SoundEffectPool_12.SoundEffectPool.GetInstance().GetAudio('audio/shake.wav', false);
            const music = await SoundEffectPool_12.SoundEffectPool.GetInstance().GetAudio('audio/escape.mp3', false);
            const explosionSound = await SoundEffectPool_12.SoundEffectPool.GetInstance().GetAudio('audio/explosion.mp3', false);
            return new EscapeEvent(camera, eventLayer, mainLayer, hero, eventLayerStopPosition, eventLayerSpeed, cameraStopPosition, cameraSpeed, shakeSound, explosionSound, music);
        }
        async Update(delta) {
            if (this.started) {
                this.elapsedTime += delta;
            }
            if (this.state === 0) {
                await this.shakeSound.Play(1, 1, null, true);
                this.camera.Shake = true;
                if (!this.started) {
                    this.started = true;
                    this.state++;
                }
            }
            else if (this.state === 1) {
                await this.explosionSound.Play(1, 1, null, false);
                this.state++;
            }
            else if (this.state === 2) {
                await this.music.Play(1, 0.4, null, false);
                // max offset
                if (this.eventLayer.MinY + this.eventLayer.LayerOffsetY > this.eventLayerStopPosition) {
                    this.eventLayer.LayerOffsetY -= this.eventLayerSpeed * delta;
                }
                else {
                    this.camera.Shake = false;
                    this.shakeSound.Stop();
                }
                if (this.eventLayer.IsCollidingWith(this.hero.BoundingBox, true)) {
                    await this.hero.DamageWithInvincibilityConsidered(gl_matrix_45.vec3.fromValues(0, -0.008, 0), 20);
                }
                if (this.eventCameraYPos > this.cameraStopPos) {
                    this.eventCameraYPos = (this.eventCameraYPos - (this.cameraSpeed * delta));
                }
            }
            const vec = gl_matrix_45.vec3.fromValues((this.eventLayer.MaxX - this.eventLayer.MinX) / 2, this.eventCameraYPos - 5, 0);
            this.camera.LookAtPosition(vec, this.mainLayer);
        }
        Dispose() {
            this.music.Stop();
            this.shakeSound.Stop();
            this.camera.Shake = false;
        }
    }
    exports.EscapeEvent = EscapeEvent;
    EscapeEvent.EVENT_KEY = 'escape_event';
});
define("Events/FreeCameraEvent", ["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_46) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FreeCameraEvent = void 0;
    /**
     * FreeCameraEvent allows the camera to follow the hero
     */
    class FreeCameraEvent {
        constructor(camera, mainLayer, hero) {
            this.camera = camera;
            this.mainLayer = mainLayer;
            this.hero = hero;
        }
        get EventKey() {
            return FreeCameraEvent.EVENT_KEY;
        }
        get CanStart() {
            return true;
        }
        async Update(_) {
            this.camera.LookAtPosition(gl_matrix_46.vec3.clone(this.hero.Position), this.mainLayer);
        }
        Dispose() {
            // nothing to dispose
        }
    }
    exports.FreeCameraEvent = FreeCameraEvent;
    FreeCameraEvent.EVENT_KEY = 'free_camera_event';
});
define("Events/LevelEventTrigger", ["require", "exports", "gl-matrix", "BoundingBox"], function (require, exports, gl_matrix_47, BoundingBox_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LevelEventTrigger = void 0;
    /**
     * Changes the current global level event upon contact
     */
    class LevelEventTrigger {
        constructor(level, position, eventName) {
            this.level = level;
            this.position = position;
            this.eventName = eventName;
        }
        Draw(proj, view) {
            // Invisible
        }
        Update(delta) {
            return Promise.resolve();
        }
        async Visit(hero) {
            this.level.ChangeEvent(this.eventName);
        }
        get EndCondition() {
            return false;
        }
        async CollideWithAttack(attack) {
            // invisible & invincible
        }
        get BoundingBox() {
            return new BoundingBox_10.BoundingBox(this.position, gl_matrix_47.vec2.fromValues(1, 1));
        }
        IsCollidingWith(boundingBox, _) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        Dispose() {
            // Nothing to dispose ATM
        }
    }
    exports.LevelEventTrigger = LevelEventTrigger;
});
define("UIService", ["require", "exports", "gl-matrix", "Textbox", "Environment"], function (require, exports, gl_matrix_48, Textbox_2, Environment_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UIService = void 0;
    class UIService {
        // TODO: resize event?
        constructor(screenWidth, screenHeight) {
            this.screenWidth = screenWidth;
            this.screenHeight = screenHeight;
            this.textboxes = [];
            this.textProjectionMatrix = gl_matrix_48.mat4.ortho(gl_matrix_48.mat4.create(), 0, screenWidth, screenHeight, 0, -1, 1);
        }
        get Width() {
            return this.screenWidth;
        }
        get Height() {
            return this.screenHeight;
        }
        get TileWidth() {
            return this.screenWidth / Environment_9.Environment.HorizontalTiles;
        }
        get TileHeight() {
            return this.screenHeight / Environment_9.Environment.VerticalTiles;
        }
        async AddTextbox() {
            const textbox = await Textbox_2.Textbox.Create('Consolas');
            this.textboxes.push(textbox);
            return textbox;
        }
        RemoveTextbox(textbox) {
            this.textboxes = this.textboxes.filter(t => t !== textbox);
            textbox.Dispose();
        }
        Draw(_) {
            this.textboxes.forEach(t => t.Draw(this.textProjectionMatrix));
        }
        Clear() {
            this.textboxes.forEach(t => t.Dispose());
            this.textboxes = [];
        }
        Dispose() {
            this.Clear();
        }
    }
    exports.UIService = UIService;
});
define("Events/Boss/SharedBossEventVariables", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedBossEventVariables = void 0;
    class SharedBossEventVariables {
        constructor() {
            this.musicVolume = 1;
            this.startMusicVolume = 1;
            this.started = false;
        }
    }
    exports.SharedBossEventVariables = SharedBossEventVariables;
});
define("Events/Boss/States/SpawnState", ["require", "exports", "gl-matrix", "Enemies/Dragon/DragonEnemy"], function (require, exports, gl_matrix_49, DragonEnemy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpawnState = void 0;
    /**
     * Spawns the boss to the level
     */
    class SpawnState {
        constructor(context, level, hero, shared, bossPosition, bossHealth, enterWaypoint, roar, music, camera, uiService, shakeSound) {
            this.context = context;
            this.level = level;
            this.hero = hero;
            this.shared = shared;
            this.bossPosition = bossPosition;
            this.bossHealth = bossHealth;
            this.enterWaypoint = enterWaypoint;
            this.roar = roar;
            this.music = music;
            this.camera = camera;
            this.uiService = uiService;
            this.shakeSound = shakeSound;
            this.boss = null;
        }
        async Update(delta) {
            this.shared.started = true;
            // Spawn
            await this.roar.Play();
            await this.level.ChangeMusic(this.music, 0.5);
            this.shared.musicVolume = this.level.GetMusicVolume();
            this.shared.startMusicVolume = this.shared.musicVolume;
            this.boss = await DragonEnemy_1.DragonEnemy.Create(this.bossPosition, this.bossHealth, gl_matrix_49.vec2.fromValues(5, 5), this.level.MainLayer, this.hero, async () => await this.OnBossDeath(), (sender, projectile) => {
                this.level.SpawnProjectile(projectile);
            }, this.enterWaypoint);
            this.context.SpawnBoss(this.boss);
            await this.context.ChangeState(this.context.FIGHT_STATE());
        }
        async Enter() { }
        async Exit() { }
        async OnBossDeath() {
            this.level.RemoveGameObject(this.boss);
            await this.shakeSound.Play(1, 1, null, true);
            this.camera.Shake = true;
            await this.context.ChangeState(this.context.BOSS_DEATH_STATE());
        }
    }
    exports.SpawnState = SpawnState;
});
define("Events/Boss/States/FightState", ["require", "exports", "Textbox", "gl-matrix"], function (require, exports, Textbox_3, gl_matrix_50) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FightState = void 0;
    /**
     * Fight state of the boss event. Maintains the UI updates of the boss health
     */
    class FightState {
        constructor(boss, uiService, bossHealthTextbox) {
            this.boss = boss;
            this.uiService = uiService;
            this.bossHealthTextbox = bossHealthTextbox;
        }
        async Update(delta) {
            // State change is handled in OnBossDeath
            const bossHealthText = `Liz the lizard queen: ${this.boss.Health} HP`;
            const dimensions = await Textbox_3.Textbox.PrecalculateDimensions('Consolas', bossHealthText, 0.5);
            this.bossHealthTextbox.WithText(bossHealthText, gl_matrix_50.vec2.fromValues(this.uiService.Width / 2 - dimensions.width / 2, 50), 0.5)
                .WithSaturation(1);
        }
        async Enter() {
        }
        async Exit() {
            this.uiService.RemoveTextbox(this.bossHealthTextbox);
        }
    }
    exports.FightState = FightState;
});
define("Events/Boss/States/BossDeathState", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BossDeathState = void 0;
    /**
     * The part of the boss event after the boss died.
     * Takes the hero's controls and fades-out the boss music
     * After some wait time, changes the state to HeroExitState
     */
    class BossDeathState {
        constructor(context, hero, level, shared) {
            this.context = context;
            this.hero = hero;
            this.level = level;
            this.shared = shared;
            this.timeSinceBossDied = 0;
        }
        async Update(delta) {
            // OnBoss death state
            // move hero to the end marker
            this.timeSinceBossDied += delta;
            const musicStep = this.shared.startMusicVolume / (3000 / delta);
            this.shared.musicVolume -= musicStep;
            this.level.SetMusicVolume(this.shared.musicVolume);
            // wait for some time before moving the hero
            if (this.timeSinceBossDied > 3000) {
                await this.context.ChangeState(this.context.HERO_EXIT_STATE());
            }
        }
        async Enter() {
        }
        async Exit() {
        }
    }
    exports.BossDeathState = BossDeathState;
});
define("Events/Boss/States/HeroExitState", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HeroExitState = void 0;
    /**
     * Moves the hero to the exit. No state change after that.
     */
    class HeroExitState {
        constructor(level, hero) {
            this.level = level;
            this.hero = hero;
            this.input = this.hero.TakeoverControl();
        }
        async Update(delta) {
            this.level.MainLayer.SetCollision(29, 11, false);
            this.level.MainLayer.SetCollision(29, 12, false);
            this.level.MainLayer.SetCollision(29, 13, false);
            this.level.MainLayer.SetCollision(29, 14, false);
            this.hero.Speed = 0.0004;
            this.input.PressKey("right");
        }
        async Enter() {
        }
        async Exit() {
            this.hero.ReleaseControl();
            this.hero.Speed = this.hero.DEFAULT_SPEED;
        }
    }
    exports.HeroExitState = HeroExitState;
});
define("Events/Boss/BossEvent", ["require", "exports", "gl-matrix", "SoundEffectPool", "Events/FreeCameraEvent", "Environment", "Events/Boss/States/SpawnState", "Events/Boss/States/FightState", "Events/Boss/States/BossDeathState", "Events/Boss/States/HeroExitState"], function (require, exports, gl_matrix_51, SoundEffectPool_13, FreeCameraEvent_1, Environment_10, SpawnState_1, FightState_1, BossDeathState_1, HeroExitState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BossEvent = void 0;
    class BossEvent {
        SPAWN_STATE() {
            return new SpawnState_1.SpawnState(this, this.level, this.hero, this.shared, this.bossPosition, this.bossHealth, this.enterWaypoint, this.roar, this.music, this.camera, this.uiService, this.shakeSound);
        }
        FIGHT_STATE() {
            if (!this.boss) {
                throw new Error('Boss cannot be null');
            }
            return new FightState_1.FightState(this.boss, this.uiService, this.bossHealthTextbox);
        }
        BOSS_DEATH_STATE() {
            return new BossDeathState_1.BossDeathState(this, this.hero, this.level, this.shared);
        }
        HERO_EXIT_STATE() {
            return new HeroExitState_1.HeroExitState(this.level, this.hero);
        }
        async ChangeState(state) {
            await this.internalState.Exit();
            this.internalState = state;
            await this.internalState.Enter();
        }
        constructor(level, hero, uiService, bossHealthTextbox, roar, bossPosition, bossHealth, camera, shakeSound, enterWaypoint, music) {
            this.level = level;
            this.hero = hero;
            this.uiService = uiService;
            this.bossHealthTextbox = bossHealthTextbox;
            this.roar = roar;
            this.bossPosition = bossPosition;
            this.bossHealth = bossHealth;
            this.camera = camera;
            this.shakeSound = shakeSound;
            this.enterWaypoint = enterWaypoint;
            this.music = music;
            this.shared = {
                started: false,
                musicVolume: 0,
                startMusicVolume: 0
            };
            this.internalState = this.SPAWN_STATE();
            this.boss = null;
        }
        static async Create(level, hero, uiService, bossPosition, bossHealth, camera, enterWaypoint) {
            const roar = await SoundEffectPool_13.SoundEffectPool.GetInstance().GetAudio('audio/monster_small_roar.wav', false);
            const shakeSound = await SoundEffectPool_13.SoundEffectPool.GetInstance().GetAudio('audio/shake.wav', false);
            const bossHealthText = await uiService.AddTextbox();
            const music = await SoundEffectPool_13.SoundEffectPool.GetInstance().GetAudio('audio/hunters_chance.mp3', false);
            return new BossEvent(level, hero, uiService, bossHealthText, roar, bossPosition, bossHealth, camera, shakeSound, enterWaypoint, music);
        }
        async Update(delta) {
            await this.internalState.Update(delta);
            // Lock camera in position
            const vec = gl_matrix_51.vec3.fromValues(Environment_10.Environment.HorizontalTiles / 2, Environment_10.Environment.VerticalTiles, 0);
            this.camera.LookAtPosition(vec, this.level.MainLayer);
        }
        get EventKey() {
            return BossEvent.EVENT_KEY;
        }
        get CanStart() {
            return !this.shared.started;
        }
        SpawnBoss(boss) {
            this.boss = boss;
            this.level.AddGameObject(boss);
        }
        Dispose() {
            // RemoveGameObject disposes the boss enemy
            this.uiService.RemoveTextbox(this.bossHealthTextbox);
            if (this.boss) {
                this.level.RemoveGameObject(this.boss);
                this.boss = null;
            }
            this.level.ChangeEvent(FreeCameraEvent_1.FreeCameraEvent.EVENT_KEY); // make sure that the event has been reset
        }
    }
    exports.BossEvent = BossEvent;
    BossEvent.EVENT_KEY = 'boss_event';
});
define("Actors/OldMan", ["require", "exports", "BoundingBox", "gl-matrix", "Shader", "TexturePool", "Sprite", "Utils", "SpriteRenderer", "Components/Animation", "Components/PhysicsComponent"], function (require, exports, BoundingBox_11, gl_matrix_52, Shader_15, TexturePool_14, Sprite_18, Utils_17, SpriteRenderer_7, Animation_9, PhysicsComponent_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OldMan = void 0;
    var AnimationStates;
    (function (AnimationStates) {
        AnimationStates[AnimationStates["IDLE"] = 0] = "IDLE";
        AnimationStates[AnimationStates["WALKING"] = 1] = "WALKING";
    })(AnimationStates || (AnimationStates = {}));
    class OldMan {
        constructor(position, shader, texture, collider) {
            this.position = position;
            this.shader = shader;
            this.texture = texture;
            this.collider = collider;
            this.animationState = AnimationStates.IDLE;
            this.sprite = new Sprite_18.Sprite(Utils_17.Utils.DefaultSpriteVertices, Utils_17.Utils.CreateTextureCoordinates(0.0, 0.0, 1.0 / 12.0, 1.0 / 8.0));
            this.visualScale = gl_matrix_52.vec2.fromValues(3, 3);
            this.bbOffset = gl_matrix_52.vec3.fromValues(1.2, 1.1, 0);
            this.bbSize = gl_matrix_52.vec2.fromValues(0.8, 1.8);
            // Last position is used in collision logic, and determining the facing direction when animating
            this.lastPosition = gl_matrix_52.vec3.fromValues(0, 0, 0);
            this.leftFacingAnimationFrames = [
                gl_matrix_52.vec2.fromValues(6.0 / 12.0, 7.0 / 8.0),
                gl_matrix_52.vec2.fromValues(7.0 / 12.0, 7.0 / 8.0),
                gl_matrix_52.vec2.fromValues(8.0 / 12.0, 7.0 / 8.0)
            ];
            this.rightFacingAnimationFrames = [
                gl_matrix_52.vec2.fromValues(6.0 / 12.0, 5.0 / 8.0),
                gl_matrix_52.vec2.fromValues(7.0 / 12.0, 5.0 / 8.0),
                gl_matrix_52.vec2.fromValues(8.0 / 12.0, 5.0 / 8.0)
            ];
            this.currentFrameSet = this.leftFacingAnimationFrames;
            gl_matrix_52.vec3.copy(this.lastPosition, this.position);
            this.renderer = new SpriteRenderer_7.SpriteRenderer(shader, texture, this.sprite, this.visualScale);
            this.renderer.TextureOffset = this.currentFrameSet[0];
            this.animation = new Animation_9.Animation(1 / 60 * 1000 * 15, this.renderer);
            this.physicsComponent = new PhysicsComponent_6.PhysicsComponent(this.position, this.lastPosition, () => this.BoundingBox, this.bbOffset, this.collider, false);
        }
        static async Create(position, collider) {
            const shader = await Shader_15.Shader.Create('shaders/VertexShader.vert', 'shaders/Hero.frag');
            const texture = await TexturePool_14.TexturePool.GetInstance().GetTexture('textures/People1.png');
            return new OldMan(position, shader, texture, collider);
        }
        Draw(proj, view) {
            this.renderer.Draw(proj, view, this.position, 0);
        }
        Move(direction) {
            this.physicsComponent.AddToExternalForce(direction);
        }
        get Position() {
            return this.position;
        }
        get CenterPosition() {
            return gl_matrix_52.vec3.fromValues(this.position[0] + this.visualScale[0] / 2, this.position[1] + this.visualScale[1] / 2, 0);
        }
        async Update(delta) {
            this.Animate(delta);
            this.SetWalkingState();
            this.SetAnimationByFacingDirection();
            this.physicsComponent.Update(delta);
        }
        // TODO: somehow make this part of the animation system
        SetWalkingState() {
            const distanceFromLastPosition = gl_matrix_52.vec3.distance(this.lastPosition, this.position);
            if (distanceFromLastPosition > 0.001) {
                this.animationState = AnimationStates.WALKING;
            }
            else {
                this.animationState = AnimationStates.IDLE;
            }
        }
        SetAnimationByFacingDirection() {
            const direction = gl_matrix_52.vec3.sub(gl_matrix_52.vec3.create(), this.position, this.lastPosition);
            if (direction[0] < 0) {
                this.currentFrameSet = this.leftFacingAnimationFrames;
            }
            else if (direction[0] > 0) {
                this.currentFrameSet = this.rightFacingAnimationFrames;
            }
        }
        Animate(delta) {
            if (this.animationState !== AnimationStates.IDLE) {
                this.animation.Animate(delta, this.currentFrameSet);
            }
        }
        async CollideWithAttack(attack) {
        }
        get EndCondition() {
            return false;
        }
        IsCollidingWith(boundingBox, collideWithUndefined) {
            return boundingBox.IsCollidingWith(this.BoundingBox);
        }
        async Visit(hero) {
        }
        get BoundingBox() {
            const bbPosition = gl_matrix_52.vec3.add(gl_matrix_52.vec3.create(), this.position, this.bbOffset);
            return new BoundingBox_11.BoundingBox(bbPosition, this.bbSize);
        }
        Dispose() {
            this.renderer.Dispose();
            this.shader.Delete();
        }
    }
    exports.OldMan = OldMan;
});
define("Sequence/ISequenceStep", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("Sequence/Sequence", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Sequence = void 0;
    /**
     * A class that manages and executes a sequence of steps defined by {@link ISequenceStep}.
     *
     * Each step is updated sequentially, and the sequence progresses to the next step
     * when the current step is completed. The sequence is considered complete when all
     * steps have finished.
     */
    class Sequence {
        constructor() {
            this.steps = [];
        }
        /**
         * Adds a new step to the sequence.
         *
         * @param step - The step to add, implementing {@link ISequenceStep}.
         * @returns {Sequence} The current sequence instance, allowing for method chaining.
         */
        AddStep(step) {
            this.steps.push(step);
            return this;
        }
        /**
         * Updates the current step in the sequence.
         *
         * If the current step is completed, it is removed from the sequence,
         * and the next step becomes active. This process continues until all steps
         * have been completed.
         *
         * @param delta - The elapsed time since the last update, in milliseconds.
         * @returns {Promise<boolean>} A promise that resolves to:
         *  - `true` if all steps in the sequence have been completed.
         *  - `false` if there are still steps remaining.
         */
        async Update(delta) {
            if (this.steps.length === 0) {
                return true;
            }
            const currentStep = this.steps[0];
            if (await currentStep.Update(delta)) {
                this.steps.shift();
            }
            return false;
        }
    }
    exports.Sequence = Sequence;
});
define("Sequence/ActionStep", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActionStep = void 0;
    /**
     * Generic action step with custom logic. This class typically used for simple, one-liner
     * actions where creating a dedicated class would be excessive.
     *
     * @implements {ISequenceStep}
     */
    class ActionStep {
        /**
         * Creates a new `ActionStep`
         *
         * @param action - A function representing the custom logic for the step.
         * It receives the elapsed time (`delta`) as a parameter and must return a `Promise<boolean>`:
         *  - `true` if the action is complete.
         *  - `false` if the action requires additional updates.
         */
        constructor(action) {
            this.action = action;
        }
        /**
         * @inheritDoc
         */
        async Update(delta) {
            return await this.action(delta);
        }
    }
    exports.ActionStep = ActionStep;
});
define("Sequence/WaitStep", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WaitStep = void 0;
    /**
     * A sequence step that waits for a specified duration before completing.
     *
     * @implements {ISequenceStep}
     */
    class WaitStep {
        /**
         * Creates a new `WaitStep`.
         *
         * @param waitTime - The total time, in seconds, to wait before the step is considered complete.
         */
        constructor(waitTime) {
            this.waitTime = waitTime;
            this.elapsedTime = 0;
        }
        /**
         * Updates the wait step by adding the elapsed `delta` time to the accumulated time.
         * The step completes when the accumulated time exceeds the specified wait time.
         *
         * @param delta - The elapsed time since the last frame, in milliseconds.
         * @returns {Promise<boolean>} A promise that resolves to:
         *  - `true` if the total wait time has been reached or exceeded.
         *  - `false` if the step is still waiting.
         */
        async Update(delta) {
            this.elapsedTime += delta;
            return this.elapsedTime > this.waitTime;
        }
    }
    exports.WaitStep = WaitStep;
});
define("Sequence/SequenceBuilder", ["require", "exports", "Sequence/Sequence", "Sequence/ActionStep", "Sequence/WaitStep"], function (require, exports, Sequence_1, ActionStep_1, WaitStep_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SequenceBuilder = void 0;
    class SequenceBuilder {
        constructor() {
            this.sequence = new Sequence_1.Sequence();
        }
        Add(sequenceStep) {
            this.sequence.AddStep(sequenceStep);
            return this;
        }
        Action(action) {
            this.sequence.AddStep(new ActionStep_1.ActionStep(action));
            return this;
        }
        Wait(waitTime) {
            this.sequence.AddStep(new WaitStep_1.WaitStep(waitTime));
            return this;
        }
        Build() {
            return this.sequence;
        }
    }
    exports.SequenceBuilder = SequenceBuilder;
});
define("Events/OutroEvent", ["require", "exports", "gl-matrix", "Environment", "Actors/OldMan", "SoundEffectPool", "Sequence/SequenceBuilder"], function (require, exports, gl_matrix_53, Environment_11, OldMan_1, SoundEffectPool_14, SequenceBuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutroEvent = void 0;
    class MoveToWaypoint {
        constructor(hero, waypoint, input) {
            this.hero = hero;
            this.waypoint = waypoint;
            this.input = input;
        }
        async Update(delta) {
            const distanceFromWaypoint = gl_matrix_53.vec3.distance(this.waypoint, this.hero.CenterPosition);
            if (distanceFromWaypoint > 0.5) {
                this.hero.Speed = 0.0001;
                this.input.PressKey("right");
                return false;
            }
            else {
                return true;
            }
        }
    }
    class SpawnOldMan {
        constructor(level, oldMan) {
            this.level = level;
            this.oldMan = oldMan;
            this.timeAfterSpawn = 0;
        }
        async Update(delta) {
            // Spawn old man
            if (this.timeAfterSpawn === 0) {
                this.level.AddGameObject(this.oldMan);
            }
            this.timeAfterSpawn += delta;
            return this.timeAfterSpawn > 2000;
        }
    }
    class DragonRoar {
        constructor(_dragonRoar, _game, hero, input) {
            this._dragonRoar = _dragonRoar;
            this._game = _game;
            this.hero = hero;
            this.input = input;
            this.roarFinished = false;
            this._timeSinceFadeOutStarted = 0;
            this.roarStarted = false;
            this._timeSinceRoarStarted = 0;
            this.heroReactedToRoar = false;
            this._fadeState = 0;
        }
        async Update(delta) {
            // Dragon roar
            if (this._timeSinceFadeOutStarted === 0) {
                await this._dragonRoar.Play(1, 1, () => this.roarFinished = true, false);
                this.roarStarted = true;
            }
            this._timeSinceRoarStarted += delta;
            if (this._timeSinceRoarStarted > 500 && !this.heroReactedToRoar) {
                this.heroReactedToRoar = true;
                this.hero.Speed = 0.0005;
                this.input.PressKey("left");
            }
            this._timeSinceFadeOutStarted += delta;
            const fadeStep = 1.0 / (DragonRoar.FADE_OUT_TIME / delta);
            this._fadeState += fadeStep;
            this._game.SetFadeOut(this._fadeState);
            return this.roarFinished;
        }
    }
    DragonRoar.FADE_OUT_TIME = 10000;
    // This is now hardcoded for the last level. In the future this event could be a scriptable event
    // TODO: show picture boxes for the talking characters
    class OutroEvent {
        constructor(hero, camera, level, oldMan, dragonRoar, game, uiService, textBox) {
            this.hero = hero;
            this.camera = camera;
            this.level = level;
            this.oldMan = oldMan;
            this.dragonRoar = dragonRoar;
            this.game = game;
            this.uiService = uiService;
            this.textBox = textBox;
            this.input = this.hero.TakeoverControl();
            this.sequence = this.CreateSequence();
            this.conversationSequence = this.ConversationSequence();
        }
        static async Create(hero, camera, level, game, uiService) {
            const oldMan = await OldMan_1.OldMan.Create(gl_matrix_53.vec3.fromValues(33, 13, 0), level.MainLayer);
            const dragonRoar = await SoundEffectPool_14.SoundEffectPool.GetInstance().GetAudio('audio/wrong_dragon.mp3', false);
            const textbox = await uiService.AddTextbox();
            return new OutroEvent(hero, camera, level, oldMan, dragonRoar, game, uiService, textbox);
        }
        async Update(delta) {
            // Lock camera in position
            const vec = gl_matrix_53.vec3.fromValues(Environment_11.Environment.HorizontalTiles / 2, Environment_11.Environment.VerticalTiles, 0);
            this.camera.LookAtPosition(vec, this.level.MainLayer);
            await this.sequence.Update(delta);
        }
        get CanStart() {
            return true;
        }
        get EventKey() {
            return OutroEvent.EVENT_KEY;
        }
        Dispose() {
            this.level.RemoveGameObject(this.oldMan);
            this.uiService.RemoveTextbox(this.textBox);
        }
        ConversationSequence() {
            return new SequenceBuilder_1.SequenceBuilder()
                .Action(async (_) => {
                this.textBox.WithText('What are you doing here?', this.TextboxPositionForActor(this.oldMan.Position), 0.5);
                return true;
            }).Wait(3000)
                .Action(async (_) => {
                this.textBox.WithText('I\'ve killed the dragon', this.TextboxPositionForActor(this.hero.Position), 0.5);
                return true;
            })
                .Wait(3000)
                .Action(async (_) => {
                this.textBox.WithText('You mean that little lizard down in the valley?', this.TextboxPositionForActor(this.oldMan.Position), 0.5);
                return true;
            }).Wait(3000)
                .Action(async (_) => {
                this.textBox.WithText('We eat those things for breakfast back in the village', this.TextboxPositionForActor(this.oldMan.Position), 0.5);
                return true;
            }).Wait(3000)
                .Action(async (_) => {
                this.textBox.WithText('I\'m afraid you\'ve killed the wrong dragon', this.TextboxPositionForActor(this.oldMan.Position), 0.5);
                return true;
            }).Wait(3000)
                .Action(async (_) => {
                this.textBox.WithText('What do you mean the \"wrong dragon\"?', this.TextboxPositionForActor(this.hero.Position), 0.5);
                return true;
            }).Wait(3000)
                .Build();
        }
        TextboxPositionForActor(actorPosition) {
            return gl_matrix_53.vec2.fromValues(this.uiService.TileWidth * actorPosition[0], this.uiService.TileHeight * actorPosition[1] - this.uiService.TileHeight);
        }
        CreateSequence() {
            return new SequenceBuilder_1.SequenceBuilder()
                .Add(new MoveToWaypoint(this.hero, gl_matrix_53.vec3.fromValues(10, 15, 0), this.input))
                .Action(async (_) => {
                // hero looks back where he came from
                this.hero.Speed = 0.00025;
                this.input.PressKey("left");
                return true;
            })
                .Add(new SpawnOldMan(this.level, this.oldMan))
                .Action(async (_) => {
                // old man moves towards the hero
                const oldManDistanceToHero = gl_matrix_53.vec3.distance(this.oldMan.CenterPosition, this.hero.CenterPosition);
                if (oldManDistanceToHero > 3) {
                    this.oldMan.Move(gl_matrix_53.vec3.fromValues(-0.001, 0, 0));
                    return false;
                }
                return true;
            })
                .Action(async (_) => {
                // Hero looks at the old man
                this.hero.Speed = 0.00005;
                this.input.PressKey("right");
                return true;
            })
                .Action(async (delta) => {
                // Conversation with a lot of text
                return await this.conversationSequence.Update(delta);
            })
                .Add(new DragonRoar(this.dragonRoar, this.game, this.hero, this.input))
                .Action(async (_) => {
                // go to main menu
                await this.game.Quit();
                return true;
            })
                .Action(async (_) => {
                this.hero.ReleaseControl();
                this.hero.Speed = this.hero.DEFAULT_SPEED;
                this.input = null;
                return true;
            })
                .Build();
        }
    }
    exports.OutroEvent = OutroEvent;
    OutroEvent.EVENT_KEY = 'outro_event';
});
define("Level", ["require", "exports", "gl-matrix", "Background", "Layer", "Shader", "SpriteBatch", "TexturePool", "Tile", "SoundEffectPool", "Hero/Hero", "LevelEnd", "Enemies/Dragon/DragonEnemy", "Enemies/SlimeEnemy", "Enemies/Spike", "Enemies/Cactus", "Pickups/CoinObject", "Pickups/HealthPickup", "Events/EscapeEvent", "Events/FreeCameraEvent", "Events/LevelEventTrigger", "Events/Boss/BossEvent", "Events/OutroEvent", "Enemies/IEnemy"], function (require, exports, gl_matrix_54, Background_1, Layer_1, Shader_16, SpriteBatch_4, TexturePool_15, Tile_2, SoundEffectPool_15, Hero_1, LevelEnd_1, DragonEnemy_2, SlimeEnemy_1, Spike_1, Cactus_1, CoinObject_1, HealthPickup_1, EscapeEvent_1, FreeCameraEvent_2, LevelEventTrigger_1, BossEvent_1, OutroEvent_1, IEnemy_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Level = void 0;
    class Level {
        constructor(layers, defaultLayer, loadedTexturePaths, bgShader, bgTexture, music, levelDescriptor, keyHandler, gamepadHandler, uiService, camera, game) {
            this.layers = layers;
            this.defaultLayer = defaultLayer;
            this.loadedTexturePaths = loadedTexturePaths;
            this.bgShader = bgShader;
            this.music = music;
            this.levelDescriptor = levelDescriptor;
            this.keyHandler = keyHandler;
            this.gamepadHandler = gamepadHandler;
            this.uiService = uiService;
            this.camera = camera;
            this.game = game;
            this.events = new Map();
            this.BackgroundViewMatrix = gl_matrix_54.mat4.create();
            this.gameObjects = [];
            this.attack = null;
            this.levelEndSoundPlayed = false;
            // Makes the game "pause" for some time when the level end was reached
            this.updateDisabled = false;
            this.restartEventListeners = [];
            this.nextLevelEventListeners = [];
            this.endConditionsMetEventListeners = [];
            this.Background = new SpriteBatch_4.SpriteBatch(bgShader, [new Background_1.Background()], bgTexture);
            this.loadedTexturePaths.add(bgTexture.Path);
        }
        static async Create(levelName, keyHandler, gamepadHandler, uiService, camera, game) {
            var _a;
            levelName = levelName + '?version=' + Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            const texturePool = TexturePool_15.TexturePool.GetInstance();
            const levelJsonString = await (await fetch(levelName)).text();
            const levelDescriptor = JSON.parse(levelJsonString);
            const texturePaths = new Set();
            const layers = await Promise.all(levelDescriptor.layers.map(async (layer) => {
                const loadedTiles = await Promise.all(layer.tiles.map(async (tile) => {
                    const texture = await texturePool.GetTexture(tile.texture);
                    texturePaths.add(tile.texture);
                    return new Tile_2.Tile(tile.xPos, tile.yPos, texture);
                }));
                return await Layer_1.Layer.Create(loadedTiles, layer.parallaxOffsetFactorX, layer.parallaxOffsetFactorY, layer.layerOffsetX, layer.layerOffsetY);
            }));
            const bgShader = await Shader_16.Shader.Create('shaders/VertexShader.vert', 'shaders/FragmentShader.frag');
            const bgTexture = await TexturePool_15.TexturePool.GetInstance().GetTexture(levelDescriptor.background);
            const music = levelDescriptor.music ? await SoundEffectPool_15.SoundEffectPool.GetInstance()
                .GetAudio(levelDescriptor.music, true) : null;
            return new Level(layers, (_a = levelDescriptor.defaultLayer) !== null && _a !== void 0 ? _a : 0, texturePaths, bgShader, bgTexture, music, levelDescriptor, keyHandler, gamepadHandler, uiService, camera, game);
        }
        get Hero() {
            return this.hero;
        }
        Draw(projectionMatrix) {
            this.Background.Draw(projectionMatrix, this.BackgroundViewMatrix);
            this.layers.forEach((layer, i) => {
                var _a;
                const cameraTranslation = gl_matrix_54.mat4.getTranslation(gl_matrix_54.vec3.create(), this.camera.ViewMatrix);
                const layerMatrix = gl_matrix_54.mat4.clone(this.camera.ViewMatrix);
                const xOffset = (i - this.defaultLayer) * cameraTranslation[0] * layer.ParallaxOffsetFactorX + layer.LayerOffsetX;
                const yOffset = ((i - this.defaultLayer) * cameraTranslation[1] * layer.ParallaxOffsetFactorY) + layer.LayerOffsetY;
                const parallaxOffset = gl_matrix_54.vec3.fromValues(xOffset, yOffset, 0);
                gl_matrix_54.mat4.translate(layerMatrix, layerMatrix, parallaxOffset);
                layer.Draw(projectionMatrix, layerMatrix);
                if (i === this.defaultLayer) {
                    this.gameObjects.forEach(h => h.Draw(projectionMatrix, this.camera.ViewMatrix));
                    (_a = this.attack) === null || _a === void 0 ? void 0 : _a.Draw(projectionMatrix, this.camera.ViewMatrix);
                    this.hero.Draw(projectionMatrix, this.camera.ViewMatrix);
                }
            });
        }
        async Update(delta) {
            var _a;
            if (!this.updateDisabled) {
                await this.hero.Update(delta);
                // Kill the hero if fallen into a pit
                if (this.MainLayer.IsUnder(this.hero.BoundingBox)) {
                    this.hero.Kill();
                }
                // Handle collisions between hero projectile(s) and game objects.
                await ((_a = this.attack) === null || _a === void 0 ? void 0 : _a.Update(delta));
                if (this.attack && !this.attack.AlreadyHit) {
                    const attack = this.attack;
                    // Do not collide with any other game objects, only with enemies
                    const enemiesCollidingWithProjectile = this.gameObjects.filter(e => e.IsCollidingWith(attack.BoundingBox, false) && e instanceof IEnemy_5.EnemyBase);
                    // Pushback force does not necessarily mean the amount of pushback. A big enemy can ignore a sword attack for example
                    for (const e of enemiesCollidingWithProjectile) {
                        await e.CollideWithAttack(attack);
                    }
                    if (enemiesCollidingWithProjectile.length) {
                        await attack.OnHit();
                    }
                }
                const outsideObjects = [];
                for (const gameObject of this.gameObjects) {
                    await gameObject.Update(delta);
                    if (gameObject.IsCollidingWith(this.hero.BoundingBox, false)) {
                        await gameObject.Visit(this.hero);
                    }
                    // Despawn out-of-bounds game objects. These will be projectiles most of the time.
                    // Modify the array only after the loop
                    if (this.MainLayer.IsOutsideBoundary(gameObject.BoundingBox)) {
                        outsideObjects.push(gameObject);
                        gameObject.Dispose();
                    }
                }
                this.gameObjects = this.gameObjects.filter(o => !outsideObjects.includes(o));
                await this.activeEvent.Update(delta);
                this.CheckForEndCondition();
            }
        }
        get MainLayer() {
            return this.layers[this.defaultLayer];
        }
        ChangeEvent(eventName) {
            const event = this.events.get(eventName);
            if (event && event.CanStart) {
                this.activeEvent = event;
            }
        }
        async PlayMusic(volume) {
            var _a;
            await ((_a = this.music) === null || _a === void 0 ? void 0 : _a.Play(1, volume, null, true));
        }
        StopMusic() {
            var _a;
            (_a = this.music) === null || _a === void 0 ? void 0 : _a.Stop();
        }
        async ChangeMusic(music, volume) {
            var _a;
            if (this.music !== music) {
                (_a = this.music) === null || _a === void 0 ? void 0 : _a.Stop();
                this.music = music;
                await music.Play(1, volume, null, true);
            }
        }
        SetMusicVolume(volume) {
            if (this.music) {
                volume = Math.max(0, Math.min(1, volume));
                this.music.Volume = volume;
            }
        }
        GetMusicVolume() {
            var _a, _b;
            return (_b = (_a = this.music) === null || _a === void 0 ? void 0 : _a.Volume) !== null && _b !== void 0 ? _b : 0;
        }
        CheckForEndCondition() {
            const numberOfEndConditions = this.gameObjects.filter(p => p.EndCondition).length;
            if (numberOfEndConditions === 0 && !this.levelEndSoundPlayed) {
                this.levelEndSoundPlayed = true;
                this.endConditionsMetEventListeners.forEach(l => l.OnEndConditionsMet());
            }
            else if (numberOfEndConditions > 0) {
                // The already met end condition can be lost when a new enemy spawns
                this.levelEndSoundPlayed = false;
                this.endConditionsMetEventListeners.forEach(l => l.OnEndConditionsLost());
            }
        }
        async RestartLevel() {
            // reset layer state (offset and default layer collision state for now)
            this.layers.forEach(layer => layer.ResetState());
            this.endConditionsMetEventListeners = [];
            this.hero.Dispose();
            await this.InitHero();
            this.gameObjects.forEach(o => o.Dispose());
            this.gameObjects = [];
            await this.InitGameObjects();
            this.updateDisabled = false;
            this.levelEndSoundPlayed = false;
            this.events.forEach(e => e.Dispose());
            this.events.clear();
            await this.InitEvents();
        }
        async InitLevel() {
            this.restartEventListeners.forEach(l => l.OnRestartEvent());
            await this.PlayMusic(0.6);
            await this.InitHero();
            // init layers -- recreate based on level descriptor
            await this.InitGameObjects();
            await this.InitEvents();
            this.updateDisabled = false;
            this.levelEndSoundPlayed = false;
            this.camera.LookAtPosition(gl_matrix_54.vec3.clone(this.hero.Position), this.MainLayer);
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
            this.hero = await Hero_1.Hero.Create(gl_matrix_54.vec3.fromValues(this.levelDescriptor.start.xPos - 0.9, this.levelDescriptor.start.yPos - 1.91, 1), // shift heroes spawn position by the height of its bounding box
            gl_matrix_54.vec2.fromValues(3, 3), this.MainLayer, async () => await this.RestartLevel(), (sender, projectile) => {
                this.attack = projectile;
                projectile.SubscribeToHitEvent(this);
            }, this.keyHandler, this.gamepadHandler);
        }
        async CreateGameObject(descriptor) {
            switch (descriptor.type) {
                case 'coin':
                    return await CoinObject_1.CoinObject.Create(gl_matrix_54.vec3.fromValues(descriptor.xPos, descriptor.yPos, 1), (c) => this.RemoveGameObject(c));
                case 'health':
                    return await HealthPickup_1.HealthPickup.Create(gl_matrix_54.vec3.fromValues(descriptor.xPos, descriptor.yPos - 1, 1), (c) => this.RemoveGameObject(c));
                case 'spike':
                    return await Spike_1.Spike.Create(gl_matrix_54.vec3.fromValues(descriptor.xPos, descriptor.yPos, 1), gl_matrix_54.vec2.fromValues(1, 1));
                case 'cactus':
                    return await Cactus_1.Cactus.Create(gl_matrix_54.vec3.fromValues(descriptor.xPos, descriptor.yPos - 2, 1), (c) => this.RemoveGameObject(c));
                case 'slime':
                    return await SlimeEnemy_1.SlimeEnemy.Create(gl_matrix_54.vec3.fromValues(descriptor.xPos, descriptor.yPos - 1.8, 1), gl_matrix_54.vec2.fromValues(3, 3), this.MainLayer, (c) => this.RemoveGameObject(c));
                case 'dragon':
                    // Dragon as a regular enemy
                    return await DragonEnemy_2.DragonEnemy.Create(gl_matrix_54.vec3.fromValues(descriptor.xPos, descriptor.yPos - 4, 1), 15, gl_matrix_54.vec2.fromValues(5, 5), this.MainLayer, this.hero, // To track where the hero is, I want to move as much of the game logic from the update loop as possible
                    async (sender) => {
                        this.RemoveGameObject(sender);
                    }, // onDeath
                    // Spawn projectile
                    (_, projectile) => {
                        this.SpawnProjectile(projectile);
                    }, null);
                case 'escape_trigger':
                    return new LevelEventTrigger_1.LevelEventTrigger(this, gl_matrix_54.vec3.fromValues(descriptor.xPos, descriptor.yPos, 1), EscapeEvent_1.EscapeEvent.EVENT_KEY);
                case 'boss_trigger':
                    return new LevelEventTrigger_1.LevelEventTrigger(this, gl_matrix_54.vec3.fromValues(descriptor.xPos, descriptor.yPos, 1), BossEvent_1.BossEvent.EVENT_KEY);
                case 'end': {
                    const end = await LevelEnd_1.LevelEnd.Create(gl_matrix_54.vec3.fromValues(descriptor.xPos - 1, descriptor.yPos, 0), async () => {
                        for (const listener of this.nextLevelEventListeners) {
                            // Disable all exits when after interacting any of them
                            const allEnds = this.gameObjects.filter(o => o instanceof LevelEnd_1.LevelEnd);
                            allEnds.forEach(e => e.Interacted = true);
                            await listener.OnNextLevelEvent(this.levelDescriptor.nextLevel);
                        }
                    }, this);
                    this.SubscribeToEndConditionsMetEvent(end);
                    return end;
                }
                default:
                    throw new Error('Unknown object type');
            }
        }
        AddGameObject(toAdd) {
            if (toAdd)
                this.gameObjects.push(toAdd);
        }
        RemoveGameObject(toRemove) {
            this.gameObjects = this.gameObjects.filter(e => e !== toRemove);
            toRemove.Dispose();
        }
        SpawnProjectile(projectile) {
            this.gameObjects.push(projectile);
            // Subscribe to the hit event of a projectile to be able to despawn the projectile that hit
            projectile.SubscribeToHitEvent(this);
        }
        DespawnAttack(attack) {
            if (attack === this.attack) {
                this.attack = null;
                attack === null || attack === void 0 ? void 0 : attack.Dispose();
            }
        }
        async InitEvents() {
            const events = this.levelDescriptor.events ? await Promise.all(this.levelDescriptor.events.map(async (e) => await this.CreateLevelEvent(e)))
                : [];
            events.forEach(e => this.events.set(e.EventKey, e));
            const freeCamEvent = new FreeCameraEvent_2.FreeCameraEvent(this.camera, this.MainLayer, this.hero);
            this.events.set(FreeCameraEvent_2.FreeCameraEvent.EVENT_KEY, freeCamEvent);
            const initialEvent = this.levelDescriptor.initialEventKey;
            const event = this.events.get(initialEvent);
            if (!event) {
                this.activeEvent = this.events.get(FreeCameraEvent_2.FreeCameraEvent.EVENT_KEY);
                return;
            }
            this.activeEvent = this.events.get(initialEvent);
        }
        async CreateLevelEvent(descriptor) {
            switch (descriptor.type) {
                case EscapeEvent_1.EscapeEvent.EVENT_KEY:
                    const eventLayer = this.layers[descriptor.props['eventLayerId']];
                    const eventLayerStopPosition = descriptor.props['eventLayerStopPosition'];
                    const eventLayerSpeed = descriptor.props['eventLayerSpeed'];
                    const cameraStopPosition = descriptor.props['cameraStopPosition'];
                    const cameraSpeed = descriptor.props['cameraSpeed'];
                    return await EscapeEvent_1.EscapeEvent.Create(this.camera, eventLayer, this.MainLayer, this.hero, eventLayerStopPosition, eventLayerSpeed, cameraStopPosition, cameraSpeed);
                case BossEvent_1.BossEvent.EVENT_KEY:
                    const spawnPosition = {
                        x: descriptor.props['spawnX'],
                        y: descriptor.props['spawnY']
                    };
                    const bossPosition = gl_matrix_54.vec3.fromValues(spawnPosition.x, spawnPosition.y, 0);
                    const enterWaypoint = {
                        x: descriptor.props['enterWaypointX'],
                        y: descriptor.props['enterWaypointY']
                    };
                    const bossHealth = descriptor.props['health'];
                    return await BossEvent_1.BossEvent.Create(this, this.hero, this.uiService, bossPosition, bossHealth, this.camera, enterWaypoint);
                case OutroEvent_1.OutroEvent.EVENT_KEY:
                    return await OutroEvent_1.OutroEvent.Create(this.hero, this.camera, this, this.game, this.uiService);
                default:
                    throw new Error('Unknown event type');
            }
        }
        async InitGameObjects() {
            const objects = await Promise.all(this.levelDescriptor.gameObjects.map(async (o) => await this.CreateGameObject(o)));
            this.gameObjects.push(...objects);
        }
        Dispose() {
            var _a;
            // Events can spawn and de-spawn entities.
            // Generally to avoid double Dispose events if an event spawned an entity the event should release it.
            // To make sure that happens events should be disposed first and the generic game objects later
            this.events.forEach(e => e.Dispose());
            this.events.clear();
            this.bgShader.Delete();
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
            this.StopMusic();
            TexturePool_15.TexturePool.GetInstance().RemoveAllIn([...this.loadedTexturePaths]);
        }
    }
    exports.Level = Level;
});
define("MainScreen", ["require", "exports", "gl-matrix", "Background", "SpriteBatch", "Shader", "TexturePool", "XBoxControllerKeys", "SoundEffectPool", "Keys", "Textbox"], function (require, exports, gl_matrix_55, Background_2, SpriteBatch_5, Shader_17, TexturePool_16, XBoxControllerKeys_2, SoundEffectPool_16, Keys_2, Textbox_4) {
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
            this.textProjMat = gl_matrix_55.mat4.ortho(gl_matrix_55.mat4.create(), 0, width, height, 0, -1, 1);
        }
        static async Create(keyboardHandler, gamepadHandler, width, height) {
            const background = new Background_2.Background();
            const texture = await TexturePool_16.TexturePool.GetInstance().GetTexture('textures/title.jpeg');
            const shader = await Shader_17.Shader.Create('shaders/VertexShader.vert', 'shaders/FragmentShader.frag');
            const batch = new SpriteBatch_5.SpriteBatch(shader, [background], texture);
            const sound = await SoundEffectPool_16.SoundEffectPool.GetInstance().GetAudio('audio/ui2.mp3', false);
            const dimensions = await Textbox_4.Textbox.PrecalculateDimensions('Consolas', 'Press start or Enter to begin', 1);
            const pressStartText = (await Textbox_4.Textbox.Create('Consolas')).WithText('Press start or Enter to begin', gl_matrix_55.vec2.fromValues(width / 2 - dimensions.width / 2, height - 120), 1);
            return new MainScreen(batch, shader, gamepadHandler, keyboardHandler, sound, pressStartText, width, height);
        }
        Draw(proj) {
            this.batch.Draw(proj, gl_matrix_55.mat4.create());
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
                await this.sound.Play();
                this.currentTime = 0;
                for (const startListener of this.startEventListeners) {
                    await startListener.Start();
                }
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
        async Update(delta, shared) {
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
        constructor(context, keyhandler, gamepadHandler, resumeListeners, menuSound, selectSound, selectedIndex) {
            super(2, keyhandler, gamepadHandler, menuSound, selectSound);
            this.context = context;
            this.resumeListeners = resumeListeners;
            this.selectedIndex = selectedIndex;
        }
        Enter() {
        }
        Exit() {
        }
        async Update(delta, shared) {
            await super.Update(delta, shared);
            if ((this.keyHandler.IsPressed(Keys_4.Keys.S) || this.gamepadHandler.IsPressed(XBoxControllerKeys_4.XBoxControllerKeys.DOWN))
                && shared.elapsedTimeSinceKeypress > this.keyPressWaitTime) {
                await this.menuSound.Play(1, 0.5);
                shared.elapsedTimeSinceKeypress = 0;
                this.selectedIndex++;
                if (this.selectedIndex >= this.numberOfItems) {
                    this.selectedIndex = 0;
                }
            }
            else if ((this.keyHandler.IsPressed(Keys_4.Keys.W) || this.gamepadHandler.IsPressed(XBoxControllerKeys_4.XBoxControllerKeys.UP))
                && shared.elapsedTimeSinceKeypress > this.keyPressWaitTime) {
                await this.menuSound.Play(1, 0.5);
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
                await this.selectSound.Play();
                if (this.selectedIndex === 0) { // resume
                    this.resumeListeners.forEach(l => l.Resume());
                }
                else if (this.selectedIndex === 1) { // quit
                    this.context.ChangeState(this.context.QUIT_SELECTION_STATE());
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
        async Update(delta, shared) {
            await super.Update(delta, shared);
            if ((this.keyHandler.IsPressed(Keys_5.Keys.A) || this.gamepadHandler.IsPressed(XBoxControllerKeys_5.XBoxControllerKeys.LEFT))
                && shared.elapsedTimeSinceKeypress > this.keyPressWaitTime) {
                await this.menuSound.Play(1, 0.5);
                shared.elapsedTimeSinceKeypress = 0;
                this.selectedIndex--;
                if (this.selectedIndex < 0) {
                    this.selectedIndex = this.numberOfItems - 1;
                }
            }
            else if ((this.keyHandler.IsPressed(Keys_5.Keys.D) || this.gamepadHandler.IsPressed(XBoxControllerKeys_5.XBoxControllerKeys.RIGHT))
                && shared.elapsedTimeSinceKeypress > this.keyPressWaitTime) {
                await this.menuSound.Play(1, 0.5);
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
                await this.selectSound.Play();
                shared.keyWasReleased = false;
                if (this.selectedIndex === 0) { // yes
                    this.context.SelectedIndex = 0;
                    for (const listener of this.quitListeners) {
                        await listener.Quit();
                    }
                }
                this.context.ChangeState(this.context.MAIN_SELECTION_STATE());
            }
            this.context.SubSelectionIndex = this.selectedIndex;
        }
    }
    exports.QuitMenuState = QuitMenuState;
});
define("PauseScreen/PauseScreen", ["require", "exports", "Background", "gl-matrix", "Textbox", "SpriteBatch", "Shader", "SoundEffectPool", "PauseScreen/MainSelectionState", "PauseScreen/QuitMenuState"], function (require, exports, Background_3, gl_matrix_56, Textbox_5, SpriteBatch_6, Shader_18, SoundEffectPool_17, MainSelectionState_1, QuitMenuState_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PauseScreen = void 0;
    class PauseScreen {
        MAIN_SELECTION_STATE() {
            return new MainSelectionState_1.MainSelectionState(this, this.keyHandler, this.gamepadHandler, this.resumeEventListeners, this.menuSound, this.selectSound, this.selectedIndex);
        }
        QUIT_SELECTION_STATE() {
            return new QuitMenuState_1.QuitMenuState(this, this.keyHandler, this.gamepadHandler, this.quitEventListeners, this.menuSound, this.selectSound);
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
            this.selectedIndex = 0;
            this.resumeEventListeners = [];
            this.quitEventListeners = [];
            this.state = this.MAIN_SELECTION_STATE();
            this.subselectionIndex = 0;
            this.sharedVariables = {
                elapsedTimeSinceKeypress: 0,
                keyWasReleased: false
            };
            this.textProjMat = gl_matrix_56.mat4.ortho(gl_matrix_56.mat4.create(), 0, width, height, 0, -1, 1);
            this.selection = [resumeTextbox, quitTextbox];
            this.subSelection = [yesTextbox, noTextbox];
        }
        static async Create(width, height, keyHandler, gamepadHandler) {
            const pausedText = "Paused";
            const pausedTextDimensions = await Textbox_5.Textbox.PrecalculateDimensions('Consolas', pausedText, 1);
            const pausedTextBox = (await Textbox_5.Textbox.Create('Consolas'))
                .WithText(pausedText, gl_matrix_56.vec2.fromValues(width / 2 - pausedTextDimensions.width / 2, height / 4), 1);
            const resumeText = "Resume";
            const resumeTextDimensions = await Textbox_5.Textbox.PrecalculateDimensions('Consolas', resumeText, 0.5);
            const resumeTextBox = (await Textbox_5.Textbox.Create('Consolas'))
                .WithText(resumeText, gl_matrix_56.vec2.fromValues(width / 2 - resumeTextDimensions.width / 2, height / 4 + resumeTextDimensions.height * 3), 0.5);
            const quitText = "Quit";
            const quitTextDimensions = await Textbox_5.Textbox.PrecalculateDimensions('Consolas', quitText, 0.5);
            const quitTextBox = (await Textbox_5.Textbox.Create('Consolas')).WithText(quitText, gl_matrix_56.vec2.fromValues(width / 2 - quitTextDimensions.width / 2, height / 4 + quitTextDimensions.height * 4), 0.5);
            const areYouSureText = "Are you sure?";
            const areYouSureDimensions = await Textbox_5.Textbox.PrecalculateDimensions('Consolas', areYouSureText, 0.5);
            const areYouSureTextBox = ((await Textbox_5.Textbox.Create('Consolas')).WithText(areYouSureText, gl_matrix_56.vec2.fromValues(width / 2 - areYouSureDimensions.width / 2, height / 4 + areYouSureDimensions.height * 5), 0.5));
            const yesNoDimensions = await Textbox_5.Textbox.PrecalculateDimensions('Consolas', 'Yes No', 0.5);
            const spaceDimensions = await Textbox_5.Textbox.PrecalculateDimensions('Consolas', ' ', 0.5);
            const yesTextBox = ((await Textbox_5.Textbox.Create('Consolas')).WithText('Yes', gl_matrix_56.vec2.fromValues(width / 2 - yesNoDimensions.width / 2, height / 4 + yesNoDimensions.height * 6), 0.5));
            const noTextBox = ((await Textbox_5.Textbox.Create('Consolas')).WithText('No', gl_matrix_56.vec2.fromValues(width / 2 + spaceDimensions.width, height / 4 + yesNoDimensions.height * 6), 0.5));
            const menuSound = await SoundEffectPool_17.SoundEffectPool.GetInstance().GetAudio('audio/cursor1.wav');
            const selectSound = await SoundEffectPool_17.SoundEffectPool.GetInstance().GetAudio('audio/pause.mp3');
            const shader = await Shader_18.Shader.Create('shaders/VertexShader.vert', 'shaders/Colored.frag');
            shader.SetVec4Uniform('clr', gl_matrix_56.vec4.fromValues(0, 0, 0, 0.8));
            const background = new Background_3.Background();
            const batch = new SpriteBatch_6.SpriteBatch(shader, [background], null);
            return new PauseScreen(width, height, batch, shader, pausedTextBox, resumeTextBox, quitTextBox, areYouSureTextBox, yesTextBox, noTextBox, keyHandler, gamepadHandler, menuSound, selectSound);
        }
        Draw(proj) {
            this.batch.Draw(proj, gl_matrix_56.mat4.create());
            this.pausedTextbox.Draw(this.textProjMat);
            this.selection.forEach(s => s.WithSaturation(0).WithValue(0.3));
            this.selection[this.selectedIndex].WithHue(1).WithSaturation(0).WithValue(1);
            this.resumeTextbox.Draw(this.textProjMat);
            this.quitTextbox.Draw(this.textProjMat);
            if (this.state instanceof QuitMenuState_1.QuitMenuState) {
                this.subSelection.forEach(s => s.WithSaturation(0).WithValue(0.3));
                this.subSelection[this.subselectionIndex].WithHue(1).WithSaturation(0).WithValue(1);
                this.areYouSureTextbox.Draw(this.textProjMat);
                this.yesTextbox.Draw(this.textProjMat);
                this.noTextbox.Draw(this.textProjMat);
            }
        }
        async Update(elapsed) {
            await this.state.Update(elapsed, this.sharedVariables);
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
define("RenderTarget", ["require", "exports", "WebGLUtils"], function (require, exports, WebGLUtils_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenderTarget = void 0;
    class RenderTarget {
        constructor(_texture) {
            this._texture = _texture;
            const id = WebGLUtils_5.gl.createFramebuffer();
            if (!id) {
                throw new Error('Could not create framebuffer');
            }
            this._framebufferId = id;
            WebGLUtils_5.gl.bindFramebuffer(WebGLUtils_5.gl.FRAMEBUFFER, id);
            WebGLUtils_5.gl.framebufferTexture2D(WebGLUtils_5.gl.FRAMEBUFFER, WebGLUtils_5.gl.COLOR_ATTACHMENT0, WebGLUtils_5.gl.TEXTURE_2D, _texture.GetTexture(), 0);
            if (WebGLUtils_5.gl.checkFramebufferStatus(WebGLUtils_5.gl.FRAMEBUFFER) !== WebGLUtils_5.gl.FRAMEBUFFER_COMPLETE) {
                throw new Error("Error while creating framebuffer");
            }
            WebGLUtils_5.gl.bindFramebuffer(WebGLUtils_5.gl.FRAMEBUFFER, null);
        }
        Render(renderCode) {
            WebGLUtils_5.gl.bindFramebuffer(WebGLUtils_5.gl.FRAMEBUFFER, this._framebufferId);
            WebGLUtils_5.gl.viewport(0, 0, this._texture.Width, this._texture.Height);
            renderCode();
            WebGLUtils_5.gl.bindFramebuffer(WebGLUtils_5.gl.FRAMEBUFFER, null);
        }
        get Texture() {
            return this._texture;
        }
        Dispose() {
            WebGLUtils_5.gl.bindFramebuffer(WebGLUtils_5.gl.FRAMEBUFFER, null);
            WebGLUtils_5.gl.deleteFramebuffer(this._framebufferId);
        }
    }
    exports.RenderTarget = RenderTarget;
});
define("Game", ["require", "exports", "gl-matrix", "Environment", "Level", "WebGLUtils", "Keys", "SoundEffectPool", "XBoxControllerKeys", "TexturePool", "MainScreen", "PauseScreen/PauseScreen", "UIService", "Camera", "RenderTarget", "Texture", "SpriteBatch", "Shader", "Sprite", "Utils", "ResourceTracker"], function (require, exports, gl_matrix_57, Environment_12, Level_1, WebGLUtils_6, Keys_6, SoundEffectPool_18, XBoxControllerKeys_6, TexturePool_17, MainScreen_1, PauseScreen_1, UIService_1, Camera_1, RenderTarget_1, Texture_2, SpriteBatch_7, Shader_19, Sprite_19, Utils_18, ResourceTracker_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Game = void 0;
    // TODO: time to implement a proper state machine at least for the game object
    // TODO: check for key presses and elapsed time since state change
    // TODO: sometimes key release check is also necessary for a state change
    var State;
    (function (State) {
        State["START_SCREEN"] = "start_screen";
        State["IN_GAME"] = "in_game";
        State["PAUSED"] = "paused";
    })(State || (State = {}));
    // TODO: camera smoothing - the camera should not follow the hero, but a position that moves with the hero but at a slower rate
    //  like MatchHeroPosition in dragon
    // TODO: shake camera when attack hit
    // TODO: ui builder framework
    // TODO: flip sprite
    // TODO: recheck every vector passing. Sometimes vectors need to be cloned
    // TODO: update ts version
    // TODO: texture map padding
    class Game {
        constructor(keyHandler, gamepadHandler, uiService, healthTextbox, scoreTextbox, mainScreen, pauseScreen, pauseSoundEffect, _backgroundShader) {
            this.keyHandler = keyHandler;
            this.gamepadHandler = gamepadHandler;
            this.uiService = uiService;
            this.healthTextbox = healthTextbox;
            this.scoreTextbox = scoreTextbox;
            this.mainScreen = mainScreen;
            this.pauseScreen = pauseScreen;
            this.pauseSoundEffect = pauseSoundEffect;
            this._backgroundShader = _backgroundShader;
            this.projectionMatrix = gl_matrix_57.mat4.ortho(gl_matrix_57.mat4.create(), 0, Environment_12.Environment.HorizontalTiles, Environment_12.Environment.VerticalTiles, 0, -1, 1);
            this.state = State.START_SCREEN;
            this.level = null;
            this.musicVolumeStack = [];
            this.keyWasReleased = true;
            this.elapsedTimeSinceStateChange = 0;
            this.camera = new Camera_1.Camera(gl_matrix_57.vec3.create());
            this.Width = window.innerWidth;
            this.Height = window.innerHeight;
            WebGLUtils_6.gl.blendFunc(WebGLUtils_6.gl.SRC_ALPHA, WebGLUtils_6.gl.ONE_MINUS_SRC_ALPHA);
            WebGLUtils_6.gl.viewport(0, 0, this.Width, this.Height);
            WebGLUtils_6.gl.clearColor(0, 0, 0, 1);
            mainScreen === null || mainScreen === void 0 ? void 0 : mainScreen.SubscribeToStartEvent(this);
            pauseScreen === null || pauseScreen === void 0 ? void 0 : pauseScreen.SubscribeToResumeEvent(this);
            pauseScreen === null || pauseScreen === void 0 ? void 0 : pauseScreen.SubscribeToQuitEvent(this);
            this._fullScreenSprite = new Sprite_19.Sprite(Utils_18.Utils.DefaultFullscreenQuadVertices, Utils_18.Utils.DefaultFullscreenQuadTextureCoordinates);
            this._renderTargetTexture = Texture_2.Texture.empty(this.Width, this.Height);
            this._renderTarget = new RenderTarget_1.RenderTarget(this._renderTargetTexture);
            this._finalImage = new SpriteBatch_7.SpriteBatch(this._backgroundShader, [this._fullScreenSprite], this._renderTargetTexture);
            this.start = performance.now();
        }
        Dispose() {
            var _a;
            this.mainScreen.Dispose();
            this.pauseScreen.Dispose();
            (_a = this.level) === null || _a === void 0 ? void 0 : _a.Dispose();
            this.uiService.Dispose();
            this._renderTarget.Dispose();
        }
        async OnNextLevelEvent(levelName) {
            const oldLevel = this.level;
            oldLevel === null || oldLevel === void 0 ? void 0 : oldLevel.StopMusic();
            oldLevel === null || oldLevel === void 0 ? void 0 : oldLevel.Dispose();
            this.level = null;
            const nextLevel = await Level_1.Level.Create(levelName, this.keyHandler, this.gamepadHandler, this.uiService, this.camera, this);
            nextLevel.SubscribeToNextLevelEvent(this);
            nextLevel.SubscribeToRestartEvent(this);
            await nextLevel.InitLevel();
            this.level = nextLevel;
        }
        OnRestartEvent() {
        }
        static async Create(keyHandler, controllerHandler) {
            const canvas = document.getElementById('canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            WebGLUtils_6.WebGLUtils.CreateGLRenderingContext(canvas);
            await SoundEffectPool_18.SoundEffectPool.GetInstance().Preload();
            await TexturePool_17.TexturePool.GetInstance().Preload();
            const bgShader = await Shader_19.Shader.Create('shaders/VertexShader.vert', 'shaders/FragmentShader.frag');
            const uiService = new UIService_1.UIService(canvas.width, canvas.height);
            const healthTextbox = await uiService.AddTextbox();
            const scoreTextBox = await uiService.AddTextbox();
            const pauseSoundEffect = await SoundEffectPool_18.SoundEffectPool.GetInstance().GetAudio('audio/pause.mp3');
            const mainScreen = await MainScreen_1.MainScreen.Create(keyHandler, controllerHandler, canvas.width, canvas.height);
            const pauseScreen = await PauseScreen_1.PauseScreen.Create(canvas.width, canvas.height, keyHandler, controllerHandler);
            return new Game(keyHandler, controllerHandler, uiService, healthTextbox, scoreTextBox, mainScreen, pauseScreen, pauseSoundEffect, bgShader);
        }
        async Start() {
            const level = await Level_1.Level.Create('levels/level1.json', this.keyHandler, this.gamepadHandler, this.uiService, this.camera, this);
            level.SubscribeToNextLevelEvent(this);
            level.SubscribeToRestartEvent(this);
            this.level = level;
            if (this.state === State.START_SCREEN) {
                await this.level.InitLevel();
                this.state = State.IN_GAME;
                this.elapsedTimeSinceStateChange = 0;
            }
            ResourceTracker_4.ResourceTracker.GetInstance().StartTracking();
        }
        async Quit() {
            var _a, _b;
            (_a = this.level) === null || _a === void 0 ? void 0 : _a.StopMusic();
            (_b = this.level) === null || _b === void 0 ? void 0 : _b.Dispose();
            this.level = null;
            this.state = State.START_SCREEN;
            this.camera = new Camera_1.Camera(gl_matrix_57.vec3.create());
            SoundEffectPool_18.SoundEffectPool.GetInstance().StopAll();
            this.SetFadeOut(0);
            ResourceTracker_4.ResourceTracker.GetInstance().StopTracking();
            return Promise.resolve();
        }
        async Pause() {
            // TODO: state machine: Only can go to paused from ingame
            if (this.state === State.IN_GAME) {
                this.state = State.PAUSED;
                await this.pauseSoundEffect.Play();
                this.elapsedTimeSinceStateChange = 0;
                this.musicVolumeStack.push(this.level.GetMusicVolume());
                this.level.SetMusicVolume(this.musicVolumeStack.slice(-1)[0] * 0.15);
            }
        }
        Resume() {
            // TODO: statemachine move state
            this.state = State.IN_GAME;
            this.elapsedTimeSinceStateChange = 0;
            this.level.SetMusicVolume(this.musicVolumeStack.pop());
        }
        SetFadeOut(value) {
            this._backgroundShader.SetFloatUniform('fadeFactor', value);
        }
        async Run() {
            const end = performance.now();
            const elapsed = Math.min(end - this.start, 32);
            this.start = end;
            this.Render(elapsed);
            await this.Update(elapsed);
            requestAnimationFrame(this.Run.bind(this));
        }
        Render(elapsedTime) {
            var _a;
            WebGLUtils_6.gl.clear(WebGLUtils_6.gl.COLOR_BUFFER_BIT | WebGLUtils_6.gl.DEPTH_BUFFER_BIT);
            (_a = this._renderTarget) === null || _a === void 0 ? void 0 : _a.Render(() => {
                var _a, _b, _c;
                if (this.state === State.START_SCREEN) {
                    (_a = this.mainScreen) === null || _a === void 0 ? void 0 : _a.Draw(this.projectionMatrix);
                }
                else {
                    (_b = this.level) === null || _b === void 0 ? void 0 : _b.Draw(this.projectionMatrix);
                    this.uiService.Draw(elapsedTime);
                    if (this.state === State.PAUSED) {
                        // Draw the pause screen over the other rendered elements
                        (_c = this.pauseScreen) === null || _c === void 0 ? void 0 : _c.Draw(this.projectionMatrix);
                    }
                }
            });
            this._finalImage.Draw(this.projectionMatrix, gl_matrix_57.mat4.create());
        }
        async Update(elapsedTime) {
            this.elapsedTimeSinceStateChange += elapsedTime;
            if (this.state === State.START_SCREEN) {
                await this.mainScreen.Update(elapsedTime);
            }
            else if (this.state === State.IN_GAME && this.elapsedTimeSinceStateChange > 150 && this.level) {
                if (!this.keyHandler.IsPressed(Keys_6.Keys.ENTER) && !this.gamepadHandler.IsPressed(XBoxControllerKeys_6.XBoxControllerKeys.START)
                    && !this.keyWasReleased && this.elapsedTimeSinceStateChange > 100) {
                    this.keyWasReleased = true;
                }
                if ((this.keyHandler.IsPressed(Keys_6.Keys.ENTER) || this.gamepadHandler.IsPressed(XBoxControllerKeys_6.XBoxControllerKeys.START))
                    && this.keyWasReleased && this.elapsedTimeSinceStateChange > 100) {
                    await this.Pause();
                    this.keyWasReleased = false;
                }
                const healthTextColor = (() => {
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
                    .WithText(`Health: ${this.level.Hero.Health}`, gl_matrix_57.vec2.fromValues(10, 0), 0.5)
                    .WithHue(healthTextColor.hue)
                    .WithSaturation(healthTextColor.saturation)
                    .WithValue(healthTextColor.value);
                this.scoreTextbox
                    .WithText(`Coins: ${this.level.Hero.CollectedCoins}`, gl_matrix_57.vec2.fromValues(10, this.healthTextbox.Height), 0.5);
                await this.level.Update(elapsedTime);
            }
            else if (this.state === State.PAUSED) {
                await this.pauseScreen.Update(elapsedTime);
            }
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
            const specialKeys = [Keys_7.Keys.LEFT_CONTROL, Keys_7.Keys.RIGHT_CONTROL, Keys_7.Keys.SPACE, Keys_7.Keys.LEFT_SHIFT, Keys_7.Keys.RIGHT_SHIFT,
                Keys_7.Keys.LEFT_ARROW, Keys_7.Keys.RIGHT_ARROW, Keys_7.Keys.UP_ARROW, Keys_7.Keys.DOWN_ARROW];
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
        document.addEventListener('visibilitychange', async () => {
            if (document.hidden) {
                await game.Pause();
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