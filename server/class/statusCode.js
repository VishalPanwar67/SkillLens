const SUCCESS_CODES = [200, 201, 204];
const ERROR_CODES = [400, 401, 403, 404, 409, 429, 500, 503];
const VALID_STATUS_CODES = [...SUCCESS_CODES, ...ERROR_CODES];

const validateStatusCode = (statusCode) => {
  if (!Number.isInteger(statusCode) || !VALID_STATUS_CODES.includes(statusCode)) {
    throw new TypeError("Invalid or unsupported HTTP status code");
  }
  return statusCode;
};

const isSuccessfulStatusCode = (statusCode) => {
  return SUCCESS_CODES.includes(statusCode);
};

export { validateStatusCode, isSuccessfulStatusCode };
