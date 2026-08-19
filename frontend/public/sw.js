self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.titre || 'SGH', {
      body: data.message || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: data.type || 'notification',
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/notifications'));
});
