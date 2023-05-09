export function applyRegex(lgn?: string) {
  if (!process.env.LOG_GROUP_MATCH_REGEX) return true;
  const regex = new RegExp(process.env.LOG_GROUP_MATCH_REGEX);
  const match = lgn?.match(regex);
  return !!match;
}
