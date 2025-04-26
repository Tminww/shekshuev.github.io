import { PostRepository } from "../repositories/postRepository.js";

export const PostService = {
  async getAllPosts(filterDTO) {
    return await PostRepository.getAllPosts(filterDTO);
  },

  async createPost(createDTO) {
    return await PostRepository.createPost(createDTO);
  },

  async deletePost(postId, ownerId) {
    return await PostRepository.deletePost(postId, ownerId);
  },

  async viewPost(postId, userId) {
    return await PostRepository.viewPost(postId, userId);
  },

  async likePost(postId, userId) {
    return await PostRepository.likePost(postId, userId);
  },

  async dislikePost(postId, userId) {
    return await PostRepository.dislikePost(postId, userId);
  },
};
