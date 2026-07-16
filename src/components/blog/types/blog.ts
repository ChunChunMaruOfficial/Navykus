export type BlogCategory =
  | 'news'
  | 'championships'
  | 'activities'
  | 'opportunities'
  | 'stories'
  | 'interviews'
  | 'tips'
  | 'education'
  | 'projects';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover: string;
  category: BlogCategory;
  author: string;
  publishedAt: string;
  readingTime: number;
  featured: boolean;
  tags: string[];
}

export type BlogCategoryFilter = BlogCategory | 'all';
