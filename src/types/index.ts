

export interface User {
    id_user: number;
    email: string;
    role: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}