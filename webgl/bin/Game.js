define(["require", "exports", "gl-matrix", "./AnimatedSprite", "./Camera", "./Environment", "./Level", "./Shader", "./SpriteBatch", "./TexturePool", "./Utils", "./WebGLUtils", "./Hero"], function (require, exports, gl_matrix_1, AnimatedSprite_1, Camera_1, Environment_1, Level_1, Shader_1, SpriteBatch_1, TexturePool_1, Utils_1, WebGLUtils_1, Hero_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Game {
        constructor(keyhandler) {
            this.FrameCount = 0;
            this.projectionMatrix = gl_matrix_1.mat4.create();
            this.camera = new Camera_1.Camera();
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
            this.hero = new Hero_1.Hero(gl_matrix_1.vec3.fromValues(0, Environment_1.Environment.VerticalTiles - 5, 1), gl_matrix_1.vec2.fromValues(3, 3));
        }
        Run() {
            const end = new Date();
            const elapsed = end.getTime() - this.start.getTime();
            this.start = end;
            this.Render();
            this.Update(elapsed);
        }
        Render() {
            WebGLUtils_1.gl.clear(WebGLUtils_1.gl.COLOR_BUFFER_BIT | WebGLUtils_1.gl.DEPTH_BUFFER_BIT);
            this.level.Draw(this.projectionMatrix, this.camera.GetViewMatrix());
            this.animatedCoinBatch.Draw(this.projectionMatrix, this.camera.GetViewMatrix());
            this.hero.Draw(this.projectionMatrix, this.camera.GetViewMatrix());
            requestAnimationFrame(this.Run.bind(this));
        }
        Update(elapsedTime) {
            this.hero.Update(elapsedTime);
            if (this.KeyHandler.IsPressed('a')) {
                this.hero.MoveLeft(elapsedTime);
            }
            else if (this.KeyHandler.IsPressed('d')) {
                this.hero.MoveRight(elapsedTime);
            }
            this.animSprite.Update(elapsedTime);
            this.FrameCount++;
        }
    }
    exports.Game = Game;
});
