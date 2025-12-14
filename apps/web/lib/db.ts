import Dexie, { Table } from 'dexie';

export interface OfflineAction {
    id?: number;
    url: string;
    method: string;
    body: any;
    timestamp: number;
    synced: boolean;
    retryCount: number;
}

export interface LocalDonation {
    id: string; // uuid
    description: string;
    category: string;
    qty: number;
    createdAt: number;
}

class BorderReliefDB extends Dexie {
    outbox!: Table<OfflineAction>;
    donations!: Table<LocalDonation>;

    constructor() {
        super('BorderReliefDB');
        this.version(1).stores({
            outbox: '++id, synced, timestamp',
            donations: 'id, category, createdAt'
        });
    }
}

export const db = new BorderReliefDB();

export async function addToOutbox(url: string, method: string, body: any) {
    await db.outbox.add({
        url,
        method,
        body,
        timestamp: Date.now(),
        synced: false,
        retryCount: 0
    });
}
