import bcrypt from "bcrypt";
import { UserRepository } from "../repositories/userRepository.js";

export const UserService = {
  async getAllUsers(limit, offset) {
    return await UserRepository.getAllUsers(limit, offset);
  },

  async getUserById(id) {
    return await UserRepository.getUserById(id);
  },

  async updateUser(id, userDto) {
    const updateFields = { ...userDto };
    if (updateFields.password) {
      const saltRounds = 10;
      updateFields.password_hash = await bcrypt.hash(updateFields.password, saltRounds);
      delete updateFields.password;
    }
    return await UserRepository.updateUser(id, updateFields);
  },

  async deleteUser(id) {
    return await UserRepository.deleteUser(id);
  },
};
