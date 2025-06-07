module.exports = function(req, res, next) {
  const { answers } = req.body;
  
  const repeated = answers.every(a => a === answers[0]);
  if (repeated) {
    return sendJson(res, 422, false, 'Suspicious answer pattern detected');
  }
  
  next();
}