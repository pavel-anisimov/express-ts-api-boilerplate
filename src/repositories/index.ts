import { AuthMockRepository } from "./auth/AuthMockRepository";
import { UsersMockRepository } from "./users/UsersMockRepository";

/**
 * Repository composition root.
 *
 * This is the only place where concrete repository implementations should be
 * constructed. Services and compatibility facades import `repositories` so
 * future mock-to-HTTP swaps do not require touching route/controller code.
 */
const auth = new AuthMockRepository();
const users = new UsersMockRepository(auth);

/**
 * Domain repositories wired behind their contracts.
 */
export const repositories = { auth, users };
