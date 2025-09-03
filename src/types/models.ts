export type Role = 'user' | 'admin' | 'manager';

export type UserStatus = 'active' | 'blocked' | 'pending_verification';

export type User = {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    roles: Role[];
    status: UserStatus;
    emailVerified: boolean;
    createdAt: string;
};


