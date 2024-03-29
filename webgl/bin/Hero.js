define(["require", "exports", "gl-matrix", "./Shader", "./Sprite", "./SpriteBatch", "./TexturePool", "./Utils", "./BoundingBox"], function (require, exports, gl_matrix_1, Shader_1, Sprite_1, SpriteBatch_1, TexturePool_1, Utils_1, BoundingBox_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var State;
    (function (State) {
        State["IDLE"] = "idle";
        State["WALK"] = "walk";
    })(State || (State = {}));
    class Hero {
        constructor(position, visualScale, collider) {
            this.position = position;
            this.visualScale = visualScale;
            this.collider = collider;
            this.state = State.IDLE;
            this.currentFrameTime = 0;
            this.currentAnimationFrame = 0;
            this.lastPosition = gl_matrix_1.vec3.fromValues(0, 0, 1);
            this.velocity = gl_matrix_1.vec3.fromValues(0, 0, 0);
            // TODO: make bb variables parametrizable
            this.bbOffset = gl_matrix_1.vec3.fromValues(1.2, 1.1, 0);
            this.bbSize = gl_matrix_1.vec2.fromValues(0.8, 1.8);
            this.shader = new Shader_1.Shader('shaders/VertexShader.vert', 'shaders/FragmentShader.frag');
            this.jumping = false;
            this.onGround = true;
            this.texture = TexturePool_1.TexturePool.GetInstance().GetTexture('hero1.png');
            this.sprite = new Sprite_1.Sprite(Utils_1.Utils.DefaultSpriteVertices, 
            // TODO: parametrize tex coords
            Utils_1.Utils.CreateTextureCoordinates(// texture-offset is added to these coordinates, so it must be (0,0)
            0.0 / 12.0, // These constants are hardcoded with "hero1.png" in mind
            0.0 / 8.0, 1.0 / 12.0, 1.0 / 8.0));
            this.sprite.textureOffset = gl_matrix_1.vec2.fromValues(1 / 12.0, 1 / 8.0);
            this.batch = new SpriteBatch_1.SpriteBatch(this.shader, [this.sprite], this.texture);
        }
        get BoundingBox() {
            return new BoundingBox_1.BoundingBox(gl_matrix_1.vec3.add(gl_matrix_1.vec3.create(), this.position, this.bbOffset), this.bbSize);
        }
        Draw(proj, view) {
            this.batch.Draw(proj, view); // TODO: model matrix here?
            gl_matrix_1.mat4.translate(this.batch.ModelMatrix, gl_matrix_1.mat4.create(), this.position);
            gl_matrix_1.mat4.scale(this.batch.ModelMatrix, this.batch.ModelMatrix, gl_matrix_1.vec3.fromValues(this.visualScale[0], this.visualScale[1], 1));
        }
        Update(delta) {
            this.currentFrameTime += delta;
            if (this.currentFrameTime > 132) {
                if (this.state == State.WALK) {
                    const dir = gl_matrix_1.vec3.create();
                    gl_matrix_1.vec3.subtract(dir, this.position, this.lastPosition);
                    if (gl_matrix_1.vec3.squaredLength(dir) > 0) {
                        this.sprite.textureOffset = this.calculateTextureOffset(gl_matrix_1.vec2.fromValues(dir[0], dir[1]));
                    }
                    else {
                        // same position as last frame, so it is considered idle
                        this.state = State.IDLE;
                        // Reset back to the idle frame of the last movement direction
                        // Now it is completly dependent on the currently used texture
                        // TODO: create a texture independent configuration for animation states
                        this.sprite.textureOffset = gl_matrix_1.vec2.fromValues(1 / 12.0, this.sprite.textureOffset[1]);
                    }
                }
            }
            gl_matrix_1.vec3.copy(this.lastPosition, this.position);
            if (this.velocity[1] === 0) {
                this.jumping = false;
            }
            const gravity = gl_matrix_1.vec3.fromValues(0, 0.00004, 0);
            gl_matrix_1.vec3.add(this.velocity, this.velocity, gl_matrix_1.vec3.scale(gl_matrix_1.vec3.create(), gravity, delta));
            const moveValue = gl_matrix_1.vec3.create();
            gl_matrix_1.vec3.scale(moveValue, this.velocity, delta);
            gl_matrix_1.vec3.add(this.position, this.position, moveValue);
            const colliding = this.collider.IsCollidingWidth(this.BoundingBox);
            if (colliding) {
                this.state = State.IDLE;
                gl_matrix_1.vec3.copy(this.position, this.lastPosition);
                this.velocity = gl_matrix_1.vec3.create();
                this.onGround = true;
            }
            else {
                this.onGround = false;
            }
        }
        MoveRight(delta) {
            this.state = State.WALK;
            const nextPosition = gl_matrix_1.vec3.fromValues(this.position[0] + 0.01 * delta, this.position[1], this.position[2]);
            if (!this.checkCollision(nextPosition)) {
                this.position = nextPosition;
            }
        }
        MoveLeft(delta) {
            this.state = State.WALK;
            const nextPosition = gl_matrix_1.vec3.fromValues(this.position[0] - 0.01 * delta, this.position[1], this.position[2]);
            if (!this.checkCollision(nextPosition)) {
                this.position = nextPosition;
            }
        }
        Jump() {
            if (!this.jumping && this.onGround) {
                this.velocity[1] = -0.02;
                this.jumping = true;
            }
        }
        checkCollision(nextPosition) {
            const nextBoundingBox = new BoundingBox_1.BoundingBox(gl_matrix_1.vec3.add(gl_matrix_1.vec3.create(), nextPosition, this.bbOffset), this.bbSize);
            return this.collider.IsCollidingWidth(nextBoundingBox);
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
            // Remain in the current animation frame if a correct frame could not be determined
            return this.sprite.textureOffset;
        }
    }
    exports.Hero = Hero;
});
