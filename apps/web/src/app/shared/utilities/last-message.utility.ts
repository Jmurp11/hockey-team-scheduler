export function getLastMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const current = new Date();
  const diffInMs = current.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hr ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}
