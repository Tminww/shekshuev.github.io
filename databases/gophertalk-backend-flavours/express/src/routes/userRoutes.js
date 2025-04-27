import express from "express";
import { UserController } from "../controllers/userController.js";
import { requestAuth, requestAuthSameId } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateUserValidator } from "../validators/userValidators.js";

const router = express.Router();

// Только авторизованные пользователи
router.get("/", requestAuth(process.env.ACCESS_TOKEN_SECRET), UserController.getAllUsers);
router.get("/:id", requestAuth(process.env.ACCESS_TOKEN_SECRET), UserController.getUserById);

// Обновить или удалить пользователь может только себя
router.put(
  "/:id",
  requestAuthSameId(process.env.ACCESS_TOKEN_SECRET),
  validate(updateUserValidator),
  UserController.updateUser
);
router.delete("/:id", requestAuthSameId(process.env.ACCESS_TOKEN_SECRET), UserController.deleteUserById);

export default router;
