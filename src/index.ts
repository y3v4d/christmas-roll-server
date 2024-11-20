import { createServer } from "http";
import { DefaultEventsMap, Server } from "socket.io";
import db from "./config/users.json";
import Game from "./game";
import { ClientToServerEvents, ServerToClientEvents } from "./types/events";

interface SocketData {
    username: string;
}

const httpServer = createServer();
const io = new Server<ClientToServerEvents, ServerToClientEvents, DefaultEventsMap, SocketData>(
    httpServer,
    {
        cors: {
            origin: "*"
        }
    }
);
let game: Game = null!;

io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    const password = socket.handshake.auth.password;

    const dbUser = db.find(user => user.username === username && user.password === password);
    if (!dbUser) {
        return next(new Error("invalid username or password"));
    }

    if(!game) {
        game = new Game();
    }

    if(game.isUserConnected(dbUser.username)) {
        return next(new Error("user already connected"));
    }

    socket.data.username = username;
    next();
});

io.on("connection", (socket) => {
    const dbUser = db.find(user => user.username === socket.data.username);
    if(!dbUser) {
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
        } catch(error: any) {
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

        if(game.areAllDisconnected()) {
            game = null!;
        }
    });

    console.log(`Socket ${socket.id} connected with user ${user.username}`);
});

io.listen(3000);
console.log("Server listening on port 3000");