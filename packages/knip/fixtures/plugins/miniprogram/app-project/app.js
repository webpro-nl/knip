App({
  onLaunch() {
    // Create worker
    const worker = wx.createWorker('workers/request');
    
    worker.onMessage((msg) => {
      console.log(msg);
    });
  }
}); 