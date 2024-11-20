"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStage = void 0;
var GameStage;
(function (GameStage) {
    GameStage[GameStage["NONE"] = 0] = "NONE";
    GameStage[GameStage["WAITING"] = 1] = "WAITING";
    GameStage[GameStage["ROLLING"] = 2] = "ROLLING";
    GameStage[GameStage["FINISHED"] = 3] = "FINISHED";
})(GameStage || (exports.GameStage = GameStage = {}));
