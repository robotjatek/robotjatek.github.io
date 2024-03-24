define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Tile {
        constructor(positionX, positionY, texture) {
            this.positionX = positionX;
            this.positionY = positionY;
            this.texture = texture;
        }
        get Texture() {
            return this.texture;
        }
        get PositionX() {
            return this.positionX;
        }
        get PositionY() {
            return this.positionY;
        }
    }
    exports.Tile = Tile;
});
