export interface NotificationDto {
    id: string;
    type: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

export function timeAgo(iso: string): string {
    const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    return new Date(iso).toLocaleDateString('en-KE');
}