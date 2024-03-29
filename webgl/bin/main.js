define(["require", "exports", "domready", "./Game", "./KeyHandler", "./Keys"], function (require, exports, domready, Game_1, KeyHandler_1, Keys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    domready(() => {
        const keyHandler = new KeyHandler_1.KeyHandler();
        const game = new Game_1.Game(keyHandler);
        const canvas = document.getElementById("canvas");
        canvas.addEventListener("keydown", (event) => {
            keyHandler.SetKey(event.code, true);
            if (event.code == Keys_1.Keys.SPACE) {
                event.preventDefault();
            }
        }, false);
        canvas.addEventListener("keyup", (event) => {
            keyHandler.SetKey(event.code, false);
            if (event.code == Keys_1.Keys.SPACE) {
                event.preventDefault();
            }
        }, false);
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                game.Pause();
            }
            else {
                game.Play();
            }
        });
        canvas.focus();
        game.Run();
    });
});
