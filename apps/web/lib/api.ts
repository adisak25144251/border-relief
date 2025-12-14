export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiRequest(endpoint: string, method: string = 'GET', body?: any, token?: string) {
    const headers: any = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error('API Request Failed');
        return await res.json();
    } catch (error) {
        if (!navigator.onLine && method !== 'GET') {
            // Offline mode: allow queueing
            console.warn('Network offline. Queueing request.');
            saveToOfflineQueue(endpoint, method, body);
            return { offline: true, message: 'Saved to outbox' };
        }
        throw error;
    }
}

function saveToOfflineQueue(endpoint: string, method: string, body: any) {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    queue.push({ endpoint, method, body, timestamp: Date.now() });
    localStorage.setItem('offlineQueue', JSON.stringify(queue));
}

export async function syncOfflineQueue(token: string) {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    if (queue.length === 0) return;

    const newQueue = [];
    for (const item of queue) {
        try {
            await apiRequest(item.endpoint, item.method, item.body, token);
        } catch (e) {
            newQueue.push(item); // Retry later
        }
    }
    localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
}
