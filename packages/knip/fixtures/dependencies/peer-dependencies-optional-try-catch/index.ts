export async function getOptionalPeer() {
  try {
    return await import('pg');
  } catch {
    return null;
  }
}
