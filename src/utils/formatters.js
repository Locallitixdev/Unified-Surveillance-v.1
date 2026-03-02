/**
 * Date/time formatting utility functions.
 */

/**
 * Formats a timestamp into a human-readable relative time string.
 * @param {string|number|Date} timestamp
 * @returns {string} e.g., "just now", "5s ago", "3m ago", "2h ago", "1d ago"
 */
export function formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

/**
 * Formats a timestamp to HH:MM:SS (24-hour) locale string.
 * @param {string|number|Date} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}
