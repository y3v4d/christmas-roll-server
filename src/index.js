"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var socket_io_1 = require("socket.io");
var users_json_1 = require("./config/users.json");
var game_1 = require("./game");
var httpServer = (0, http_1.createServer)();
var io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*"
    }
});
var game = null;
io.use(function (socket, next) {
    var username = socket.handshake.auth.username;
    var password = socket.handshake.auth.password;
    var dbUser = users_json_1.default.find(function (user) { return user.username === username && user.password === password; });
    if (!dbUser) {
        return next(new Error("invalid username or password"));
    }
    if (!game) {
        game = new game_1.default();
    }
    if (game.isUserConnected(dbUser.username)) {
        return next(new Error("user already connected"));
    }
    socket.data.username = username;
    next();
});
io.on("connection", function (socket) {
    var dbUser = users_json_1.default.find(function (user) { return user.username === socket.data.username; });
    if (!dbUser) {
        socket.disconnect(true);
        return;
    }
    var user = game.addUser(dbUser.username, dbUser.displayName, dbUser.blacklist, dbUser.priority);
    socket.emit("init", user);
    io.emit("state-update", game.state);
    socket.on("roll", function () {
        try {
            game.roll();
            io.emit("state-update", game.state);
            setTimeout(function () {
                game.progress();
                io.emit("state-update", game.state);
            }, 20 * 1000);
        }
        catch (error) {
            socket.emit("error", error.message);
        }
    });
    socket.on("request-state", function () {
        socket.emit("state-update", game.state);
    });
    socket.on("disconnect", function () {
        console.log("Socket ".concat(socket.id, " disconnected with user ").concat(user.username));
        game.disconnectUser(user.username);
        io.emit("state-update", game.state);
        if (game.areAllDisconnected()) {
            game = null;
        }
    });
    console.log("Socket ".concat(socket.id, " connected with user ").concat(user.username));
});
io.listen(3000);
console.log("Server listening on port 3000");
