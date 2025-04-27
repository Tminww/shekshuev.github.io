import { AuthService } from "../services/authService.js";

export class AuthController {
  static async login(req, res) {
    try {
      const dto = req.body;
      const tokens = await AuthService.login(dto);
      res.status(200).json(tokens);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  }

  static async register(req, res) {
    try {
      const dto = req.body;
      const tokens = await AuthService.register(dto);
      res.status(201).json(tokens);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  }
}
