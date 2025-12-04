export abstract class DataError extends Error {
  abstract object: string;
  abstract properties: string[];
}

export class NotFoundDataError extends DataError {
  static status = 422;
  type = "not_found";

  constructor(
    public object: string,
    public properties: string[],
  ) {
    super(
      `At least one property of the ${object} has a value pointing to an resource that could not be found.`,
    );
  }
}

export class AlreadyTakenDataError extends DataError {
  static status = 409;
  type = "already_taken";

  constructor(
    public object: string,
    public properties: string[],
  ) {
    super(
      `At least one property of the ${object} has a value that is already taken.`,
    );
  }
}

export class MismatchDataError extends DataError {
  static status = 400;
  type = "mismatch";

  constructor(
    public object: string,
    public properties: string[],
  ) {
    super(`The ${object} contains some properties whose values don't match.`);
  }
}
