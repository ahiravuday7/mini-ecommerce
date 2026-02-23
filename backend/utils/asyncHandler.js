const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

// This is a higher-order function that wraps async controller.
// fn is controller function (req, res) => { ... }
// It returns a new function (req, res, next) => { ... } that:
// executes your controller
// if it throws an error OR a promise rejects → .catch(next) sends it to Express error middleware
