// frontend/src/lib/pusher.ts
import Pusher from 'pusher-js';

export const PUSHER_KEY = '4af7213fc2bbb411c2ef';
export const PUSHER_CLUSTER = 'ap2';

let pusherInstance: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
    });
  }
  return pusherInstance;
}
