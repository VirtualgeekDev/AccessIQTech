import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  readTime: string;
  image: string;
  published: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

interface BlogContextType {
  articles: BlogArticle[];
  categories: string[];
  addArticle: (article: Omit<BlogArticle, 'id' | 'slug' | 'readTime'>) => void;
  updateArticle: (id: string, article: Partial<BlogArticle>) => void;
  deleteArticle: (id: string) => void;
  getArticleBySlug: (slug: string) => BlogArticle | undefined;
  getPublishedArticles: () => BlogArticle[];
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};

const defaultArticles: BlogArticle[] = [
  {
    id: '1',
    title: 'The Complete Guide to WCAG 2.1 AA Compliance',
    slug: 'complete-guide-wcag-2-1-aa-compliance',
    excerpt: 'Everything you need to know about meeting WCAG 2.1 AA standards for your website.',
    content: `
      <h2>Introduction to WCAG 2.1</h2>
      <p>The Web Content Accessibility Guidelines (WCAG) 2.1 are the international standard for web accessibility. These guidelines ensure that websites are accessible to people with disabilities, including those who use screen readers, have motor impairments, or experience other accessibility challenges.</p>
      
      <h2>The Four Principles of WCAG</h2>
      <p>WCAG 2.1 is organized around four main principles:</p>
      <ul>
        <li><strong>Perceivable:</strong> Information must be presentable in ways users can perceive</li>
        <li><strong>Operable:</strong> Interface components must be operable by all users</li>
        <li><strong>Understandable:</strong> Information and UI operation must be understandable</li>
        <li><strong>Robust:</strong> Content must be robust enough for various assistive technologies</li>
      </ul>
      
      <h2>AA Level Requirements</h2>
      <p>WCAG 2.1 AA is the standard most organizations aim for, as it provides a good balance between accessibility and implementation feasibility. Key requirements include:</p>
      <ul>
        <li>Color contrast ratio of at least 4.5:1 for normal text</li>
        <li>All functionality available via keyboard</li>
        <li>Proper heading structure and landmarks</li>
        <li>Alternative text for images</li>
        <li>Captions for videos</li>
      </ul>
      
      <h2>Implementation Strategy</h2>
      <p>To achieve WCAG 2.1 AA compliance:</p>
      <ol>
        <li>Conduct an accessibility audit of your current site</li>
        <li>Prioritize issues based on impact and effort</li>
        <li>Implement fixes systematically</li>
        <li>Test with real users and assistive technologies</li>
        <li>Maintain compliance through ongoing monitoring</li>
      </ol>
      
      <h2>Tools and Resources</h2>
      <p>Several tools can help you achieve and maintain WCAG compliance:</p>
      <ul>
        <li>Automated testing tools like AccessIQ Tech</li>
        <li>Manual testing with screen readers</li>
        <li>Color contrast analyzers</li>
        <li>Keyboard navigation testing</li>
      </ul>
      
      <p>Remember, accessibility is not a one-time task but an ongoing commitment to inclusive design.</p>
    `,
    author: 'Sarah Chen',
    date: '2025-01-10',
    category: 'Compliance',
    tags: ['WCAG', 'Compliance', 'Guidelines'],
    readTime: '8 min read',
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    published: true,
    seoTitle: 'WCAG 2.1 AA Compliance Guide - Complete Implementation Strategy',
    seoDescription: 'Learn how to achieve WCAG 2.1 AA compliance with our comprehensive guide. Includes implementation strategies, tools, and best practices.',
    seoKeywords: ['WCAG 2.1', 'accessibility compliance', 'web accessibility', 'AA standards']
  },
  {
    id: '2',
    title: 'How AI is Revolutionizing Web Accessibility Testing',
    slug: 'ai-revolutionizing-web-accessibility-testing',
    excerpt: 'Discover how artificial intelligence is making accessibility testing faster and more accurate.',
    content: `
      <h2>The Evolution of Accessibility Testing</h2>
      <p>Traditional accessibility testing has long been a manual, time-consuming process. Developers and accessibility experts would need to manually check each page, test with screen readers, and verify compliance with WCAG guidelines. This approach, while thorough, was often too slow and expensive for many organizations.</p>
      
      <h2>Enter Artificial Intelligence</h2>
      <p>AI is transforming accessibility testing by automating many of the manual processes that previously required human intervention. Machine learning algorithms can now:</p>
      <ul>
        <li>Analyze images and generate appropriate alt text</li>
        <li>Detect color contrast issues across entire websites</li>
        <li>Identify heading structure problems</li>
        <li>Suggest fixes for common accessibility barriers</li>
      </ul>
      
      <h2>Benefits of AI-Powered Testing</h2>
      <h3>Speed and Scale</h3>
      <p>AI can scan thousands of pages in minutes, identifying issues that would take human testers days or weeks to find manually.</p>
      
      <h3>Consistency</h3>
      <p>Unlike human testers, AI doesn't get tired or miss obvious issues. It applies the same rigorous standards to every element it analyzes.</p>
      
      <h3>Continuous Monitoring</h3>
      <p>AI systems can continuously monitor websites for new accessibility issues as content is added or updated.</p>
      
      <h2>Real-World Applications</h2>
      <p>Companies using AI-powered accessibility testing report:</p>
      <ul>
        <li>90% reduction in testing time</li>
        <li>Improved accuracy in issue detection</li>
        <li>Better compliance scores</li>
        <li>Reduced legal risk</li>
      </ul>
      
      <h2>The Future of Accessibility</h2>
      <p>As AI continues to evolve, we can expect even more sophisticated accessibility testing capabilities, including:</p>
      <ul>
        <li>Natural language processing for better content analysis</li>
        <li>Predictive accessibility scoring</li>
        <li>Automated fix implementation</li>
        <li>Integration with design tools</li>
      </ul>
      
      <p>The future of web accessibility is bright, with AI leading the charge toward a more inclusive internet.</p>
    `,
    author: 'Marcus Rodriguez',
    date: '2025-01-08',
    category: 'Technology',
    tags: ['AI', 'Testing', 'Innovation'],
    readTime: '6 min read',
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=600&h=300&fit=crop',
    published: true,
    seoTitle: 'AI in Web Accessibility Testing - Revolutionary Technology Guide',
    seoDescription: 'Explore how AI is transforming web accessibility testing with automated scanning, intelligent fixes, and continuous monitoring.',
    seoKeywords: ['AI accessibility testing', 'automated accessibility', 'machine learning', 'web accessibility']
  }
];

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Helper function to calculate read time
const calculateReadTime = (content: string): string => {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
};

// Helper function to generate SEO data
const generateSEOData = (article: Partial<BlogArticle>) => {
  const seoTitle = article.seoTitle || `${article.title} | AccessIQ Tech Blog`;
  const seoDescription = article.seoDescription || article.excerpt?.substring(0, 160);
  const seoKeywords = article.seoKeywords || article.tags;
  
  return { seoTitle, seoDescription, seoKeywords };
};

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<BlogArticle[]>(defaultArticles);
  const [categories] = useState<string[]>([
    'Compliance',
    'Technology', 
    'Best Practices',
    'Design',
    'Business',
    'Development'
  ]);

  useEffect(() => {
    const storedArticles = localStorage.getItem('accessiq_blog_articles');
    if (storedArticles) {
      setArticles(JSON.parse(storedArticles));
    }
  }, []);

  const saveArticles = (newArticles: BlogArticle[]) => {
    setArticles(newArticles);
    localStorage.setItem('accessiq_blog_articles', JSON.stringify(newArticles));
  };

  const addArticle = (articleData: Omit<BlogArticle, 'id' | 'slug' | 'readTime'>) => {
    const id = Date.now().toString();
    const slug = generateSlug(articleData.title);
    const readTime = calculateReadTime(articleData.content);
    const seoData = generateSEOData(articleData);
    
    const newArticle: BlogArticle = {
      ...articleData,
      ...seoData,
      id,
      slug,
      readTime,
      date: new Date().toISOString().split('T')[0]
    };
    
    const newArticles = [newArticle, ...articles];
    saveArticles(newArticles);
  };

  const updateArticle = (id: string, updates: Partial<BlogArticle>) => {
    const newArticles = articles.map(article => {
      if (article.id === id) {
        const updatedArticle = { ...article, ...updates };
        
        // Regenerate slug if title changed
        if (updates.title && updates.title !== article.title) {
          updatedArticle.slug = generateSlug(updates.title);
        }
        
        // Recalculate read time if content changed
        if (updates.content && updates.content !== article.content) {
          updatedArticle.readTime = calculateReadTime(updates.content);
        }
        
        // Update SEO data
        const seoData = generateSEOData(updatedArticle);
        Object.assign(updatedArticle, seoData);
        
        updatedArticle.updatedAt = new Date().toISOString().split('T')[0];
        
        return updatedArticle;
      }
      return article;
    });
    
    saveArticles(newArticles);
  };

  const deleteArticle = (id: string) => {
    const newArticles = articles.filter(article => article.id !== id);
    saveArticles(newArticles);
  };

  const getArticleBySlug = (slug: string) => {
    return articles.find(article => article.slug === slug);
  };

  const getPublishedArticles = () => {
    return articles.filter(article => article.published);
  };

  return (
    <BlogContext.Provider value={{
      articles,
      categories,
      addArticle,
      updateArticle,
      deleteArticle,
      getArticleBySlug,
      getPublishedArticles
    }}>
      {children}
    </BlogContext.Provider>
  );
};