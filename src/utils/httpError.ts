/**
 * Represents an HTTP error that occurs during HTTP request-response operations.
 * This error includes additional properties such as the HTTP status code and an optional error code.
 *
 * @class HttpError
 * @extends Error
 *
 * @property {number} status The HTTP status code associated with this error.
 * @property {string} [code] An optional string code representing the specific error.
 *
 * @param {number} status The HTTP status code for the error.
 * @param {string} message A descriptive message detailing the error.
 * @param {string} [code] An optional string code that provides additional context about the error.
 */
export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}
