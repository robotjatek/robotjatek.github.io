define(["require", "exports", "./WebGLUtils"], function (require, exports, WebGLUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Texture {
        constructor(path) {
            this.texture = WebGLUtils_1.gl.createTexture();
            WebGLUtils_1.gl.bindTexture(WebGLUtils_1.gl.TEXTURE_2D, this.texture);
            WebGLUtils_1.gl.texParameteri(WebGLUtils_1.gl.TEXTURE_2D, WebGLUtils_1.gl.TEXTURE_MIN_FILTER, WebGLUtils_1.gl.NEAREST_MIPMAP_LINEAR);
            WebGLUtils_1.gl.texParameteri(WebGLUtils_1.gl.TEXTURE_2D, WebGLUtils_1.gl.TEXTURE_MAG_FILTER, WebGLUtils_1.gl.NEAREST);
            WebGLUtils_1.gl.texParameteri(WebGLUtils_1.gl.TEXTURE_2D, WebGLUtils_1.gl.TEXTURE_WRAP_S, WebGLUtils_1.gl.CLAMP_TO_EDGE);
            WebGLUtils_1.gl.texParameteri(WebGLUtils_1.gl.TEXTURE_2D, WebGLUtils_1.gl.TEXTURE_WRAP_T, WebGLUtils_1.gl.CLAMP_TO_EDGE);
            WebGLUtils_1.gl.texImage2D(WebGLUtils_1.gl.TEXTURE_2D, 0, WebGLUtils_1.gl.RGBA, 1, 1, 0, WebGLUtils_1.gl.RGBA, WebGLUtils_1.gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
            const image = new Image();
            image.onload = () => {
                WebGLUtils_1.gl.bindTexture(WebGLUtils_1.gl.TEXTURE_2D, this.texture);
                WebGLUtils_1.gl.texImage2D(WebGLUtils_1.gl.TEXTURE_2D, 0, WebGLUtils_1.gl.RGBA, WebGLUtils_1.gl.RGBA, WebGLUtils_1.gl.UNSIGNED_BYTE, image);
                WebGLUtils_1.gl.generateMipmap(WebGLUtils_1.gl.TEXTURE_2D);
                this.height = image.height;
                this.width = image.width;
            };
            image.src = Texture.TexturesFolder + path;
            this.valid = true;
        }
        GetTexture() {
            if (!this.valid) {
                throw new Error("Trying to get a deleted texture!");
            }
            return this.texture;
        }
        Delete() {
            WebGLUtils_1.gl.deleteTexture(this.texture);
        }
        get Width() {
            return this.width;
        }
        get Height() {
            return this.height;
        }
    }
    Texture.TexturesFolder = "textures/";
    exports.Texture = Texture;
});
