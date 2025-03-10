self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event received but no data.");
    return;
  }

  console.log("Push event received with data.");
  try {
    const message = event.data.json();
    console.log("Push message parsed:", message);

    event.waitUntil(
      self.registration.showNotification(message.title, {
        body: message.body,  // Pass the body
        icon: message.icon || "/profile-icon.jpg",  
        badge: "/logo-nobg-256x256.png", 
        data: { url: message.url }, 
      })
    );
  } catch (error) {
    console.error("Error displaying notification:", error);
  }
});


self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification);
  event.notification.close();

  console.log(location.href);
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
