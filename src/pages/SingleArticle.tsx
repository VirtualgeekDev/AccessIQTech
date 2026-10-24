import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Share2, Clock, Tag } from 'lucide-react';
import { useBlog } from '../contexts/BlogContext';

const SingleArticle: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { articles, getArticleBySlug } = useBlog();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const foundArticle = getArticleBySlug(slug);
      setArticle(foundArticle);
      setLoading(false);
      
      // SEO optimization - update page title and meta
      if (foundArticle) {
        document.title = `${foundArticle.title} | AccessIQ Tech Blog`;
        
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', foundArticle.excerpt);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'description';
          meta.content = foundArticle.excerpt;
          document.head.appendChild(meta);
        }
        
        // Add structured data for SEO
        const structuredData = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": foundArticle.title,
          "description": foundArticle.excerpt,
          "image": foundArticle.image,
          "author": {
            "@type": "Person",
            "name": foundArticle.author
          },
          "publisher": {
            "@type": "Organization",
            "name": "AccessIQ Tech",
            "logo": {
              "@type": "ImageObject",
              "url": "https://accessiqtech.net/logo.png"
            }
          },
          "datePublished": foundArticle.date,
          "dateModified": foundArticle.updatedAt || foundArticle.date,
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://accessiqtech.net/blog/${foundArticle.slug}`
          }
        };
        
        // Remove existing structured data
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
          existingScript.remove();
        }
        
        // Add new structured data
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
      }
    }
  }, [slug, getArticleBySlug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = () => {
    if (navigator.share && article) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert('Article URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-8">The article you're looking for doesn't exist.</p>
          <Link
            to="/blog"
            className="bg-brand-accent text-brand-dark px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/blog"
          className="inline-flex items-center space-x-2 text-brand-accent hover:text-yellow-600 mb-8 font-medium"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Blog</span>
        </Link>

        {/* Article Header */}
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="bg-brand-accent text-brand-dark px-3 py-1 rounded-full text-sm font-medium">
                {article.category}
              </span>
            </div>
          </div>

          <div className="p-8">
            {/* Article Meta */}
            <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(article.date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{article.readTime}</span>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 text-brand-accent hover:text-yellow-600"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>

            {/* Article Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              {article.title}
            </h1>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            </div>

            {/* Article Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      <Tag className="h-3 w-3" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Related Articles */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
          <p className="text-gray-600">Related articles feature coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default SingleArticle;