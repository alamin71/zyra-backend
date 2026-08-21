// Express types route params as `string | string[]` to account for routes
// like `:id+`/`:id*`. None of ours use that pattern, so a param is always a
// single string at runtime — this just narrows the type back down instead
// of repeating the same array-guard at every call site.
export const resolveParam = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;
