export const asyncHandler = (func) => {
  return (req, res, next) => {
    func(req, res, next).catch((error) => {
      if (Object.keys(error).length === 0) {
        return next(new Error(error.message));
      }
      return next(error);
    });
  };
};
