export function getCurrentFormattedDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

console.log(getCurrentFormattedDate());