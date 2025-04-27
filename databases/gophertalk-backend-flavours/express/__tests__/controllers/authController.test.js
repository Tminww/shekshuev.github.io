import { expect, jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import { AuthController } from "../../src/controllers/authController.js";
import { AuthService } from "../../src/services/authService.js";

const app = express();
app.use(express.json());
app.post("/api/auth/login", AuthController.login);
app.post("/api/auth/register", AuthController.register);

describe("AuthController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("should successfully login", async () => {
      const tokens = { access_token: "access", refresh_token: "refresh" };
      const loginDTO = { user_name: "test_user", password: "test123!" };

      jest.spyOn(AuthService, "login").mockResolvedValueOnce(tokens);

      const res = await request(app).post("/api/auth/login").send(loginDTO);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(tokens);
      expect(AuthService.login).toHaveBeenCalledWith(loginDTO);
    });

    it("should return 401 if login fails", async () => {
      const loginDTO = { user_name: "test_user", password: "wrongpassword" };

      jest
        .spyOn(AuthService, "login")
        .mockRejectedValueOnce(new Error("Wrong password"));

      const res = await request(app).post("/api/auth/login").send(loginDTO);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Wrong password");
      expect(AuthService.login).toHaveBeenCalledWith(loginDTO);
    });
  });

  describe("POST /api/auth/register", () => {
    it("should successfully register", async () => {
      const tokens = { access_token: "access", refresh_token: "refresh" };
      const registerDTO = {
        user_name: "test_user",
        password: "test123!",
        password_confirm: "test123!",
        first_name: "John",
        last_name: "Doe",
      };

      jest.spyOn(AuthService, "register").mockResolvedValueOnce(tokens);

      const res = await request(app)
        .post("/api/auth/register")
        .send(registerDTO);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(tokens);
      expect(AuthService.register).toHaveBeenCalledWith(registerDTO);
    });

    it("should return 401 if registration fails", async () => {
      const registerDTO = {
        user_name: "test_user",
        password: "test123!",
        password_confirm: "test123!",
        first_name: "John",
        last_name: "Doe",
      };

      jest
        .spyOn(AuthService, "register")
        .mockRejectedValueOnce(new Error("User already exists"));

      const res = await request(app)
        .post("/api/auth/register")
        .send(registerDTO);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("User already exists");
      expect(AuthService.register).toHaveBeenCalledWith(registerDTO);
    });
  });
});
