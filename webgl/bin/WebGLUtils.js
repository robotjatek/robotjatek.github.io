define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WebGLUtils {
        static CreateGLRenderingContext(canvas) {
            exports.gl = canvas.getContext("webgl2");
        }
    }
    exports.WebGLUtils = WebGLUtils;
});
