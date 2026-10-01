import { slackCredentials } from 'channel-credentials';
import { slackChannel } from 'eve/channels/slack';

export default slackChannel({
  credentials: slackCredentials(),
});
