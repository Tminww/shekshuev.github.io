import express from "express";
import { UserController } from "../controllers/userController.js";
import { requestAuth, requestAuthSameId } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateUserValidator } from "../validators/userValidators.js";

const router = express.Router();

// Только авторизованные пользователи
router.get("/", requestAuth, UserController.getAllUsers);
router.get("/:id", requestAuth, UserController.getUserById);

// Обновить или удалить пользователь может только себя
router.put(
  "/:id",
  requestAuthSameId,
  validate(updateUserValidator),
  UserController.updateUser
);
router.delete("/:id", requestAuthSameId, UserController.deleteUserById);

export default router;
