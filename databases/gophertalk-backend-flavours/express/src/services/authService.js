import { UserRepository } from "../repositories/userRepository.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";
import { createToken } from "../utils/token.js";

export const AuthService = {
  async login(dto, config) {
    const user = await UserRepository.getUserByUserName(dto.user_name);
    if (!user) {
      throw new Error("User not found");
    }
    const valid = verifyPassword(dto.password, user.password_hash);
    if (!valid) {
      throw new Error("Wrong password");
    }
    return this.generateTokenPair(user, config);
  },

  async register(dto, config) {
    const hashedPassword = hashPassword(dto.password);
    const newUserDTO = {
      user_name: dto.user_name,
      password_hash: hashedPassword,
      first_name: dto.first_name,
      last_name: dto.last_name,
    };
    const user = await UserRepository.createUser(newUserDTO);
    return this.generateTokenPair(user, config);
  },

  async generateTokenPair(user, config) {
    const id = user.id.toString();
    const accessToken = createToken(config.ACCESS_TOKEN_SECRET, id, config.ACCESS_TOKEN_EXPIRES);
    const refreshToken = createToken(config.REFRESH_TOKEN_SECRET, id, config.REFRESH_TOKEN_EXPIRES);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  },
};
