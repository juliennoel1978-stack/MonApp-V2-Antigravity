// Polyfill for web compatibility
try {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window._frameTimestamp = null;
    // @ts-ignore
    window.__reanimatedLoggerConfig = {
      debug: false,
    };
    // @ts-ignore
    window.__workletSpec = true;
    // @ts-ignore
    window.__reanimatedWorkletInit = function() {};
  }
} catch (e) {
  console.log('Polyfill setup warning:', e);
}
