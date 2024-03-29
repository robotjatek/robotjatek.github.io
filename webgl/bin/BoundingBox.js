define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BoundingBox {
        constructor(position, size) {
            this.position = position;
            this.size = size;
        }
    }
    exports.BoundingBox = BoundingBox;
});
