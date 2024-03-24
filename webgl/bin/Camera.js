define(["require", "exports", "gl-matrix"], function (require, exports, gl_matrix_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Camera {
        constructor() {
            this.ViewMatrix = gl_matrix_1.mat4.create();
        }
        GetViewMatrix() {
            return this.ViewMatrix;
        }
        Move(direction) {
            gl_matrix_1.mat4.translate(this.ViewMatrix, this.ViewMatrix, direction);
        }
    }
    exports.Camera = Camera;
});
