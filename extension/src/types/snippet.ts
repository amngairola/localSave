export const CATEGORIES = ["General", "Code", "Work", "Personal", "Custom"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Snippet {
  id: string;
  title: string;
  content: string;
  category: Category;
  createdAt: number;
  updatedAt: number;
}

export type SnippetInput = Pick<Snippet, "title" | "content" | "category">;

export interface StorageUsage {
  bytes: number;
  quota: number;
  percent: number;
}

export const TITLE_MAX = 100;
