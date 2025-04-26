import { describe, expect, jest } from "@jest/globals";
import { PostRepository } from "../../src/repositories/postRepository.js";
import { PostService } from "../../src/services/postService.js";

describe("PostService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllPosts", () => {
    it("successfully gets all posts", async () => {
      const posts = [
        { id: 1, text: "post1" },
        { id: 2, text: "post2" },
      ];
      const mock = jest.spyOn(PostRepository, "getAllPosts").mockResolvedValue(posts);

      const result = await PostService.getAllPosts({ user_id: 1, limit: 100, offset: 0 });
      expect(result).toEqual(posts);
      expect(mock).toHaveBeenCalledTimes(1);
    });

    it("throws error on failure", async () => {
      const mock = jest.spyOn(PostRepository, "getAllPosts").mockRejectedValue(new Error("DB error"));

      await expect(PostService.getAllPosts({ user_id: 1, limit: 100, offset: 0 })).rejects.toThrow("DB error");
      expect(mock).toHaveBeenCalledTimes(1);
    });
  });

  describe("createPost", () => {
    it("successfully creates a post", async () => {
      const post = { id: 1, text: "new post" };
      const mock = jest.spyOn(PostRepository, "createPost").mockResolvedValue(post);

      const result = await PostService.createPost({ text: "new post", user_id: 1 });
      expect(result).toEqual(post);
      expect(mock).toHaveBeenCalledTimes(1);
    });

    it("throws error on insert failure", async () => {
      const mock = jest.spyOn(PostRepository, "createPost").mockRejectedValue(new Error("Insert error"));

      await expect(PostService.createPost({ text: "new post", user_id: 1 })).rejects.toThrow("Insert error");
      expect(mock).toHaveBeenCalledTimes(1);
    });
  });

  describe("deletePost", () => {
    it("successfully deletes a post", async () => {
      const mock = jest.spyOn(PostRepository, "deletePost").mockResolvedValue();

      await expect(PostService.deletePost(1, 0)).resolves.toBeUndefined();
      expect(mock).toHaveBeenCalledWith(1, 0);
    });

    it("throws error on delete failure", async () => {
      const mock = jest.spyOn(PostRepository, "deletePost").mockRejectedValue(new Error("Delete error"));

      await expect(PostService.deletePost(2, 0)).rejects.toThrow("Delete error");
      expect(mock).toHaveBeenCalledWith(2, 0);
    });
  });

  describe("viewPost", () => {
    it("successfully views a post", async () => {
      const mock = jest.spyOn(PostRepository, "viewPost").mockResolvedValue();

      await expect(PostService.viewPost(1, 0)).resolves.toBeUndefined();
      expect(mock).toHaveBeenCalledWith(1, 0);
    });

    it("throws error on view failure", async () => {
      const mock = jest.spyOn(PostRepository, "viewPost").mockRejectedValue(new Error("View error"));

      await expect(PostService.viewPost(2, 0)).rejects.toThrow("View error");
      expect(mock).toHaveBeenCalledWith(2, 0);
    });
  });

  describe("likePost", () => {
    it("successfully likes a post", async () => {
      const mock = jest.spyOn(PostRepository, "likePost").mockResolvedValue();

      await expect(PostService.likePost(1, 0)).resolves.toBeUndefined();
      expect(mock).toHaveBeenCalledWith(1, 0);
    });

    it("throws error on like failure", async () => {
      const mock = jest.spyOn(PostRepository, "likePost").mockRejectedValue(new Error("Like error"));

      await expect(PostService.likePost(2, 0)).rejects.toThrow("Like error");
      expect(mock).toHaveBeenCalledWith(2, 0);
    });
  });

  describe("dislikePost", () => {
    it("successfully dislikes a post", async () => {
      const mock = jest.spyOn(PostRepository, "dislikePost").mockResolvedValue();

      await expect(PostService.dislikePost(1, 0)).resolves.toBeUndefined();
      expect(mock).toHaveBeenCalledWith(1, 0);
    });

    it("throws error on dislike failure", async () => {
      const mock = jest.spyOn(PostRepository, "dislikePost").mockRejectedValue(new Error("Dislike error"));

      await expect(PostService.dislikePost(2, 0)).rejects.toThrow("Dislike error");
      expect(mock).toHaveBeenCalledWith(2, 0);
    });
  });
});
