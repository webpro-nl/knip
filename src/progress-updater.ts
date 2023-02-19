import { LineRewriter } from './util/log.js';

type ProgressUpdaterOptions = {
  isShowProgress?: boolean;
};

/**
 * - Updates progress/stats in console during the process
 */
export class ProgressUpdater {
  lineRewriter: LineRewriter;
  isShowProgress = false;

  constructor({ isShowProgress = false }: ProgressUpdaterOptions) {
    this.lineRewriter = new LineRewriter();
    this.setIsShowProgress(isShowProgress);
  }

  setIsShowProgress(isShowProgress: boolean) {
    this.isShowProgress = isShowProgress;
  }

  updateMessage(message: string) {
    if (!this.isShowProgress) return;
    this.lineRewriter.update([message]);
  }

  removeProgress() {
    if (!this.isShowProgress) return;
    this.lineRewriter.resetLines();
  }
}
