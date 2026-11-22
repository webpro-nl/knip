export async function getOptionalPeer() {
  try {
    return await import('optional-peer');
  } catch {
    return null;
  }
}
