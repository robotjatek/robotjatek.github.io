define(["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
