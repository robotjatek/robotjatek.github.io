define(["require", "exports", "gl-matrix", "./Shader", "./Sprite", "./SpriteBatch", "./TexturePool", "./Utils"], function (require, exports, gl_matrix_1, Shader_1, Sprite_1, SpriteBatch_1, TexturePool_1, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var State;
    (function (State) {
        State[State["IDLE"] = 0] = "IDLE";
        State[State["WALK"] = 1] = "WALK";
    })(State || (State = {}));
    class Hero {
        // TODO: bounding box
        constructor(initialPosition, size) {
            this.state = State.IDLE;
            this.currentFrameTime = 0;
            this.currentAnimationFrame = 0;
            this.lastPosition = gl_matrix_1.vec3.fromValues(0, 0, 1);
            this.position = gl_matrix_1.vec3.fromValues(0, 0, 1);
            this.size = gl_matrix_1.vec2.fromValues(1, 1);
            this.texture = TexturePool_1.TexturePool.GetInstance().GetTexture('hero1.png');
            this.position = initialPosition;
            this.size = size;
            this.sprite = new Sprite_1.Sprite(Utils_1.Utils.DefaultSpriteVertices, 
            // TODO: parametrize tex coords
            Utils_1.Utils.CreateTextureCoordinates(// texture-offset is added to these coordinates, so it must be (0,0)
            0.0 / 12.0, 0.0 / 8.0, 1.0 / 12.0, 1.0 / 8.0));
            this.sprite.textureOffset = gl_matrix_1.vec2.fromValues(1 / 12.0, 1 / 8.0);
            this.batch = new SpriteBatch_1.SpriteBatch(new Shader_1.Shader('shaders/VertexShader.vert', 'shaders/FragmentShader.frag'), [this.sprite], this.texture);
        }
        Draw(proj, view) {
            this.batch.Draw(proj, view); // TODO: model matrix here?
            gl_matrix_1.mat4.translate(this.batch.ModelMatrix, gl_matrix_1.mat4.create(), this.position);
            gl_matrix_1.mat4.scale(this.batch.ModelMatrix, this.batch.ModelMatrix, gl_matrix_1.vec3.fromValues(this.size[0], this.size[1], 1));
        }
        Update(delta) {
            this.currentFrameTime += delta;
            if (this.currentFrameTime > 132) {
                if (this.state == State.WALK) {
                    let dir = gl_matrix_1.vec3.create();
                    gl_matrix_1.vec3.subtract(dir, this.position, this.lastPosition);
                    if (gl_matrix_1.vec3.length(dir) > 0) {
                        this.sprite.textureOffset = this.calculateTextureOffset(gl_matrix_1.vec2.fromValues(dir[0], dir[1]));
                    }
                    else {
                        // same position as last frame, so it is considered idle
                        this.state = State.IDLE;
                        // Reset back to the idle frame of the last movement direction
                        // Now it is completly dependent on the currently used texture
                        this.sprite.textureOffset = gl_matrix_1.vec2.fromValues(1 / 12.0, this.sprite.textureOffset[1]);
                    }
                }
            }
            gl_matrix_1.vec3.copy(this.lastPosition, this.position);
        }
        MoveRight(delta) {
            this.state = State.WALK;
            gl_matrix_1.vec3.add(this.position, this.position, gl_matrix_1.vec3.fromValues(0.01 * delta, 0, 0));
        }
        MoveLeft(delta) {
            this.state = State.WALK;
            gl_matrix_1.vec3.add(this.position, this.position, gl_matrix_1.vec3.fromValues(-0.01 * delta, 0, 0));
        }
        calculateTextureOffset(direction) {
            if (direction[0] > 0) {
                const offset = gl_matrix_1.vec2.fromValues(this.currentAnimationFrame++ / 12.0, 1.0 / 8.0);
                if (this.currentAnimationFrame == 3) {
                    this.currentAnimationFrame = 0;
                }
                this.currentFrameTime = 0;
                return offset;
            }
            else if (direction[0] < 0) {
                const offset = gl_matrix_1.vec2.fromValues(this.currentAnimationFrame++ / 12.0, 3.0 / 8.0);
                if (this.currentAnimationFrame == 3) {
                    this.currentAnimationFrame = 0;
                }
                this.currentFrameTime = 0;
                return offset;
            }
            // Shouln't reach this point
            console.error("Should have reached this point");
            this.state = State.IDLE;
            return gl_matrix_1.vec2.create();
        }
    }
    exports.Hero = Hero;
});
