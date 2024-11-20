import State from "../schema/StateSchema";
import User from "../schema/UserSchema";

interface ServerToClientEvents {
    "init": (user: User) => void;
    "state-update": (state: State) => void;
    "error": (message: string) => void;
}
  
interface ClientToServerEvents {
    "request-state": () => void;
    "roll": () => void;
}

export { ServerToClientEvents, ClientToServerEvents };