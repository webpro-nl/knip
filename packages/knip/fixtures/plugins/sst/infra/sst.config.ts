export default $config({
  app() {
    return { name: 'infra', home: 'aws' };
  },
  async run() {
    new sst.aws.Function('Queue', { handler: 'functions/queue.handler' });
  },
});
