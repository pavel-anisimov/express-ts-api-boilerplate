import { AuthMockRepository } from "./auth/AuthMockRepository";
import { UsersMockRepository } from "./users/UsersMockRepository";

const auth = new AuthMockRepository();
const users = new UsersMockRepository(auth);

export const repositories = { auth, users };
