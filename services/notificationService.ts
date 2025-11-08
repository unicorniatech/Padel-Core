
export const requestNotificationPermission = async (): Promise<void> => {
    if (!("Notification" in window)) {
        console.log("Este navegador no soporta notificaciones de escritorio.");
        return;
    }

    if (Notification.permission === 'granted') {
        return;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Permiso de notificación concedido.');
            showNotification('¡Gracias!', { body: 'Ahora recibirás notificaciones importantes de Padel Core.' });
        }
    }
};

export const showNotification = (title: string, options?: NotificationOptions): void => {
    if (!("Notification" in window)) {
        console.error("Este navegador no soporta notificaciones de escritorio.");
        return;
    }

    if (Notification.permission === 'granted') {
        // Use a generic icon if none is provided. A real app might have one at /favicon.ico
        const notificationOptions = {
            icon: 'https://picsum.photos/seed/icon/192', 
            ...options
        };
        new Notification(title, notificationOptions);
    } else {
        console.log('Permiso de notificación no concedido. No se puede mostrar la notificación.');
    }
};
