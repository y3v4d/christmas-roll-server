import State, { GameStage } from "./schema/StateSchema";
import User from "./schema/UserSchema";

class Game {
    public readonly MAX_USERS = 6;
    public state: State;

    constructor() {
        this.state = {
            users: [],
            
            currentTurn: "",
            stage: GameStage.NONE,

            rolled: []
        };
    }

    start() {
        if(this.state.stage != GameStage.NONE) {
            throw new Error("game already started");
        }

        this.progress();
    }

    roll() {
        if(this.state.stage != GameStage.WAITING) {
            throw new Error("not waiting for rolls");
        }

        const user = this.state.users.find(u => u.username === this.state.currentTurn);
        if(!user) {
            throw new Error("no user to roll");
        }

        const rolled = this._rollFor(user);
        if(!rolled) {
            throw new Error("no user to roll");
        }

        user.rolled = rolled.username;
        this.state.rolled.push(rolled.username);

        this.state.stage = GameStage.ROLLING;
    }

    progress() {
        if(this.state.stage != GameStage.NONE && this.state.stage != GameStage.ROLLING) {
            throw new Error("not waiting for progress");
        }

        const nextUser = this._getNextUser();
        if(!nextUser) {
            this.state.currentTurn = "";
            this.state.stage = GameStage.FINISHED;

            return;
        }

        this.state.currentTurn = nextUser.username;
        this.state.stage = GameStage.WAITING;
    }

    addUser(username: string, displayName: string, blacklist?: string[], priority?: boolean) {
        const exists = this.state.users.find(u => u.username === username);
        if(exists) {
            if(exists.disconnected) {
                exists.disconnected = false;
                return exists;
            }

            throw new Error("user already exists");
        }

        const user: User = {
            username,
            displayName,
            blacklist: blacklist ?? [],
            priority: priority ?? false,
            rolled: "",
            disconnected: false,
        }

        this.state.users.push(user);

        if(this._canStart()) {
            this.start();
        }

        return user;
    }

    getUser(username: string) {
        return this.state.users.find(u => u.username === username);
    }

    isUserConnected(username: string) {
        const user = this.state.users.find(u => u.username === username);
        return user && !user.disconnected;
    }

    areAllDisconnected() {
        return this.state.users.every(u => u.disconnected);
    }

    disconnectUser(username: string) {
        const user = this.getUser(username);
        if(!user) {
            return;
        }

        user.disconnected = true;
    }

    

    private _canStart() {
        return this.state.users.length === this.MAX_USERS;
    }

    private _rollFor(user: User) {
        const canRoll = this.state.users.filter(u => !this.state.rolled.includes(u.username) && !user.blacklist.includes(u.username));
        if(canRoll.length === 0) {
            return null;
        }

        const rolledUser = canRoll[Math.floor(Math.random() * canRoll.length)];
        return rolledUser;
    }

    private _getNextUser() {
        const notRolled = this.state.users.filter(u => u.rolled === "");
        if(notRolled.length === 0) {
            return null;
        }

        const priorityUser = notRolled.find(u => u.priority);
        if(priorityUser) {
            return priorityUser;
        }

        return notRolled[Math.floor(Math.random() * notRolled.length)];
    }
}

export default Game;