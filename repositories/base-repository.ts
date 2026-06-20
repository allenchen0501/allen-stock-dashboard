export interface BaseRepository<TEntity, TCreate, TUpdate> {
  findAll(): Promise<TEntity[]>;
  findById(id: string): Promise<TEntity | null>;
  create(input: TCreate): Promise<TEntity>;
  update(id: string, input: TUpdate): Promise<TEntity>;
  delete(id: string): Promise<void>;
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly operation: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export function raiseOnRepositoryError(error: unknown, operation: string): void {
  if (!error) return;

  const detail =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "Unknown database error";

  throw new RepositoryError(`${operation}: ${detail}`, operation, error);
}

export function requireRepositoryData<T>(
  data: T | null,
  operation: string,
): T {
  if (data !== null) return data;
  throw new RepositoryError(`${operation}: Database returned no data`, operation);
}
