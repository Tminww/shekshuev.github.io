import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/userRepository.js";

export const AuthService = {
  async login(dto, config) {
    const user = await UserRepository.getUserByUserName(dto.user_name);
    if (!user) {
      throw new Error("User not found");
    }
    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new Error("Wrong password");
    }
    return this.generateTokenPair(user, config);
  },

  async register(dto, config) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUserDTO = {
      user_name: dto.user_name,
      password_hash: hashedPassword,
      first_name: dto.first_name,
      last_name: dto.last_name,
    };
    const user = await UserRepository.createUser(newUserDTO);
    return this.generateTokenPair(user, config);
  },

  generateTokenPair(user, config) {
    const id = user.id.toString();
    const accessToken = jwt.sign({ sub: id }, config.ACCESS_TOKEN_SECRET, { expiresIn: config.ACCESS_TOKEN_EXPIRES });
    const refreshToken = jwt.sign({ sub: id }, config.REFRESH_TOKEN_SECRET, {
      expiresIn: config.REFRESH_TOKEN_EXPIRES,
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  },
};
