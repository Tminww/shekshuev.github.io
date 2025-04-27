import { PostService } from "../services/postService.js";

export class PostController {
  static async getAllPosts(req, res) {
    try {
      const userId = req.user.sub;
      const { limit = 10, offset = 0, reply_to_id = 0, owner_id = 0, search = "" } = req.query;

      const filterDTO = {
        user_id: Number(userId),
        limit: Number(limit),
        offset: Number(offset),
        reply_to_id: Number(reply_to_id),
        owner_id: Number(owner_id),
        search,
      };

      const posts = await PostService.getAllPosts(filterDTO);
      res.status(200).json(posts);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async createPost(req, res) {
    try {
      const userId = req.user.sub;
      const dto = req.body;
      dto.user_id = Number(userId);

      const post = await PostService.createPost(dto);
      res.status(201).json(post);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async deletePost(req, res) {
    try {
      const postId = Number(req.params.id);
      const userId = Number(req.user.sub);

      await PostService.deletePost(postId, userId);
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }

  static async viewPost(req, res) {
    try {
      const postId = Number(req.params.id);
      const userId = Number(req.user.sub);

      await PostService.viewPost(postId, userId);
      res.status(201).send();
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }

  static async likePost(req, res) {
    try {
      const postId = Number(req.params.id);
      const userId = Number(req.user.sub);

      await PostService.likePost(postId, userId);
      res.status(201).send();
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }

  static async dislikePost(req, res) {
    try {
      const postId = Number(req.params.id);
      const userId = Number(req.user.sub);

      await PostService.dislikePost(postId, userId);
      res.status(204).send();
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  }
}
