export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  birthdate?: string;
  authProvider?: 'google' | 'email' | 'guest';
  isPremium: boolean;
  subscriptionTier?: 'free' | 'premium_monthly' | 'premium_yearly';
  subscriptionEndsAt?: string;
  customerId?: string;
  dailyQuotaUsed?: number;
  lastQuotaResetDate?: string;
  focusScore: number;
  streakCount: number;
  weeklyMinutes: number;
  totalArticlesRead: number;
  totalListenedMinutes: number;
  createdAt?: string;
}

export type SourceType = 'youtube' | 'web' | 'rss' | 'ocr' | 'pdf' | 'text' | 'twitter';

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  sourceUrl?: string;
  sourceType: SourceType;
  durationSeconds: number;
  imageUrl?: string;
  createdAt: string;
  author?: string;
  keyPoints?: string[];
  rawHtml?: string;
  transcriptWords?: { word: string; start: number; duration: number }[];
  englishTitle?: string;
  englishSummary?: string;
  englishContent?: string;
  englishKeyPoints?: string[];
}

export interface YouTubeVideoItem {
  id: string;
  title: string;
  videoId: string;
  publishedAt?: string;
  thumbnail?: string;
}

export interface ChannelSource {
  id: string;
  title: string;
  type: 'rss' | 'youtube' | 'newsletter';
  unreadCount: number;
  enabled: boolean;
  notificationsEnabled?: boolean;
  thumbnail?: string;
  description?: string;
  url?: string;
  recentVideos?: YouTubeVideoItem[];
}

export interface UserHistoryItem {
  id?: string;
  userId: string;
  articleId: string;
  listenedSeconds: number;
  completed: boolean;
  updatedAt: string;
}

export interface BookmarkItem {
  id?: string;
  userId: string;
  articleId: string;
  savedAt: string;
}

export type TabType = 'read' | 'focus' | 'library' | 'profile';

export interface PlaybackState {
  isPlaying: boolean;
  currentArticle: Article | null;
  currentTime: number;
  duration: number;
  rate: number;
  volume?: number;
}

export interface AmbientChannel {
  id: string;
  name: string;
  volume: number; // 0.0 to 1.0
  active: boolean;
  isCustomUrl?: boolean;
  customUrl?: string;
}
