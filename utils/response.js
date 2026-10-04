function success(res, data = null, message = 'OK', status = 200, meta = undefined) {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
}

function created(res, data = null, message = 'Created') {
  return success(res, data, message, 201);
}

function failure(res, message = 'Request failed', status = 400, details = undefined) {
  const body = { success: false, message };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}

module.exports = { success, created, failure, ok: success, fail: failure };
