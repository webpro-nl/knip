import { closeMainWindow } from '@raycast/api';
import { loadBookmarks } from './shared/load-bookmarks';

export default async function Command() {
  await closeMainWindow();
  return loadBookmarks();
}
