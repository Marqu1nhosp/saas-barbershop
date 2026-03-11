'use client';

import { useSyncDashboardSession } from '@/lib/use-sync-dashboard-session';

export function DashboardSessionSync() {
    useSyncDashboardSession();
    return null;
}
