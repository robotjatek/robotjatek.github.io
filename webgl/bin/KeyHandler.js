define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KeyHandler {
        constructor() {
            this.keys = new Map();
        }
        SetKey(code, state) {
            this.keys.set(code, state);
        }
        IsPressed(code) {
            if (this.keys.has(code)) {
                return this.keys.get(code);
            }
            return false;
        }
    }
    exports.KeyHandler = KeyHandler;
});
