define(["require", "exports", "gl-matrix", "./AnimatedSprite", "./Camera", "./Environment", "./Level", "./Shader", "./SpriteBatch", "./TexturePool", "./Utils", "./WebGLUtils", "./Hero", "./Keys"], function (require, exports, gl_matrix_1, AnimatedSprite_1, Camera_1, Environment_1, Level_1, Shader_1, SpriteBatch_1, TexturePool_1, Utils_1, WebGLUtils_1, Hero_1, Keys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // TODO: update ts version
    // TODO: render bounding boxes in debug mode
    class Game {
        constructor(keyhandler) {
            this.projectionMatrix = gl_matrix_1.mat4.create();
            this.camera = new Camera_1.Camera();
            this.paused = false;
            this.Width = window.innerWidth;
            this.Height = window.innerHeight;
            this.Canvas = document.getElementById('canvas');
            this.Canvas.width = this.Width;
            this.Canvas.height = this.Height;
            this.KeyHandler = keyhandler;
            this.projectionMatrix = gl_matrix_1.mat4.ortho(this.projectionMatrix, 0, Environment_1.Environment.HorizontalTiles, Environment_1.Environment.VerticalTiles, 0, -1, 1);
            WebGLUtils_1.WebGLUtils.CreateGLRenderingContext(this.Canvas);
            WebGLUtils_1.gl.disable(WebGLUtils_1.gl.DEPTH_TEST);
            WebGLUtils_1.gl.viewport(0, 0, this.Width, this.Height);
            WebGLUtils_1.gl.clearColor(0, 1, 0, 1);
            this.level = new Level_1.Level('');
            this.start = new Date();
            const texture = TexturePool_1.TexturePool.GetInstance().GetTexture('coin.png');
            this.animSprite = new AnimatedSprite_1.AnimatedSprite(Utils_1.Utils.CreateSpriteVertices(10, 10), Utils_1.Utils.CreateTextureCoordinates(0, 0, 1.0 / 10, 1.0));
            this.animatedCoinBatch = new SpriteBatch_1.SpriteBatch(new Shader_1.Shader('shaders/VertexShader.vert', 'shaders/FragmentShader.frag'), [this.animSprite], texture);
            // TODO: texture map padding
            this.hero = new Hero_1.Hero(gl_matrix_1.vec3.fromValues(0, Environment_1.Environment.VerticalTiles - 6, 1), gl_matrix_1.vec2.fromValues(3, 3), this.level.MainLayer);
        }
        Run() {
            const end = new Date();
            const elapsed = end.getTime() - this.start.getTime();
            this.start = end;
            this.Render(elapsed);
            if (!this.paused) {
                this.Update(elapsed);
            }
        }
        Pause() {
            this.paused = true;
        }
        Play() {
            this.paused = false;
        }
        Render(elapsedTime) {
            WebGLUtils_1.gl.clear(WebGLUtils_1.gl.COLOR_BUFFER_BIT | WebGLUtils_1.gl.DEPTH_BUFFER_BIT);
            this.level.Draw(this.projectionMatrix, this.camera.GetViewMatrix());
            this.animatedCoinBatch.Draw(this.projectionMatrix, this.camera.GetViewMatrix());
            this.hero.Draw(this.projectionMatrix, this.camera.GetViewMatrix());
            this.animSprite.Animate(elapsedTime);
            requestAnimationFrame(this.Run.bind(this));
        }
        Update(elapsedTime) {
            this.hero.Update(elapsedTime);
            // TODO: collide with other objects
            if (this.KeyHandler.IsPressed(Keys_1.Keys.A)) {
                this.hero.MoveLeft(elapsedTime);
            }
            else if (this.KeyHandler.IsPressed(Keys_1.Keys.D)) {
                this.hero.MoveRight(elapsedTime);
            }
            if (this.KeyHandler.IsPressed(Keys_1.Keys.SPACE)) {
                this.hero.Jump();
            }
        }
    }
    exports.Game = Game;
});
