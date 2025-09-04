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
/**
 * Represents a mapping of roles to their associated permissions within a system.
 *
 * The `rolePermissions` object defines a set of predefined roles and the corresponding
 * list of permissions granted to each role. Roles specify the level of access or
 * actions a user can perform, while permissions represent specific capabilities or areas
 * of the system that can be accessed or manipulated.
 *
 * This mapping is intended to enforce role-based access control (RBAC) policies.
 *
 * Key characteristics:
 * - `user`: Basic role granting read access to users and events, with the ability to publish events.
 * - `manager`: Intermediate role extending user permissions with additional read access to proxy users.
 * - `admin`: Elevated role with broad access, including user management, role assignment, and catalog-related operations.
 */
export const rolePermissions: Record<Role, Permission[]> = {
    user:    ['users.read', 'events.read', 'events.publish'],
    manager: ['users.read', 'events.read', 'events.publish', 'proxy.users.read'],
    admin:   ['users.read', 'users.write', 'users.assignRole', 'events.read', 'events.publish', 'proxy.users.read', 'proxy.catalog.read'],
} as const;

const ALL_ROLES = ['user', 'manager', 'admin'] as const;

/**
 * Checks if the given role is a valid Role.
 *
 * @param {string} role - The role to validate.
 * @return {boolean} Returns true if the given role is a valid Role, otherwise false.
 */
function isRole(role: string): role is Role {
    return (ALL_ROLES as readonly string[]).includes(role);
}

// Utility: Aggregate user permissions across all roles
/**
 * Retrieves the set of permissions associated with the specified roles.
 * Filters out roles that are not recognized.
 *
 * @param {string[]} roles - An array of role names to retrieve permissions for.
 * @return {Set<Permission>} A set of permissions associated with the given roles.
 */
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
