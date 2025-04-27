import { expect, jest } from "@jest/globals";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { PostController } from "../../src/controllers/postController.js";
import { requestAuth } from "../../src/middleware/auth.js";
import { validate } from "../../src/middleware/validate.js";
import { PostService } from "../../src/services/postService.js";
import { createPostValidator } from "../../src/validators/postValidators.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const token = jwt.sign({ sub: "1" }, process.env.ACCESS_TOKEN_SECRET);
  req.headers.authorization = `Bearer ${token}`;
  requestAuth(process.env.ACCESS_TOKEN_SECRET)(req, res, next);
});

app.get("/api/posts", PostController.getAllPosts);
app.post("/api/posts", validate(createPostValidator), PostController.createPost);
app.delete("/api/posts/:id", PostController.deletePost);
app.post("/api/posts/:id/view", PostController.viewPost);
app.post("/api/posts/:id/like", PostController.likePost);
app.delete("/api/posts/:id/like", PostController.dislikePost);

describe("PostController", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/posts", () => {
    it("should fetch posts successfully", async () => {
      const posts = [{ id: 1, text: "Test post" }];
      jest.spyOn(PostService, "getAllPosts").mockResolvedValueOnce(posts);

      const res = await request(app).get("/api/posts?limit=10&offset=0");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(posts);
      expect(PostService.getAllPosts).toHaveBeenCalled();
    });

    it("should handle service error", async () => {
      jest.spyOn(PostService, "getAllPosts").mockRejectedValueOnce(new Error("Service error"));

      const res = await request(app).get("/api/posts?limit=10&offset=0");

      expect(res.status).toBe(400);
      expect(PostService.getAllPosts).toHaveBeenCalled();
    });
  });

  describe("POST /api/posts", () => {
    it("should create a post successfully", async () => {
      const post = { id: 1, text: "New post" };
      jest.spyOn(PostService, "createPost").mockResolvedValueOnce(post);

      const res = await request(app).post("/api/posts").send({ text: "New post" });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(post);
      expect(PostService.createPost).toHaveBeenCalled();
    });

    it("should handle validation error", async () => {
      const res = await request(app).post("/api/posts").send({});

      expect(res.status).toBe(422);
    });

    it("should handle service error", async () => {
      jest.spyOn(PostService, "createPost").mockRejectedValueOnce(new Error("Service error"));

      const res = await request(app).post("/api/posts").send({ text: "New post" });

      expect(res.status).toBe(400);
      expect(PostService.createPost).toHaveBeenCalled();
    });
  });

  describe("DELETE /api/posts/:id", () => {
    it("should delete post successfully", async () => {
      jest.spyOn(PostService, "deletePost").mockResolvedValueOnce();

      const res = await request(app).delete("/api/posts/1");

      expect(res.status).toBe(204);
      expect(PostService.deletePost).toHaveBeenCalled();
    });

    it("should handle invalid id", async () => {
      const res = await request(app).delete("/api/posts/abc");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/posts/:id/view", () => {
    it("should view post successfully", async () => {
      jest.spyOn(PostService, "viewPost").mockResolvedValueOnce();

      const res = await request(app).post("/api/posts/1/view");

      expect(res.status).toBe(201);
      expect(PostService.viewPost).toHaveBeenCalled();
    });

    it("should handle invalid id", async () => {
      const res = await request(app).post("/api/posts/abc/view");

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/posts/:id/like", () => {
    it("should like post successfully", async () => {
      jest.spyOn(PostService, "likePost").mockResolvedValueOnce();

      const res = await request(app).post("/api/posts/1/like");

      expect(res.status).toBe(201);
      expect(PostService.likePost).toHaveBeenCalled();
    });

    it("should handle invalid id", async () => {
      const res = await request(app).post("/api/posts/abc/like");

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/posts/:id/like", () => {
    it("should dislike post successfully", async () => {
      jest.spyOn(PostService, "dislikePost").mockResolvedValueOnce();

      const res = await request(app).delete("/api/posts/1/like");

      expect(res.status).toBe(204);
      expect(PostService.dislikePost).toHaveBeenCalled();
    });

    it("should handle invalid id", async () => {
      const res = await request(app).delete("/api/posts/abc/like");

      expect(res.status).toBe(404);
    });
  });
});
