// frontend/src/components/notifications/RealtimeListener.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPusherClient } from '@/lib/pusher';
import RealtimeToast, { RealtimeToastData } from './RealtimeToast';

export default function RealtimeListener() {
  const { user, refreshUser } = useAuth();
  const [toastData, setToastData] = useState<RealtimeToastData | null>(null);

  useEffect(() => {
    if (!user || !user.id) return;

    try {
      const pusher = getPusherClient();
      const channelName = `user-${user.id}`;
      const channel = pusher.subscribe(channelName);

      // Handler for live notifications / team invites
      const handleEvent = (data: any) => {
        let payload: RealtimeToastData;
        if (typeof data === 'string') {
          try {
            payload = JSON.parse(data);
          } catch {
            payload = { title: 'Notification', message: data };
          }
        } else {
          payload = data;
        }

        setToastData(payload);

        // Refresh user session & pending invites in background so UI counters update instantly
        refreshUser();
      };

      channel.bind('new_notification', handleEvent);
      channel.bind('team_invite', handleEvent);

      return () => {
        channel.unbind('new_notification', handleEvent);
        channel.unbind('team_invite', handleEvent);
        pusher.unsubscribe(channelName);
      };
    } catch (err) {
      console.warn('Pusher connection error:', err);
    }
  }, [user?.id, refreshUser]);

  if (!toastData) return null;

  return (
    <RealtimeToast
      data={toastData}
      onClose={() => setToastData(null)}
    />
  );
}
