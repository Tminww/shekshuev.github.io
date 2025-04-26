import { expect, jest } from "@jest/globals";
import { UserRepository } from "../../src/repositories/userRepository.js";
import { UserService } from "../../src/services/userService.js";

describe("UserService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    it("successfully gets all users", async () => {
      const mock = jest.spyOn(UserRepository, "getAllUsers");
      const now = new Date();

      const expectedUsers = [
        {
          id: 1,
          user_name: "john",
          first_name: "John",
          last_name: "Doe",
          status: 1,
          created_at: now,
          updated_at: now,
        },
        {
          id: 2,
          user_name: "jane",
          first_name: "Jane",
          last_name: "Smith",
          status: 1,
          created_at: now,
          updated_at: now,
        },
      ];

      mock.mockResolvedValueOnce(expectedUsers);

      const result = await UserService.getAllUsers(100, 0);

      expect(result).toEqual(expectedUsers);
      expect(mock).toHaveBeenCalledWith(100, 0);
    });

    it("returns error on getAllUsers failure", async () => {
      const mock = jest.spyOn(UserRepository, "getAllUsers");

      mock.mockRejectedValueOnce(new Error("SQL error"));

      await expect(UserService.getAllUsers(100, 0)).rejects.toThrow("SQL error");
      expect(mock).toHaveBeenCalledWith(100, 0);
    });
  });

  describe("getUserById", () => {
    it("successfully gets user by id", async () => {
      const mock = jest.spyOn(UserRepository, "getUserById");
      const now = new Date();

      const expectedUser = {
        id: 1,
        user_name: "john",
        first_name: "John",
        last_name: "Doe",
        status: 1,
        created_at: now,
        updated_at: now,
      };

      mock.mockResolvedValueOnce(expectedUser);

      const result = await UserService.getUserById(1);

      expect(result).toEqual(expectedUser);
      expect(mock).toHaveBeenCalledWith(1);
    });

    it("returns error if user not found", async () => {
      const mock = jest.spyOn(UserRepository, "getUserById");

      mock.mockRejectedValueOnce(new Error("User not found"));

      await expect(UserService.getUserById(2)).rejects.toThrow("User not found");
      expect(mock).toHaveBeenCalledWith(2);
    });
  });

  describe("updateUser", () => {
    it("successfully updates user", async () => {
      const mockUpdate = jest.spyOn(UserRepository, "updateUser");
      const now = new Date();

      const updateDTO = {
        user_name: "john_updated",
        first_name: "John",
        last_name: "Doe",
        password: "newpassword",
      };

      const expectedUpdatedUser = {
        id: 1,
        user_name: "john_updated",
        first_name: "John",
        last_name: "Doe",
        status: 1,
        created_at: new Date(now.getTime() - 3600000),
        updated_at: now,
      };

      mockUpdate.mockResolvedValueOnce(expectedUpdatedUser);

      const result = await UserService.updateUser(1, { ...updateDTO });

      expect(result).toEqual(expectedUpdatedUser);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockUpdate.mock.calls[0][1].password_hash).toBeDefined();
    });

    it("returns error if update fails", async () => {
      const mockUpdate = jest.spyOn(UserRepository, "updateUser");

      mockUpdate.mockRejectedValueOnce(new Error("Update failed"));

      await expect(UserService.updateUser(2, { user_name: "ghost" })).rejects.toThrow("Update failed");
    });
  });

  describe("deleteUser", () => {
    it("successfully deletes user", async () => {
      const mockDelete = jest.spyOn(UserRepository, "deleteUser");

      mockDelete.mockResolvedValueOnce(undefined);

      await expect(UserService.deleteUser(1)).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith(1);
    });

    it("returns error if delete fails", async () => {
      const mockDelete = jest.spyOn(UserRepository, "deleteUser");

      mockDelete.mockRejectedValueOnce(new Error("Delete error"));

      await expect(UserService.deleteUser(2)).rejects.toThrow("Delete error");
      expect(mockDelete).toHaveBeenCalledWith(2);
    });
  });
});
