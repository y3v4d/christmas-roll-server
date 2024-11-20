"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const users_json_1 = __importDefault(require("./config/users.json"));
const game_1 = __importDefault(require("./game"));
const httpServer = (0, http_1.createServer)();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*"
    }
});
let game = null;
io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    const password = socket.handshake.auth.password;
    const dbUser = users_json_1.default.find(user => user.username === username && user.password === password);
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
io.on("connection", (socket) => {
    const dbUser = users_json_1.default.find(user => user.username === socket.data.username);
    if (!dbUser) {
        socket.disconnect(true);
        return;
    }
    const user = game.addUser(dbUser.username, dbUser.displayName, dbUser.blacklist, dbUser.priority);
    socket.emit("init", user);
    io.emit("state-update", game.state);
    socket.on("roll", () => {
        try {
            game.roll();
            io.emit("state-update", game.state);
            setTimeout(() => {
                game.progress();
                io.emit("state-update", game.state);
            }, 20 * 1000);
        }
        catch (error) {
            socket.emit("error", error.message);
        }
    });
    socket.on("request-state", () => {
        socket.emit("state-update", game.state);
    });
    socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected with user ${user.username}`);
        game.disconnectUser(user.username);
        io.emit("state-update", game.state);
        if (game.areAllDisconnected()) {
            game = null;
        }
    });
    console.log(`Socket ${socket.id} connected with user ${user.username}`);
});
io.listen(3000);
console.log("Server listening on port 3000");
