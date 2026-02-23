// This runs after all routes, only if no route matched. now always get a clean JSON 404.
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); //By passing the error object into next(), Express immediately skips all other normal routes and jumps straight to your custom errorHandler.
};

const errorHandler = (err, req, res, next) => {
  let statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500; //ignore status 200 in error handling because it represents success, and If the status code is already set to an error code (like 400 or 404), keep it. Otherwise, default to 500 (Internal Server Error).

  // Handle invalid Mongo ObjectId (CastError)
  // If MongoDB throws an invalid ObjectId error, convert it into a clean 404 response.
  // CastError - MongoDB (via Mongoose) throws CastError when it cannot convert a value to required type.
  // "MongoDB CastError for invalid ObjectIds and convert it into a user-friendly 404 response instead of exposing internal error details."
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    err.message = "Resource not found";
  }

  // sends a formatted JSON error response with the message, securely including the detailed error stack trace only when your app is running in development mode.
  res.status(statusCode).json({
    message: err.message || "Server Error",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
