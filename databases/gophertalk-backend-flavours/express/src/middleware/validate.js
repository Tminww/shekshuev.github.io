export function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      res
        .status(422)
        .json({ message: "Validation failed", errors: err.errors });
    }
  };
}
