interface RegisterInput {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    isMember?: boolean;
}
interface LoginInput {
    email: string;
    password: string;
    sessionToken?: string;
}
export declare const registerUser: (data: RegisterInput) => Promise<{
    user: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        role: import("../generated/prisma").$Enums.UserRole;
        createdAt: Date;
        isMember: boolean;
    };
    token: string;
}>;
export declare const loginUser: (data: LoginInput) => Promise<{
    user: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        role: import("../generated/prisma").$Enums.UserRole;
        createdAt: Date;
        isMember: boolean;
    };
    token: string;
}>;
export declare const getUserById: (id: number) => Promise<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: import("../generated/prisma").$Enums.UserRole;
    createdAt: Date;
    phone: string | null;
    isMember: boolean;
    addresses: {
        id: number;
        userId: number;
        label: string | null;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        isDefault: boolean;
    }[];
} | null>;
export declare const updateUserProfile: (id: number, data: {
    firstName: string;
    lastName: string;
    phone?: string | null;
}) => Promise<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: import("../generated/prisma").$Enums.UserRole;
    createdAt: Date;
    phone: string | null;
    isMember: boolean;
    addresses: {
        id: number;
        userId: number;
        label: string | null;
        addressLine1: string;
        addressLine2: string | null;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        isDefault: boolean;
    }[];
}>;
export declare const becomeMemberUser: (id: number) => Promise<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: import("../generated/prisma").$Enums.UserRole;
    createdAt: Date;
    phone: string | null;
    isMember: boolean;
}>;
export {};
//# sourceMappingURL=auth.service.d.ts.map