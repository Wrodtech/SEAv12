// Service Worker Registration
class PWARegistrar {
  constructor() {
    this.isUpdateAvailable = false;
    this.updateAvailableCallback = null;
    this.init();
  }

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker();
        await this.setupPeriodicSync();
        this.setupUpdateChecks();
      } catch (error) {
        console.error('PWA setup failed:', error);
      }
    } else {
      console.log('Service Worker not supported');
    }
  }

  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('Service Worker registered:', registration);

      // Check for updates immediately
      registration.update();

      // Listen for controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('New Service Worker activated');
        if (this.isUpdateAvailable && this.updateAvailableCallback) {
          this.updateAvailableCallback();
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          console.log('Update available:', event.data.version);
          this.isUpdateAvailable = true;
          this.showUpdateNotification(event.data.version);
        }
      });

      // Check if service worker is controlling the page
      if (navigator.serviceWorker.controller) {
        console.log('Service Worker is controlling the page');
      } else {
        console.log('Service Worker not controlling, waiting...');
      }

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  async setupPeriodicSync() {
    if ('periodicSync' in registration) {
      try {
        const status = await navigator.permissions.query({
          name: 'periodic-background-sync',
        });

        if (status.state === 'granted') {
          await registration.periodicSync.register('check-updates', {
            minInterval: 24 * 60 * 60 * 1000, // 1 day
          });
          console.log('Periodic sync registered');
        }
      } catch (error) {
        console.log('Periodic sync could not be registered:', error);
      }
    }
  }

  setupUpdateChecks() {
    // Check for updates every hour
    setInterval(() => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
      }
    }, 60 * 60 * 1000);
  }

  showUpdateNotification(version) {
    // Show update notification to user
    const updateNotification = document.createElement('div');
    updateNotification.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary-color);
      color: white;
      padding: 16px;
      border-radius: var(--radius);
      box-shadow: var(--shadow-md);
      z-index: 10000;
      max-width: 90%;
      text-align: center;
    `;
    
    updateNotification.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold;">Update Available (v${version})</div>
      <button id="update-app" style="
        background: white;
        color: var(--primary-color);
        border: none;
        padding: 8px 16px;
        border-radius: var(--radius-sm);
        font-weight: bold;
        cursor: pointer;
        margin-right: 8px;
      ">Update Now</button>
      <button id="dismiss-update" style="
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 8px 16px;
        border-radius: var(--radius-sm);
        cursor: pointer;
      ">Later</button>
    `;

    document.body.appendChild(updateNotification);

    document.getElementById('update-app').addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('dismiss-update').addEventListener('click', () => {
      document.body.removeChild(updateNotification);
    });
  }

  // Request background sync
  async requestBackgroundSync(tag = 'sync-calculations') {
    if ('sync' in registration) {
      try {
        await registration.sync.register(tag);
        console.log('Background sync registered:', tag);
        return true;
      } catch (error) {
        console.error('Background sync failed:', error);
        return false;
      }
    }
    return false;
  }

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window && 'permissions' in navigator) {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Notification permission error:', error);
        return false;
      }
    }
    return false;
  }

  // Check if app is installed
  isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
  }

  // Show install prompt (for browsers that support it)
  showInstallPrompt() {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted install');
        }
        window.deferredPrompt = null;
      });
    }
  }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.pwaRegistrar = new PWARegistrar();
  
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    
    // Show install button if not already installed
    if (!window.pwaRegistrar.isAppInstalled()) {
      showInstallButton();
    }
  });
  
  // Check if app launched from homescreen
  if (window.pwaRegistrar.isAppInstalled()) {
    console.log('App launched from homescreen');
    document.documentElement.setAttribute('data-launch-mode', 'standalone');
  }
});

function showInstallButton() {
  // Add install button to header if not already there
  if (!document.getElementById('install-button')) {
    const installButton = document.createElement('button');
    installButton.id = 'install-button';
    installButton.className = 'icon-button';
    installButton.innerHTML = '📱';
    installButton.title = 'Install App';
    installButton.setAttribute('aria-label', 'Install as App');
    installButton.style.marginLeft = '8px';
    
    installButton.addEventListener('click', () => {
      window.pwaRegistrar.showInstallPrompt();
    });
    
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      headerActions.appendChild(installButton);
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWARegistrar;
}