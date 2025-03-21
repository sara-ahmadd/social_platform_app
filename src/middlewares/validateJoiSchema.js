import joi from "joi";

export const validate = (schema) => {
  return async (req, res, next) => {
    const data = {
      ...req.body,
      ...req.params,
      ...req.query,
      file: req.file || req.files || null,
    };
    if (!req.file && !req.files) delete data.file;
    const checkScema = await schema.validate(data, { abortEarly: false });

    if (checkScema.error) {
      return next(
        new Error(
          checkScema.error.details.map((obj) => obj.message).join(", "),
          { cause: 400 }
        )
      );
    }
    return next();
  };
};
