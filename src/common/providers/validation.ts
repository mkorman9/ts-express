export const parseDate = (arg: unknown): (Date | null | undefined) => {
  if (arg === null) {
    return null;
  }

  if (typeof arg === 'string' || arg instanceof Date) {
    return new Date(arg);
  }

  return undefined;
};
