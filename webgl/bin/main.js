define(["require", "exports", "domready", "./Game", "./KeyHandler"], function (require, exports, domready, Game_1, KeyHandler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    domready(() => {
        const keyHandler = new KeyHandler_1.KeyHandler();
        const game = new Game_1.Game(keyHandler);
        const canvas = document.getElementById("canvas");
        canvas.addEventListener("keydown", (event) => {
            keyHandler.SetKey(event.key, true);
        }, false);
        canvas.addEventListener("keyup", (event) => {
            keyHandler.SetKey(event.key, false);
        }, false);
        game.Run();
    });
});
