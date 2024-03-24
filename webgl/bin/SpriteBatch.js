define(["require", "exports", "gl-matrix", "./WebGLUtils"], function (require, exports, gl_matrix_1, WebGLUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SpriteBatch {
        constructor(shader, sprites, texture) {
            this.ModelMatrix = gl_matrix_1.mat4.create();
            this.BatchShader = shader;
            this.Texture = texture;
            this.Vertices = [];
            this.TextureCoordinates = [];
            sprites.forEach((sprite) => {
                this.Vertices = this.Vertices.concat(sprite.Vertices);
                this.TextureCoordinates = this.TextureCoordinates.concat(sprite.TextureCoordinates);
                this.spr = sprite;
            });
            this.ModelMatrix = gl_matrix_1.mat4.identity(this.ModelMatrix);
            this.VertexBuffer = WebGLUtils_1.gl.createBuffer();
            WebGLUtils_1.gl.bindBuffer(WebGLUtils_1.gl.ARRAY_BUFFER, this.VertexBuffer);
            WebGLUtils_1.gl.bufferData(WebGLUtils_1.gl.ARRAY_BUFFER, new Float32Array(this.Vertices), WebGLUtils_1.gl.STATIC_DRAW);
            this.TextureCoordinateBuffer = WebGLUtils_1.gl.createBuffer();
            WebGLUtils_1.gl.bindBuffer(WebGLUtils_1.gl.ARRAY_BUFFER, this.TextureCoordinateBuffer);
            WebGLUtils_1.gl.bufferData(WebGLUtils_1.gl.ARRAY_BUFFER, new Float32Array(this.TextureCoordinates), WebGLUtils_1.gl.STATIC_DRAW);
        }
        Draw(projectionMatrix, viewMatrix) {
            const shaderProgram = this.BatchShader.GetProgram();
            this.BatchShader.Use();
            const attribLocation = WebGLUtils_1.gl.getAttribLocation(this.BatchShader.GetProgram(), "a_pos");
            const textureCoordinateAttribLocation = WebGLUtils_1.gl.getAttribLocation(this.BatchShader.GetProgram(), "a_texture_coordinate");
            WebGLUtils_1.gl.activeTexture(WebGLUtils_1.gl.TEXTURE0);
            WebGLUtils_1.gl.bindTexture(WebGLUtils_1.gl.TEXTURE_2D, this.Texture.GetTexture());
            WebGLUtils_1.gl.bindBuffer(WebGLUtils_1.gl.ARRAY_BUFFER, this.VertexBuffer);
            WebGLUtils_1.gl.enableVertexAttribArray(attribLocation);
            WebGLUtils_1.gl.vertexAttribPointer(attribLocation, 3, WebGLUtils_1.gl.FLOAT, false, 0, 0);
            WebGLUtils_1.gl.bindBuffer(WebGLUtils_1.gl.ARRAY_BUFFER, this.TextureCoordinateBuffer);
            WebGLUtils_1.gl.enableVertexAttribArray(textureCoordinateAttribLocation);
            WebGLUtils_1.gl.vertexAttribPointer(textureCoordinateAttribLocation, 2, WebGLUtils_1.gl.FLOAT, false, 0, 0);
            const projectionLocation = WebGLUtils_1.gl.getUniformLocation(shaderProgram, "projection");
            WebGLUtils_1.gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
            const viewLocation = WebGLUtils_1.gl.getUniformLocation(shaderProgram, "view");
            WebGLUtils_1.gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
            const modelLocation = WebGLUtils_1.gl.getUniformLocation(shaderProgram, "model");
            WebGLUtils_1.gl.uniformMatrix4fv(modelLocation, false, this.ModelMatrix);
            const textureLocation = WebGLUtils_1.gl.getUniformLocation(shaderProgram, "u_sampler");
            WebGLUtils_1.gl.uniform1i(textureLocation, 0);
            const textureOffsetLocation = WebGLUtils_1.gl.getUniformLocation(shaderProgram, "textureOffset");
            WebGLUtils_1.gl.uniform2fv(textureOffsetLocation, this.spr.textureOffset);
            WebGLUtils_1.gl.enable(WebGLUtils_1.gl.BLEND);
            WebGLUtils_1.gl.blendFunc(WebGLUtils_1.gl.SRC_ALPHA, WebGLUtils_1.gl.ONE_MINUS_SRC_ALPHA);
            WebGLUtils_1.gl.drawArrays(WebGLUtils_1.gl.TRIANGLES, 0, this.Vertices.length / 3);
            WebGLUtils_1.gl.disableVertexAttribArray(attribLocation);
            WebGLUtils_1.gl.disableVertexAttribArray(textureCoordinateAttribLocation);
            WebGLUtils_1.gl.disable(WebGLUtils_1.gl.BLEND);
        }
    }
    exports.SpriteBatch = SpriteBatch;
});
