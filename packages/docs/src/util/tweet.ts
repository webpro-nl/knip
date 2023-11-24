export const replaceShortenedUrls = (tweet: TweetWithUser) => {
  if (!tweet.entities.urls) return tweet;
  let text = tweet.note_tweet?.text ?? tweet.text;
  tweet.entities.urls.sort((a, b) => b.start - a.start);
  tweet.entities.urls.forEach(urlEntity => {
    if (urlEntity.media_key) {
      const media = (tweet.media ?? []).find(media => media.media_key === urlEntity.media_key);
      if (media && media.type === 'photo') {
        text = text.replace(urlEntity.url, `<img src="${media.url}" alt="${media.alt_text}" />`);
      }
    } else if (urlEntity.expanded_url.includes('twitter.com')) {
      text = text.replace(urlEntity.url, '');
    } else {
      text = text.replace(urlEntity.url, `<a href="${urlEntity.expanded_url}">${urlEntity.expanded_url}</a>`);
    }
  });
  if (tweet.media && tweet.note_tweet?.text) {
    text = text + tweet.media.map(media => `<img src="${media.url}" alt="${media.alt_text}" />`).join('');
  }
  tweet.text = text;
  return tweet;
};

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
  note_tweet: {
    text: string;
  };
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
  media_key?: string;
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

interface Media {
  url: string;
  type: 'photo';
  alt_text: string;
  media_key: string;
}

export interface TweetWithUser extends Tweet {
  media?: Media[];
  user: User;
}

export interface TweetsResponse {
  data: Tweet[];
  includes: {
    users: User[];
    media: Media[];
  };
}
