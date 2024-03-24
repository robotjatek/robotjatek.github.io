define(["require", "exports", "./Texture"], function (require, exports, Texture_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TexturePool {
        constructor() {
            this.Textures = new Map();
        }
        static GetInstance() {
            if (!this.Instance) {
                this.Instance = new TexturePool();
            }
            return this.Instance;
        }
        GetTexture(path) {
            const texture = this.Textures.get(path);
            if (!texture) {
                const created = new Texture_1.Texture(path);
                this.Textures.set(path, created);
                return created;
            }
            return texture;
        }
        ClearPool() {
            this.Textures.forEach((value) => {
                value.Delete();
            });
            this.Textures.clear();
        }
    }
    exports.TexturePool = TexturePool;
});
