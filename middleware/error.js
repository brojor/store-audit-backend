exports.errorHandler = (err, req, res, next) => {
  console.log('errorhandler');
  res.status(res.statusCode || 500);
  res.json({
    success: false,
    message: err.message,
    //   stack: err.stack,
  });
};
