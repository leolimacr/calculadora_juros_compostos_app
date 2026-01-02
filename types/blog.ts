
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML ou Markdown
  author: string;
  date: string;
  readTime: string; // "5 min"
  category: 'investimentos' | 'planejamento' | 'psicologia' | 'cripto';
  imageUrl?: string;
  keywords: string[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'resolved';
  createdAt: number;
}
