exports.chartProtect = async (req, res, next) => {
  const { id, type } = req.params;

  if (id === 'all' && req.user.role !== 'topManagement') {
    const error = new Error('Not authorized to access this route');
    res.status(401);
    return next(error);
  }
  next();
};
