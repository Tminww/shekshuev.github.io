import { describe, expect, jest } from "@jest/globals";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../../src/repositories/userRepository.js";
import { AuthService } from "../../src/services/authService.js";

describe("AuthService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("successfully logs in a user", async () => {
      const password = "password123";
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = {
        id: 1,
        user_name: "testuser",
        password_hash: hashedPassword,
      };

      const dto = {
        user_name: "testuser",
        password: "password123",
      };

      jest.spyOn(UserRepository, "getUserByUserName").mockResolvedValue(user);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);
      jest.spyOn(jwt, "sign").mockReturnValue("mocked_token");

      const config = {
        ACCESS_TOKEN_SECRET: "access_secret",
        ACCESS_TOKEN_EXPIRES: "1h",
        REFRESH_TOKEN_SECRET: "refresh_secret",
        REFRESH_TOKEN_EXPIRES: "7d",
      };

      const result = await AuthService.login(dto, config);

      expect(result).toEqual({
        access_token: "mocked_token",
        refresh_token: "mocked_token",
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, user.password_hash);
    });

    it("throws error if user not found", async () => {
      const dto = {
        user_name: "nonexistent",
        password: "password123",
      };

      jest.spyOn(UserRepository, "getUserByUserName").mockResolvedValue(null);

      await expect(AuthService.login(dto, {})).rejects.toThrow("User not found");
    });

    it("throws error if password is wrong", async () => {
      const user = {
        id: 1,
        user_name: "testuser",
        password_hash: await bcrypt.hash("password123", 10),
      };

      const dto = {
        user_name: "testuser",
        password: "wrongpassword",
      };

      jest.spyOn(UserRepository, "getUserByUserName").mockResolvedValue(user);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      await expect(AuthService.login(dto, {})).rejects.toThrow("Wrong password");
    });
  });

  describe("register", () => {
    it("successfully registers a user", async () => {
      const dto = {
        user_name: "newuser",
        password: "password123",
        first_name: "New",
        last_name: "User",
      };

      const user = {
        id: 1,
        user_name: "newuser",
        password_hash: "hashed_password",
        first_name: "New",
        last_name: "User",
      };

      jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed_password");
      jest.spyOn(UserRepository, "createUser").mockResolvedValue(user);
      jest.spyOn(jwt, "sign").mockReturnValue("mocked_token");

      const config = {
        ACCESS_TOKEN_SECRET: "access_secret",
        ACCESS_TOKEN_EXPIRES: "1h",
        REFRESH_TOKEN_SECRET: "refresh_secret",
        REFRESH_TOKEN_EXPIRES: "7d",
      };

      const result = await AuthService.register(dto, config);

      expect(result).toEqual({
        access_token: "mocked_token",
        refresh_token: "mocked_token",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(UserRepository.createUser).toHaveBeenCalled();
    });
  });
});
