import { UserService } from "../services/userService.js";

export class UserController {
  static async getAllUsers(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const offset = parseInt(req.query.offset, 10) || 0;
      const users = await UserService.getAllUsers(limit, offset);
      res.status(200).json(users);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async getUserById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(404).json({ message: "Invalid ID" });
      }
      const user = await UserService.getUserById(id);
      res.status(200).json(user);
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(404).json({ message: "Invalid ID" });
      }
      const dto = req.body;
      const updatedUser = await UserService.updateUser(id, dto);
      res.status(200).json(updatedUser);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async deleteUserById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(404).json({ message: "Invalid ID" });
      }
      await UserService.deleteUser(id);
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }
}
