
function renderNotificationItem(n) {
  const title = n.title || "Notification";
  const message = n.message || "";
  const timeAgo = n.timeAgo || "";

  return `
    <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 transition-colors cursor-pointer">
      <div class="flex items-start space-x-3">
        <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-info-circle text-blue-600 dark:text-blue-400 text-sm"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-900 dark:text-white">${title}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">${message}</p>
          ${
            timeAgo
              ? `<p class="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center">
                  <i class="fa-solid fa-clock mr-1"></i>${timeAgo}
                </p>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

async function loadNotifications() {
  const lists = document.querySelectorAll("[data-notification-list]");
  if (!lists.length) return;

  try {
    // Dummy fallback
    const notifications = [
      {
        title: "Deposit Submitted",
        message:
          "Your deposit of $1000 via Bank Transfer has been received and is pending approval.",
        timeAgo: "4 months ago",
      },
      {
        title: "Loan Application Submitted",
        message:
          "Your loan application has been submitted successfully and is pending approval.",
        timeAgo: "4 months ago",
      },
    ];

    if (!notifications.length) {
      lists.forEach((list) => {
        list.innerHTML = `
          <div class="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No notifications yet
          </div>
        `;
      });
      return;
    }

    const html = notifications.map(renderNotificationItem).join("");
    lists.forEach((list) => (list.innerHTML = html));

    const markBtns = document.querySelectorAll("[data-mark-all-read]");
    markBtns.forEach((btn) => {
      btn.onclick = () => console.log("Mark all as read clicked");
    });
  } catch (e) {
    console.error("loadNotifications:", e);
    lists.forEach((list) => {
      list.innerHTML = `
        <div class="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Failed to load notifications
        </div>
      `;
    });
  }
}

window.loadNotifications = loadNotifications;
