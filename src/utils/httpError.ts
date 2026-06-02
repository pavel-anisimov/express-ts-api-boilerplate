/**
 * Error type used by services to request a specific HTTP response.
 *
 * Controllers and error middleware translate this into the public error
 * envelope, while unexpected errors continue through Express as 500s.
 */
export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}
