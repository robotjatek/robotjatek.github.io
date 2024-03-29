define(["require", "exports", "./WebGLUtils"], function (require, exports, WebGLUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Shader {
        constructor(vertexPath, fragmentPath) {
            const vertexId = this.LoadShader(vertexPath, WebGLUtils_1.gl.VERTEX_SHADER);
            const fragment = this.LoadShader(fragmentPath, WebGLUtils_1.gl.FRAGMENT_SHADER);
            this.program = this.createProgram(vertexId, fragment);
            WebGLUtils_1.gl.deleteShader(vertexId);
            WebGLUtils_1.gl.deleteShader(fragment);
            this.valid = true;
        }
        Use() {
            if (!this.valid) {
                throw new Error("Trying to use a deleted shader program!");
            }
            WebGLUtils_1.gl.useProgram(this.program);
        }
        GetProgram() {
            if (!this.valid) {
                throw new Error("Trying to get a deleted shader program!");
            }
            return this.program;
        }
        Delete() {
            this.valid = false;
            WebGLUtils_1.gl.deleteProgram(this.program);
        }
        SetUniform(name, value) {
            this.Use();
            const location = WebGLUtils_1.gl.getUniformLocation(this.program, name);
            WebGLUtils_1.gl.uniform2fv(location, value);
        }
        createProgram(vertexId, fragment) {
            const program = WebGLUtils_1.gl.createProgram();
            WebGLUtils_1.gl.attachShader(program, vertexId);
            WebGLUtils_1.gl.attachShader(program, fragment);
            WebGLUtils_1.gl.linkProgram(program);
            WebGLUtils_1.gl.detachShader(program, vertexId);
            WebGLUtils_1.gl.detachShader(program, fragment);
            return program;
        }
        LoadShader(elementPath, type) {
            const id = WebGLUtils_1.gl.createShader(type);
            const src = this.GetSourceFromUrl(elementPath);
            WebGLUtils_1.gl.shaderSource(id, src);
            WebGLUtils_1.gl.compileShader(id);
            const error = WebGLUtils_1.gl.getShaderInfoLog(id);
            if (error !== undefined && error.length > 0) {
                throw new Error(`Failed to compile shader (${elementPath}): ` + error);
            }
            return id;
        }
        GetSourceFromUrl(url) {
            const req = new XMLHttpRequest();
            req.open("GET", url, false);
            req.overrideMimeType("text/plain");
            req.send(null);
            return req.responseText;
        }
    }
    exports.Shader = Shader;
});
