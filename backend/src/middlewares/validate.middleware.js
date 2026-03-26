import { ZodError } from "zod";

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,

        query: req.query,

        params: req.params,
      });

      // safe mutation
      if (parsed.body) req.body = parsed.body;

      // DO NOT overwrite req.query or req.params
      // they are getter-based in express

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,

          code: "VALIDATION_ERROR",

          message: "Validation failed",

          errors: error.issues.map((issue) => ({
            field: issue.path.join("."),

            message: issue.message,
          })),
        });
      }

      next(error);
    }
  };
};
