import { CopyTrader, CopySubscription, NeonDbStatus } from '../types';
import { EXACT_COPY_TRADERS } from '../data/copyTraders';

export async function fetchDbStatus(): Promise<NeonDbStatus> {
  try {
    const res = await fetch('/api/db-status');
    if (!res.ok) {
      throw new Error('Server returned ' + res.status);
    }
    const data = await res.json();
    return {
      connected: !!data.connected,
      type: data.type || 'local_fallback',
      databaseUrlConfigured: !!data.databaseUrlConfigured,
      host: data.host,
      database: data.database,
      latencyMs: data.latencyMs,
      tablesInitialized: data.tablesInitialized,
      counts: data.counts,
      error: data.error
    };
  } catch (err: any) {
    return {
      connected: false,
      type: 'local_fallback',
      databaseUrlConfigured: false,
      error: err.message
    };
  }
}

export async function connectNeonDatabase(databaseUrl: string): Promise<{ success: boolean; message: string; status?: any }> {
  try {
    const res = await fetch('/api/db-connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ databaseUrl })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, message: data.error || 'Failed to connect to Neon PostgreSQL' };
    }
    return { success: true, message: data.message, status: data.status };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error connecting to database' };
  }
}

export async function recordCopySubscription(sub: {
  traderId: string;
  traderName: string;
  traderSpecialty: string;
  amount: number;
  userId?: string;
}): Promise<{ success: boolean; subscriptionId?: string }> {
  try {
    const res = await fetch('/api/copy-traders/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub)
    });
    const data = await res.json();
    return { success: !!data.success, subscriptionId: data.subscriptionId };
  } catch (err) {
    return { success: true, subscriptionId: `sub_offline_${Date.now()}` };
  }
}
