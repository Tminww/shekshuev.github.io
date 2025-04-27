import { expect, jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import { UserController } from "../../src/controllers/userController.js";
import { validate } from "../../src/middleware/validate.js";
import { UserService } from "../../src/services/userService.js";
import { updateUserValidator } from "../../src/validators/userValidators.js";

const app = express();
app.use(express.json());

app.get("/api/users", UserController.getAllUsers);
app.get("/api/users/:id", UserController.getUserById);
app.put(
  "/api/users/:id",
  validate(updateUserValidator),
  UserController.updateUser
);
app.delete("/api/users/:id", UserController.deleteUserById);

describe("UserController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/users", () => {
    it("should return 200 and list of users", async () => {
      const users = [{ id: 1, user_name: "test_user" }];
      jest.spyOn(UserService, "getAllUsers").mockResolvedValueOnce(users);

      const res = await request(app)
        .get("/api/users?limit=10&offset=0")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(users);
      expect(UserService.getAllUsers).toHaveBeenCalled();
    });

    it("should return 400 if service fails", async () => {
      jest
        .spyOn(UserService, "getAllUsers")
        .mockRejectedValueOnce(new Error("Service error"));

      const res = await request(app)
        .get("/api/users?limit=10&offset=0")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should return 200 and a user", async () => {
      const user = { id: 1, user_name: "test_user" };
      jest.spyOn(UserService, "getUserById").mockResolvedValueOnce(user);

      const res = await request(app)
        .get("/api/users/1")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(user);
      expect(UserService.getUserById).toHaveBeenCalledWith(1);
    });

    it("should return 404 if id is invalid", async () => {
      const res = await request(app)
        .get("/api/users/abc")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(404);
    });

    it("should return 404 if user not found", async () => {
      jest
        .spyOn(UserService, "getUserById")
        .mockRejectedValueOnce(new Error("Not found"));

      const res = await request(app)
        .get("/api/users/2")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should return 200 and updated user", async () => {
      const updateDto = { first_name: "Updated", last_name: "User" };
      const updatedUser = { id: 1, user_name: "updated_user" };
      jest.spyOn(UserService, "updateUser").mockResolvedValueOnce(updatedUser);

      const res = await request(app)
        .put("/api/users/1")
        .set("Authorization", "Bearer mockToken")
        .send(updateDto);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedUser);
      expect(UserService.updateUser).toHaveBeenCalledWith(1, updateDto);
    });

    it("should return 404 if id is invalid", async () => {
      const res = await request(app)
        .put("/api/users/abc")
        .set("Authorization", "Bearer mockToken")
        .send({});

      expect(res.status).toBe(404);
    });

    it("should return 422 if validation fails", async () => {
      const invalidDto = { user_name: "test" };

      const res = await request(app)
        .put("/api/users/1")
        .set("Authorization", "Bearer mockToken")
        .send(invalidDto);

      expect(res.status).toBe(422);
    });

    it("should return 400 on service error", async () => {
      const updateDto = { first_name: "Updated", last_name: "User" };
      jest
        .spyOn(UserService, "updateUser")
        .mockRejectedValueOnce(new Error("Service error"));

      const res = await request(app)
        .put("/api/users/1")
        .set("Authorization", "Bearer mockToken")
        .send(updateDto);

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should return 204 if user deleted", async () => {
      jest.spyOn(UserService, "deleteUser").mockResolvedValueOnce();

      const res = await request(app)
        .delete("/api/users/1")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(204);
      expect(UserService.deleteUser).toHaveBeenCalledWith(1);
    });

    it("should return 404 if id is invalid", async () => {
      const res = await request(app)
        .delete("/api/users/abc")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(404);
    });

    it("should return 404 if user not found", async () => {
      jest
        .spyOn(UserService, "deleteUser")
        .mockRejectedValueOnce(new Error("Not found"));

      const res = await request(app)
        .delete("/api/users/2")
        .set("Authorization", "Bearer mockToken");

      expect(res.status).toBe(404);
    });
  });
});
