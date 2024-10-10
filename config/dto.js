exports.sendResponse = (res, code, message, data, count) => {
  let response = {
    count,
    code,
    message,
    results: data?.length || undefined,
    body: data ? data : []
  };
  return res.status(code).json(response);
};

exports.sendEmailResponse = (res, file) => {
  return res.redirect(file);
};

exports.errReturned = (res, err) => {
  console.log(err);
  res.status(400).json({
    code: 400,
    message: err['message'] || err
  });
};

exports.sendSocketResponse = (socket, event, code, message, data) => {
  let response = {
    code,
    message,
    body: data ? data : []
  };
  socket.emit(event, response);
};

exports.errSocketReturned = (socket, err) => {
  console.log(err);
  let errorMessage = err.message || err;
  socket.emit('error', errorMessage);
};
