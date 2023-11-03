const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
  hour12: true,
  timeZone: 'UTC',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour12: true,
  timeZone: 'UTC',
});

export const formatTimestamp = (date: string) => {
  const d = new Date(date);
  return `${timeFormatter.format(d)} · ${dateFormatter.format(d)}`;
};

interface Tweet {
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    bookmark_count: number;
    impression_count: number;
  };
  author_id: string;
  entities: {
    urls: UrlEntity[];
    mentions?: MentionEntity[];
    annotations?: AnnotationEntity[];
  };
  text: string;
  id: string;
  edit_history_tweet_ids: string[];
  created_at: string;
}

interface UrlEntity {
  start: number;
  end: number;
  url: string;
  expanded_url: string;
  display_url: string;
  images?: ImageEntity[];
  status?: number;
  title?: string;
  description?: string;
  unwound_url?: string;
}

interface MentionEntity {
  start: number;
  end: number;
  username: string;
  id: string;
}

interface AnnotationEntity {
  start: number;
  end: number;
  probability: number;
  type: string;
  normalized_text: string;
}

interface ImageEntity {
  url: string;
  width: number;
  height: number;
}

interface User {
  username: string;
  profile_image_url: string;
  name: string;
  id: string;
}

export interface TweetWithUser extends Tweet {
  user: User;
}

export interface TweetsResponse {
  data: Tweet[];
  includes: {
    users: User[];
  };
}
