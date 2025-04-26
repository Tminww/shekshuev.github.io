import jwt from "jsonwebtoken";

export function requestAuth(secret) {
  return function (req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.sendStatus(401);
    }

    const token = authHeader.substring(7);
    try {
      const claims = jwt.verify(token, secret);
      req.user = claims;
      next();
    } catch (err) {
      return res.sendStatus(401);
    }
  };
}

export function requestAuthSameId(secret) {
  return function (req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.sendStatus(401);
    }

    const token = authHeader.substring(7);
    try {
      const claims = jwt.verify(token, secret);
      const paramId = req.params.id;

      if (!paramId || isNaN(paramId)) {
        return next();
      }

      if (paramId !== claims.sub) {
        return res.sendStatus(401);
      }

      req.user = claims;
      next();
    } catch (err) {
      return res.sendStatus(401);
    }
  };
}
