const asyncHandler = (fn) => {
  if (typeof fn !== "function") {
    throw new TypeError("Route handler must be a function");
  }

  return (req, res, next) => {
    try {
      Promise.resolve(fn(req, res, next)).catch(next);
    } catch (err) {
      next(err);
    }
  };
};

export { asyncHandler };
