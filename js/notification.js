// Get the necessary DOM elements
const notificationIcon = document.getElementById('notificationIcon');
const notificationCount = document.getElementById('notificationCount');
const notificationCard = document.getElementById('notificationCard');
const notificationContent = document.getElementById('notificationContent');
const closeNotificationCard = document.getElementById('closeNotificationCard');

// Check for unread notifications and update the count
let unreadCount = 0;
notifications.forEach(notification => {
  if (!localStorage.getItem(`notification-${notification.id}`)) {
    unreadCount++;
  }
});
notificationCount.textContent = unreadCount;
if (unreadCount > 0) {
  notificationIcon.classList.add('shake');
}

// Handle clicking the notification icon
notificationIcon.addEventListener('click', () => {
  notificationCard.style.display = 'block';
  updateNotificationCard();
});

// Close the notification card
closeNotificationCard.addEventListener('click', () => {
  notificationCard.style.display = 'none';
});

// Update the notification card content
function updateNotificationCard() {
  notificationContent.innerHTML = '';
  notifications.forEach(notification => {
    const isRead = localStorage.getItem(`notification-${notification.id}`);
    const notificationItem = document.createElement('div');
    notificationItem.classList.add('dth-notification-item');
    notificationItem.innerHTML = `
    <i class="fas fa-bell dth-notification-item__icon"></i>
    <div class="dth-notification-item__message">${notification.message}</div>
    <div class="dth-notification-item__timestamp">${notification.timestamp}</div>
    `;
    if (isRead) {
      notificationItem.style.opacity = '0.5';
    }
    notificationContent.appendChild(notificationItem);
  });
  notificationIcon.classList.remove('shake');
  localStorage.setItem('lastViewedNotifications',
    new Date().toISOString());
}

// Initially hide the notification card
notificationCard.style.display = 'none';