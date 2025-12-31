/**
 * Cache Clearing Utility
 * Run this in browser console to completely clear all caches and reload
 *
 * Usage: Copy this entire file content and paste in browser console
 */

export async function clearAllCaches() {
  console.log('🧹 Starting cache clearing process...');

  // 1. Unregister all service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`Found ${registrations.length} service worker(s)`);

    for (const registration of registrations) {
      console.log('Unregistering service worker...');
      await registration.unregister();
    }
    console.log('✅ All service workers unregistered');
  }

  // 2. Clear all caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log(`Found ${cacheNames.length} cache(s):`, cacheNames);

    for (const cacheName of cacheNames) {
      console.log(`Deleting cache: ${cacheName}`);
      await caches.delete(cacheName);
    }
    console.log('✅ All caches cleared');
  }

  // 3. Clear localStorage
  console.log('Clearing localStorage...');
  localStorage.clear();
  console.log('✅ localStorage cleared');

  // 4. Clear sessionStorage
  console.log('Clearing sessionStorage...');
  sessionStorage.clear();
  console.log('✅ sessionStorage cleared');

  // 5. Clear IndexedDB (for offline data)
  if ('indexedDB' in window) {
    console.log('Clearing IndexedDB...');
    const databases = await indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
        console.log(`Deleted database: ${db.name}`);
      }
    }
    console.log('✅ IndexedDB cleared');
  }

  console.log('🎉 Cache clearing complete! Reloading page...');

  // Hard reload with cache bypass
  setTimeout(() => {
    window.location.reload();
  }, 500);
}

// Auto-run if this file is imported
if (typeof window !== 'undefined') {
  console.log('Cache clearing utility loaded. Run clearAllCaches() to clear everything.');
}
