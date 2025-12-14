import { db, OfflineAction } from './db';
import { API_URL } from './api'; // Assuming defined earlier

export async function syncOutbox() {
    if (!navigator.onLine) {
        console.log('Offline: Skipping sync');
        return;
    }

    const pendingActions = await db.outbox.where('synced').equals(0).toArray();

    if (pendingActions.length === 0) return;

    console.log(`Syncing ${pendingActions.length} items...`);

    // Simple sequential sync
    for (const action of pendingActions) {
        try {
            const res = await fetch(`${API_URL}${action.url}`, {
                method: action.method,
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': ... get token
                },
                body: JSON.stringify(action.body),
            });

            if (res.ok) {
                // Mark as synced or delete
                await db.outbox.delete(action.id!);
                console.log(`Action ${action.id} synced.`);
            } else {
                console.error(`Sync failed for ${action.id}: ${res.status}`);
                // Implement retry count logic here
            }
        } catch (err) {
            console.error(`Network error for ${action.id}`, err);
        }
    }
}

// Auto-sync every 30s
if (typeof window !== 'undefined') {
    setInterval(syncOutbox, 30000);
    window.addEventListener('online', syncOutbox);
}
