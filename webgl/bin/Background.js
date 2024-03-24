define(["require", "exports", "./Environment", "./Sprite"], function (require, exports, Environment_1, Sprite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Background extends Sprite_1.Sprite {
        constructor() {
            const vertices = [
                0.0, 0.0, 0.0,
                Environment_1.Environment.HorizontalTiles, 0.0, 0.0,
                0, Environment_1.Environment.VerticalTiles, 0.0,
                0, Environment_1.Environment.VerticalTiles, 0.0,
                Environment_1.Environment.HorizontalTiles, 0, 0.0,
                Environment_1.Environment.HorizontalTiles, Environment_1.Environment.VerticalTiles, 0.0,
            ];
            super(vertices, [
                0, 0,
                1, 0,
                0, 1,
                0, 1,
                1, 0,
                1, 1,
            ]);
        }
    }
    exports.Background = Background;
});
