interface User {
    username: string;
    displayName: string;

    blacklist: string[];
    priority: boolean;

    rolled: string;
    disconnected: boolean;
}

export default User;