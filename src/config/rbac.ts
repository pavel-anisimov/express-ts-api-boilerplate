import type { Role } from "../types/models";

/**
 * Atomic actions guarded by the gateway.
 *
 * Routes should authorize against permissions, not role names. Roles stay as
 * a coarse assignment model, while permissions describe the concrete action
 * the caller is allowed to perform.
 */
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

/**
 * Role-to-permission matrix used by RBAC middleware and services.
 *
 * Add new capabilities as permissions first, then assign them to roles here.
 * This keeps route checks stable even if the role model changes later.
 */
export const rolePermissions: Record<Role, Permission[]> = {
    user:    ['users.read', 'events.read', 'events.publish'],
    manager: ['users.read', 'events.read', 'events.publish', 'proxy.users.read'],
    admin:   ['users.read', 'users.write', 'users.assignRole', 'events.read', 'events.publish', 'proxy.users.read', 'proxy.catalog.read'],
} as const;

const ALL_ROLES = ['user', 'manager', 'admin'] as const;

/**
 * Narrows an arbitrary string to a known gateway role.
 */
function isRole(role: string): role is Role {
    return (ALL_ROLES as readonly string[]).includes(role);
}

/**
 * Aggregates permissions for the provided role names.
 *
 * Unknown roles are ignored instead of treated as errors. This keeps legacy or
 * external identity payloads from breaking requests while still granting no
 * permissions for unrecognized role names.
 */
export function permissionsForRoles(roles: string[]): Set<Permission> {
    const set = new Set<Permission>();
    for (const role of roles) {
        if (!isRole(role)) {
            continue;
        }

        for (const permission of rolePermissions[role]) {
            set.add(permission);
        }
    }
    return set;
}
