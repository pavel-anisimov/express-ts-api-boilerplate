// src/routes/users.ts
import { Router } from "express";
import {
    listUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from "../controllers/users";
import { requireAuth } from "../middlewares/auth";
// Если используете RBAC — можно подключить право на чтение/управление пользователями
// import { requirePermission } from "../middlewares/permissions";

export const usersRouter = Router();

// Список пользователей
usersRouter.get(
    "/",
    requireAuth,
    // requirePermission("user.read"),
    listUsers
);

// Получить пользователя по id
usersRouter.get(
    "/:id",
    requireAuth,
    // requirePermission("user.read"),
    getUserById
);

// Создать пользователя
usersRouter.post(
    "/",
    requireAuth,
    // requirePermission("user.write"),
    createUser
);

// Обновить пользователя
usersRouter.put(
    "/:id",
    requireAuth,
    // requirePermission("user.write"),
    updateUser
);

// Удалить пользователя
usersRouter.delete(
    "/:id",
    requireAuth,
    // requirePermission("user.write"),
    deleteUser
);

