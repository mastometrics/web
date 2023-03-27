export interface MastodonAccount {
  id: string;
  username: string;
  acct: string;
  display_name: string;
  locked: boolean;
  bot: boolean;
  discoverable: boolean;
  group: boolean;
  created_at: string;
  note: string;
  url: string;
  avatar: string;
  avatar_static: string;
  header: string;
  header_static: string;
  followers_count: number;
  following_count: number;
  statuses_count: number;
  last_status_at: string;
  noindex: boolean;
  emojis: any[];
  fields: MastodonAccountField[];
}

interface MastodonAccountField {
  name: string;
  value: string;
  verified_at?: any;
}

type StatusVisibility = "public" | "unlisted" | "private" | "direct";

export interface MastodonStatus {
  id: string;
  created_at: string;
  in_reply_to_id?: string;
  in_reply_to_account_id?: string;
  sensitive: boolean;
  spoiler_text: string;
  visibility: StatusVisibility;
  language?: string;
  uri: string;
  url: string;
  replies_count: number;
  reblogs_count: number;
  favourites_count: number;
  edited_at?: any;
  content: string;
  reblog?: MastodonReblog;
  application?: MastodonApplication;
  account: MastodonAccount;
  media_attachments: MastodonMediaattachment[];
  mentions: MastodonMention[];
  tags: MastodonTag[];
  emojis: any[];
  card?: MastodonCard;
  poll?: any;
}

interface MastodonReblog {
  id: string;
  created_at: string;
  in_reply_to_id?: any;
  in_reply_to_account_id?: any;
  sensitive: boolean;
  spoiler_text: string;
  visibility: StatusVisibility;
  language: string;
  uri: string;
  url: string;
  replies_count: number;
  reblogs_count: number;
  favourites_count: number;
  edited_at?: any;
  content: string;
  reblog?: any;
  account: MastodonAccount;
  media_attachments: MastodonMediaattachment[];
  mentions: MastodonMention[];
  tags: MastodonTag[];
  emojis: any[];
  card?: MastodonCard;
  poll?: any;
  application?: MastodonApplication;
}

interface MastodonApplication {
  name: string;
  website?: any;
}

interface MastodonCard {
  url: string;
  title: string;
  description: string;
  type: string;
  author_name: string;
  author_url: string;
  provider_name: string;
  provider_url: string;
  html: string;
  width: number;
  height: number;
  image?: any;
  embed_url: string;
  blurhash?: any;
}

interface MastodonTag {
  name: string;
  url: string;
}

interface MastodonMention {
  id: string;
  username: string;
  url: string;
  acct: string;
}

interface MastodonMediaattachment {
  id: string;
  type: string;
  url: string;
  preview_url: string;
  remote_url: string;
  preview_remote_url?: any;
  text_url?: any;
  meta: MastodonMeta;
  description: string;
  blurhash: string;
}

interface MastodonMeta {
  original: MastodonOriginal;
  small: MastodonOriginal;
  focus: MastodonFocus;
}

interface MastodonFocus {
  x: number;
  y: number;
}

interface MastodonOriginal {
  width: number;
  height: number;
  size: string;
  aspect: number;
}

export interface MastodonInstance {
  uri: string;
  title: string;
  short_description: string;
  description: string;
  email: string;
  version: string;
  urls: Urls;
  stats: Stats;
  thumbnail: string;
  languages: string[];
  registrations: boolean;
  approval_required: boolean;
  invites_enabled: boolean;
  configuration: Configuration;
  contact_account: MastodonAccount;
  rules: {
    id: string;
    text: string;
  }[];
}

interface Configuration {
  accounts: Accounts;
  statuses: Statuses;
  media_attachments: Mediaattachments;
  polls: Polls;
}

interface Polls {
  max_options: number;
  max_characters_per_option: number;
  min_expiration: number;
  max_expiration: number;
}

interface Mediaattachments {
  supported_mime_types: string[];
  image_size_limit: number;
  image_matrix_limit: number;
  video_size_limit: number;
  video_frame_rate_limit: number;
  video_matrix_limit: number;
}

interface Statuses {
  max_characters: number;
  max_media_attachments: number;
  characters_reserved_per_url: number;
}

interface Accounts {
  max_featured_tags: number;
}

interface Stats {
  user_count: number;
  status_count: number;
  domain_count: number;
}

interface Urls {
  streaming_api: string;
}

export interface MastodonAppRegistration {
  id: string;
  name: string;
  website?: string;
  redirect_uri: string;
  client_id: string;
  client_secret: string;
  vapid_key: string;
}

export interface MastodonAccessToken {
  access_token: string;
  token_type: string;
  scope: string;
  created_at: number;
}

export type MastodonAuthenticatedAccount = MastodonAccount & {
  id: string;
  username: string;
  acct: string;
  display_name: string;
  note: string;
  source: MastodonSource;
  role: MastodonRole;
};

interface MastodonRole {
  id: string;
  name: string;
  permissions: string;
  color: string;
  highlighted: boolean;
}

interface MastodonSource {
  privacy: string;
  sensitive: boolean;
  language: string;
  note: string;
  fields: MastodonAccountField[];
  follow_requests_count: number;
}

export interface MastodonNotification {
  id: string;
  type: "follow" | "follow_request" | "favourite" | "reblog" | "mention" | "poll" | "status";
  created_at: string;
  account: MastodonAccount;
  status?: MastodonStatus;
}

export interface MastodonRelationship {
  id: string;
  following: boolean;
  showing_reblogs: boolean;
  notifying: boolean;
  followed_by: boolean;
  blocking: boolean;
  blocked_by: boolean;
  muting: boolean;
  muting_notifications: boolean;
  requested: boolean;
  domain_blocking: boolean;
  endorsed: boolean;
}
