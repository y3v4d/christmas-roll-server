import User from "./UserSchema";

enum GameStage {
    NONE = 0,
    WAITING, 
    ROLLING,
    FINISHED
}

interface State {
    users: User[];
    
    currentTurn: string;
    stage: GameStage;

    rolled: string[];
}

export { GameStage };
export default State;