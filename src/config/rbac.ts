// Permissions are atomic actions. Roles are sets of permissions.
import type { Role } from "../types/models";

export type Permission =
    | 'users.read'
    | 'users.write'
    | 'users.assignRole'
    | 'events.read'
    | 'events.publish'
    | 'proxy.users.read'      // example of proxy permission
    | 'proxy.catalog.read';

export type RoleDefinition = {
    [roleName: string]: Permission[];
};

// Basic matrix: adjust it to suit your needs
export const rolePermissions: Record<Role, Permission[]> = {
    user:    ['users.read', 'events.read', 'events.publish'],
    manager: ['users.read', 'events.read', 'events.publish', 'proxy.users.read'],
    admin:   ['users.read', 'users.write', 'users.assignRole', 'events.read', 'events.publish', 'proxy.users.read', 'proxy.catalog.read'],
} as const;

const ALL_ROLES = ['user', 'manager', 'admin'] as const;
function isRole(role: string): role is Role {
    return (ALL_ROLES as readonly string[]).includes(role);
}

// Utility: Aggregate user permissions across all roles
export function permissionsForRoles(roles: string[]): Set<Permission> {
    const set = new Set<Permission>();
    for (const role of roles) {
        if (!isRole(role)) {
            continue;               // ignore unknown roles//
        }

        for (const permission of rolePermissions[role]) {
            set.add(permission);
        }
    }
    return set;
}
