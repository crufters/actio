export class Error {
  /** Error message */
  message: string;
  /** HTTP code */
  status: number;

  constructor(message: string, status: number) {
    this.message = message;
    this.status = status;
  }
}

export function error(message: string, status?: number): Error {
  return new Error(message, status);
}

export function copy(from, to) {
  if (!from || !to) {
    return;
  }
  for (const [key, value] of Object.entries(from)) {
    to[key] = value;
  }
}

export interface ServiceMeta {
  name?: string;
}

/**
 * Servicelike is an interface that is used to describe a service.
 * Services should not panic if they are not supplied with all the dependencies
 * at the time of construction.
 *
 * The endpoints of a service are its method:
 * - Methods annotated with the `@Raw()` decorator will be registered as
 * direct http methods and have access to http request and response types.
 * A prime example of this is a file upload.
 * - Method names starting with underscore are callbacks to specific events,
 * see examples below.
 * - All other methods will only have access to their JSON request data.
 * This is favorable to raw http methods as it is cleaner, enables testing etc.
 *
 */
export interface Servicelike {
  /**
   * Meta contains metadata about the service.
   * This can range from registration name to dependency config -
   * like entities for the `TypeORMHandler`.
   */
  meta?: ServiceMeta;

  /**
   * Called when a service is initialized.
   * Typically this happens when the server starts up.
   */
  _onInit?: () => Promise<void>;
}

/**
 * Configurable contains config options all service
 * configs should ideally implement.
 */
export interface Configurable {
  skipSeed?: boolean;
}
