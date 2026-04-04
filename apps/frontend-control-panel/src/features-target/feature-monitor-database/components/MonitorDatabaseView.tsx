'use client';

/**
 * MonitorDatabaseView - Main UI for database monitoring
 * Features:
 * - Real-time database stats aggregates
 * - Table listing with size and row counts
 * - Table management (Drop table)
 * - Metadata cleanup
 */

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Icons, MODULE_LABELS } from '@/lib/config/client';
import { useMonitorDatabase } from '../composables/useMonitorDatabase';
import { DatabaseStatsCard } from './DatabaseStatsCard';
import { MonitorTablesList } from './MonitorTablesList';
import { TargetLayout } from '@/components/layout/TargetLayout';
import { TextHeading } from '@/components/ui/text-heading';
import { cn } from '@/lib/utils';
import { useToast } from '@/modules/_core';

const L = MODULE_LABELS.monitorDatabase?.labels || {};
const BTN = MODULE_LABELS.monitorDatabase?.buttons || {};

export const MonitorDatabaseView = () => {
  const { addToast } = useToast();
  const { stats, loading, dropping, refresh, dropTable, cleanupOrphaned } = useMonitorDatabase();

  const [isCleaning, setIsCleaning] = useState(false);

  const handleCleanup = async () => {
    setIsCleaning(true);
    await cleanupOrphaned();
    setIsCleaning(false);
    addToast(BTN.cleanup?.toLowerCase() || 'cleanup complete', 'success');
  };

  return (
    <TargetLayout>
      <div className="relative w-full min-h-screen bg-background font-instrument overflow-x-hidden pb-10 sm:pb-20">
        <main className="relative z-10 w-full max-w-7xl mx-auto py-6 md:py-10 px-4 md:px-10 flex flex-col gap-10 md:gap-14 animate-spring">
          {/* BOLD COLOR HEADER - CLEAN TYPO */}
          <header className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <TextHeading as="h1" size="h3">
                {MODULE_LABELS.monitorDatabase?.title}
              </TextHeading>
              <span className="text-sm md:text-lg text-muted-foreground/40 font-normal lowercase tracking-normal">
                {MODULE_LABELS.monitorDatabase?.subtitle?.toLowerCase()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  refresh();
                  addToast('database refreshed', 'success');
                }}
                disabled={loading}
                className="group rounded-full size-10 p-0 flex items-center justify-center gap-0 transition-all duration-500 ease-in-out active:scale-95 md:hover:w-36 md:hover:px-1 md:hover:gap-3 overflow-hidden border-border/40"
              >
                <Icons.refresh className={cn('size-4', loading && 'animate-spin')} />
                <span className="max-w-0 opacity-0 overflow-hidden transition-all duration-500 whitespace-nowrap lowercase md:group-hover:max-w-xs group-hover:max-w-0 md:group-hover:opacity-100">
                  refresh
                </span>
              </Button>

              <Button
                variant="default"
                onClick={handleCleanup}
                disabled={loading || isCleaning}
                className="group rounded-full size-10 p-0 flex items-center justify-center gap-0 transition-all duration-500 ease-in-out active:scale-95 md:hover:w-36 md:hover:px-1 md:hover:gap-3 overflow-hidden"
              >
                <Icons.sparkles className={cn('size-4', isCleaning && 'animate-pulse')} />
                <span className="max-w-0 opacity-0 overflow-hidden transition-all duration-500 whitespace-nowrap lowercase md:group-hover:max-w-xs group-hover:max-w-0 md:group-hover:opacity-100">
                  {BTN.cleanup?.toLowerCase() || 'cleanup'}
                </span>
              </Button>
            </div>
          </header>

          {/* Stats Cards */}
          <DatabaseStatsCard stats={stats} loading={loading} />

          {/* Tables List */}
          <MonitorTablesList
            tables={stats.tables}
            loading={loading}
            dropping={dropping}
            onDelete={dropTable}
          />
        </main>
      </div>
    </TargetLayout>
  );
};
