self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'New message', body: 'You have a new message' };
  }

  const title = payload.title || 'New message';
  const options = {
    body: payload.body || 'You have a new message',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.tag || 'chat-notification',
    data: {
      url: payload.url || '/homepage?tab=chat',
      channelType: payload.channelType,
      channelId: payload.channelId,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/homepage?tab=chat';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      }),
  );
});
