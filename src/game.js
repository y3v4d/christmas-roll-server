"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StateSchema_1 = require("./schema/StateSchema");
var Game = /** @class */ (function () {
    function Game() {
        this.MAX_USERS = 6;
        this.state = {
            users: [],
            currentTurn: "",
            stage: StateSchema_1.GameStage.NONE,
            rolled: []
        };
    }
    Game.prototype.start = function () {
        if (this.state.stage != StateSchema_1.GameStage.NONE) {
            throw new Error("game already started");
        }
        this.progress();
    };
    Game.prototype.roll = function () {
        var _this = this;
        if (this.state.stage != StateSchema_1.GameStage.WAITING) {
            throw new Error("not waiting for rolls");
        }
        var user = this.state.users.find(function (u) { return u.username === _this.state.currentTurn; });
        if (!user) {
            throw new Error("no user to roll");
        }
        var rolled = this._rollFor(user);
        if (!rolled) {
            throw new Error("no user to roll");
        }
        user.rolled = rolled.username;
        this.state.rolled.push(rolled.username);
        this.state.stage = StateSchema_1.GameStage.ROLLING;
    };
    Game.prototype.progress = function () {
        if (this.state.stage != StateSchema_1.GameStage.NONE && this.state.stage != StateSchema_1.GameStage.ROLLING) {
            throw new Error("not waiting for progress");
        }
        var nextUser = this._getNextUser();
        if (!nextUser) {
            this.state.currentTurn = "";
            this.state.stage = StateSchema_1.GameStage.FINISHED;
            return;
        }
        this.state.currentTurn = nextUser.username;
        this.state.stage = StateSchema_1.GameStage.WAITING;
    };
    Game.prototype.addUser = function (username, displayName, blacklist, priority) {
        var exists = this.state.users.find(function (u) { return u.username === username; });
        if (exists) {
            if (exists.disconnected) {
                exists.disconnected = false;
                return exists;
            }
            throw new Error("user already exists");
        }
        var user = {
            username: username,
            displayName: displayName,
            blacklist: blacklist !== null && blacklist !== void 0 ? blacklist : [],
            priority: priority !== null && priority !== void 0 ? priority : false,
            rolled: "",
            disconnected: false,
        };
        this.state.users.push(user);
        if (this._canStart()) {
            this.start();
        }
        return user;
    };
    Game.prototype.getUser = function (username) {
        return this.state.users.find(function (u) { return u.username === username; });
    };
    Game.prototype.isUserConnected = function (username) {
        var user = this.state.users.find(function (u) { return u.username === username; });
        return user && !user.disconnected;
    };
    Game.prototype.areAllDisconnected = function () {
        return this.state.users.every(function (u) { return u.disconnected; });
    };
    Game.prototype.disconnectUser = function (username) {
        var user = this.getUser(username);
        if (!user) {
            return;
        }
        user.disconnected = true;
    };
    Game.prototype._canStart = function () {
        return this.state.users.length === this.MAX_USERS;
    };
    Game.prototype._rollFor = function (user) {
        var _this = this;
        var canRoll = this.state.users.filter(function (u) { return !_this.state.rolled.includes(u.username) && !user.blacklist.includes(u.username); });
        if (canRoll.length === 0) {
            return null;
        }
        var rolledUser = canRoll[Math.floor(Math.random() * canRoll.length)];
        return rolledUser;
    };
    Game.prototype._getNextUser = function () {
        var notRolled = this.state.users.filter(function (u) { return u.rolled === ""; });
        if (notRolled.length === 0) {
            return null;
        }
        var priorityUser = notRolled.find(function (u) { return u.priority; });
        if (priorityUser) {
            return priorityUser;
        }
        return notRolled[Math.floor(Math.random() * notRolled.length)];
    };
    return Game;
}());
exports.default = Game;
