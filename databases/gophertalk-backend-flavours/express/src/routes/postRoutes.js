import express from "express";
import { PostController } from "../controllers/postController.js";
import { requestAuth, requestAuthSameId } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createPostValidator } from "../validators/postValidators.js";

const router = express.Router();

router.get("/", requestAuth(process.env.ACCESS_TOKEN_SECRET), PostController.getAllPosts);

router.post(
  "/",
  requestAuth(process.env.ACCESS_TOKEN_SECRET),
  validate(createPostValidator),
  PostController.createPost
);

router.delete("/:id", requestAuthSameId(process.env.ACCESS_TOKEN_SECRET), PostController.deletePost);

router.post("/:id/view", requestAuth(process.env.ACCESS_TOKEN_SECRET), PostController.viewPost);

router.post("/:id/like", requestAuth(process.env.ACCESS_TOKEN_SECRET), PostController.likePost);

router.post("/:id/dislike", requestAuth(process.env.ACCESS_TOKEN_SECRET), PostController.dislikePost);

export default router;
