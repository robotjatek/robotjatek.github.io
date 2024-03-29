define(["require", "exports", "gl-matrix", "./Camera", "./Environment", "./Level", "./WebGLUtils", "./Hero", "./Keys", "./CoinObject"], function (require, exports, gl_matrix_1, Camera_1, Environment_1, Level_1, WebGLUtils_1, Hero_1, Keys_1, CoinObject_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // TODO: update ts version
    // TODO: render bounding boxes in debug mode
    class Game {
        constructor(keyhandler) {
            this.projectionMatrix = gl_matrix_1.mat4.create();
            this.camera = new Camera_1.Camera();
            this.coins = [];
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
            this.coins.push(new CoinObject_1.CoinObject(gl_matrix_1.vec3.fromValues(10, 10, 0)));
            this.coins.push(new CoinObject_1.CoinObject(gl_matrix_1.vec3.fromValues(12, 10, 0)));
            this.coins.push(new CoinObject_1.CoinObject(gl_matrix_1.vec3.fromValues(14, Environment_1.Environment.VerticalTiles - 3, 0)));
            this.coins.push(new CoinObject_1.CoinObject(gl_matrix_1.vec3.fromValues(15, Environment_1.Environment.VerticalTiles - 3, 0)));
            this.coins.push(new CoinObject_1.CoinObject(gl_matrix_1.vec3.fromValues(16, Environment_1.Environment.VerticalTiles - 3, 0)));
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
            this.coins.forEach(coin => {
                coin.Draw(this.projectionMatrix, this.camera.GetViewMatrix());
                coin.Update(elapsedTime);
            });
            this.hero.Draw(this.projectionMatrix, this.camera.GetViewMatrix());
            requestAnimationFrame(this.Run.bind(this));
        }
        Update(elapsedTime) {
            this.hero.Update(elapsedTime);
            // Remove colliding coin from the list
            this.coins = this.coins.filter((coin) => !coin.IsCollidingWidth(this.hero.BoundingBox));
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
