import type { CustomProjectConfig } from 'lost-pixel';

export const config: CustomProjectConfig = {
  apiKey: process.env.LOST_PIXEL_API_KEY,

  ladleShots: {
    ladleUrl: 'dist/ladle',
  },

  lostPixelProjectId: process.env.LOST_PIXEL_PROJECT_ID,

  shotConcurrency: 5,
  setPendingStatusCheck: true,

  imagePathBaseline: '.lostpixel/baseline',
  imagePathCurrent: '.lostpixel/current',
  imagePathDifference: '.lostpixel/difference',

  ciBuildId: process.env.BUILD_ID,
  ciBuildNumber: process.env.BUILD_NUMBER,
  repository: process.env.REPOSITORY_NAME,
  commitRefName: process.env.CHANGE_BRANCH ?? process.env.BRANCH_NAME,
  commitHash: process.env.GIT_COMMIT,

  configureBrowser: () => ({
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36',
    viewport: {
      width: 800,
      height: 600,
    },
  }),
};
