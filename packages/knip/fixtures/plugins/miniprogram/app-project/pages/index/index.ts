import { formatDate } from '~/utils/missing-date';

Page({
  data: {
    now: Date.now(),
    text: ''
  },
  onLoad() {
    this.setData({
      text: formatDate(this.data.now)
    });
  }
}); 