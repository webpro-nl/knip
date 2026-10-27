try {
  await import('./missing');
} catch {
  // The missing local file is still a resolution error.
}
