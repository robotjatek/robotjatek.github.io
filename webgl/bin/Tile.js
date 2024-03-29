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
        isPointInside(point) {
            // A tile is always 1x1
            const minX = this.positionX;
            const maxX = this.positionX + 1;
            const minY = this.positionY;
            const maxY = this.positionY + 1;
            return point[0] >= minX && point[0] <= maxX &&
                point[1] >= minY && point[1] <= maxY;
        }
        isCollindingWith(boundingBox) {
            // A tile is always 1x1
            const minX = this.positionX;
            const maxX = this.positionX + 1;
            const minY = this.positionY;
            const maxY = this.positionY + 1;
            const bbMinX = boundingBox.position[0];
            const bbMaxX = boundingBox.position[0] + boundingBox.size[0];
            const bbMinY = boundingBox.position[1];
            const bbMaxY = boundingBox.position[1] + boundingBox.size[1];
            return bbMinX < maxX && bbMaxX > minX &&
                bbMinY < maxY && bbMaxY > minY;
        }
    }
    exports.Tile = Tile;
});
