// Restrict storage access to trusted extension contexts (no content scripts).
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.storage.local.setAccessLevel) {
    chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }).catch(() => {});
  }
});
