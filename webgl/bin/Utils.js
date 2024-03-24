define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Utils {
        static CreateSpriteVertices(positionX, positionY) {
            return [
                positionX, positionY, 0.0,
                positionX + 1.0, positionY, 0.0,
                positionX, positionY + 1.0, 0.0,
                positionX, positionY + 1.0, 0.0,
                positionX + 1.0, positionY, 0.0,
                positionX + 1.0, positionY + 1.0, 0.0,
            ];
        }
        static CreateTextureCoordinates(positionX, positionY, width, height) {
            return [
                positionX, positionY,
                positionX + width, positionY,
                positionX, positionY + height,
                positionX, positionY + height,
                positionX + width, positionY,
                positionX + width, positionY + height,
            ];
        }
    }
    Utils.DefaultSpriteVertices = [
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        0, 1.0, 0.0,
        0, 1.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 1.0, 0.0,
    ];
    Utils.DefaultSpriteTextureCoordinates = [
        0, 0,
        1, 0,
        0, 1,
        0, 1,
        1, 0,
        1, 1,
    ];
    exports.Utils = Utils;
});
