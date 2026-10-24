import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Film, 
  PlayCircle, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  ShieldCheck, 
  Headphones, 
  Clock, 
  CreditCard, 
  Layers, 
  Globe, 
  Sparkles, 
  Star, 
  ArrowRight, 
  Lock, 
  Wifi, 
  HelpCircle,
  ExternalLink,
  Flame,
  Radio,
  Menu,
  X,
  MessageSquare,
  Loader2,
  User,
  Mail
} from 'lucide-react';

// ============================================================================
// CENTRALIZED SUBSCRIPTION PLANS & STRIPE PAYMENT URL CONFIGURATION
// ============================================================================
type ScreenCount = 1 | 2 | 3;

interface PlanScreenOption {
  url: string;
  price: string;
  priceMonthlyEquivalent?: string;
}

interface PlanConfig {
  id: string;
  name: string;
  durationLabel: string;
  bonusBadge?: string;
  badge?: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  features: string[];
  screens: Record<ScreenCount, PlanScreenOption>;
}

const WHATSAPP_NUMBER = '447877382559';
const TELEGRAM_BOT_TOKEN = '8819844031:AAHgOAd7SJpG83_TNgcl5wofMaXyZ68QoTo';
const TELEGRAM_CHAT_ID = '-5388671844';

const SUBSCRIPTION_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
  <defs>
    <linearGradient id="favPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F7CD55" />
      <stop offset="100%" stop-color="#E8A23A" />
    </linearGradient>
  </defs>
  <path fill="url(#favPrimary)" d="M11.923 0C5.937 0 .976 4.384.07 10.115a11.943 11.943 0 0 1 7.645-2.754 11.982 11.982 0 0 1 9.43 4.58 11.942 11.942 0 0 0 1.015-8.769 12.066 12.066 0 0 0-.626-1.772l-.003-.008A11.968 11.968 0 0 0 11.923 0Zm7.721 2.754A12.002 12.002 0 0 1 9.398 16.521a12.082 12.082 0 0 0 9.02 5.617c.24-.119.766-.51 1.224-.89A11.971 11.971 0 0 0 23.995 12a11.98 11.98 0 0 0-4.35-9.247zM9.33 7.557a12.159 12.159 0 0 0-2.647.401A11.944 11.944 0 0 0 .01 12.595l-.005.006c.021.427.065.853.131 1.275C1.037 19.61 6 24 11.991 24c1.45 0 2.887-.26 4.243-.773a12 12 0 0 1-6.905-15.67z"/>
</svg>`;

const SUBSCRIPTION_FAVICON_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(SUBSCRIPTION_FAVICON_SVG)}`;

const BrandLogoIcon: React.FC<{ className?: string; gradientId?: string }> = ({
  className = 'w-6 h-6',
  gradientId = 'favPrimary'
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" className={className}>
    <defs>
      <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F7CD55" />
        <stop offset="100%" stopColor="#E8A23A" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#${gradientId})`}
      d="M11.923 0C5.937 0 .976 4.384.07 10.115a11.943 11.943 0 0 1 7.645-2.754 11.982 11.982 0 0 1 9.43 4.58 11.942 11.942 0 0 0 1.015-8.769 12.066 12.066 0 0 0-.626-1.772l-.003-.008A11.968 11.968 0 0 0 11.923 0Zm7.721 2.754A12.002 12.002 0 0 1 9.398 16.521a12.082 12.082 0 0 0 9.02 5.617c.24-.119.766-.51 1.224-.89A11.971 11.971 0 0 0 23.995 12a11.98 11.98 0 0 0-4.35-9.247zM9.33 7.557a12.159 12.159 0 0 0-2.647.401A11.944 11.944 0 0 0 .01 12.595l-.005.006c.021.427.065.853.131 1.275C1.037 19.61 6 24 11.991 24c1.45 0 2.887-.26 4.243-.773a12 12 0 0 1-6.905-15.67z"
    />
  </svg>
);

const SUBSCRIPTION_PLANS: Record<string, PlanConfig> = {
  '12months': {
    id: '12months',
    name: '12 Months + 3 Free',
    durationLabel: '15 Months Total Access',
    bonusBadge: '+3 MONTHS FREE',
    badge: 'Recommended • Most Popular',
    isPopular: true,
    features: [
      '15 Full Months of Premium Streaming',
      'Access to Live TV & Live Sports',
      'Complete VOD Movies & Series Library',
      '4K / Ultra HD & 60FPS Streams',
      'Fast EPG Program Guide',
      'Instant Email & WhatsApp Delivery',
      '7-Day Money-Back Guarantee',
      'VIP 24/7 Dedicated Support'
    ],
    screens: {
      1: {
        price: '$51',
        priceMonthlyEquivalent: '$3.40 / mo',
        url: 'https://buy.stripe.com/28E3cw3uFgX7ga98c097G08'
      },
      2: {
        price: '$80',
        priceMonthlyEquivalent: '$5.33 / mo',
        url: 'https://buy.stripe.com/aFa3cw1mxeOZe212RG97G09'
      },
      3: {
        price: '$120',
        priceMonthlyEquivalent: '$8.00 / mo',
        url: 'https://buy.stripe.com/9B6eVe9T3cGR0bb3VK97G0a'
      }
    }
  },
  '24months': {
    id: '24months',
    name: '24 Months + 6 Free',
    durationLabel: '30 Months Total Access',
    bonusBadge: '+6 MONTHS FREE',
    badge: 'Ultimate Long-Term Savings',
    isBestValue: true,
    features: [
      '30 Full Months of Uninterrupted Access',
      'All Live TV, Sports & PPV Events',
      'Huge VOD Collection with Regular Updates',
      'Ultra HD 4K & High Bitrate Streams',
      'Comprehensive EPG Guide',
      'Instant Email & WhatsApp Delivery',
      '7-Day Money-Back Guarantee',
      'VIP 24/7 Priority Support'
    ],
    screens: {
      1: {
        price: '$80',
        priceMonthlyEquivalent: '$2.66 / mo',
        url: 'https://buy.stripe.com/aFa3cw1mxeOZe212RG97G09'
      },
      2: {
        price: '$120',
        priceMonthlyEquivalent: '$4.00 / mo',
        url: 'https://buy.stripe.com/9B6eVe9T3cGR0bb3VK97G0a'
      },
      3: {
        price: '$150',
        priceMonthlyEquivalent: '$5.00 / mo',
        url: 'https://buy.stripe.com/fZucN6fdn4al1ff1NC97G0b'
      }
    }
  },
  '3months': {
    id: '3months',
    name: '3 Months',
    durationLabel: 'Quarterly Access',
    badge: 'Quarterly Savings',
    features: [
      'Access to Live TV & Sports',
      'Extensive VOD Movies & Series',
      '4K / Ultra HD & HD Streams',
      'Electronic Program Guide (EPG)',
      'Instant Email & WhatsApp Delivery',
      '7-Day Money-Back Guarantee',
      '24/7 Priority Support'
    ],
    screens: {
      1: {
        price: '$21',
        priceMonthlyEquivalent: '$7.00 / mo',
        url: 'https://buy.stripe.com/7sY8wQ9T3fT31ff4ZO97G06'
      },
      2: {
        price: '$35',
        priceMonthlyEquivalent: '$11.66 / mo',
        url: 'https://buy.stripe.com/5kQcN60it9uF4rr4ZO97G07'
      },
      3: {
        price: '$51',
        priceMonthlyEquivalent: '$17.00 / mo',
        url: 'https://buy.stripe.com/28E3cw3uFgX7ga98c097G08'
      }
    }
  },
  '6months': {
    id: '6months',
    name: '6 Months',
    durationLabel: 'Half-Year Access',
    badge: 'Popular Choice',
    features: [
      'Access to Live TV & Sports',
      'Extensive VOD Movies & Series',
      '4K / Ultra HD & HD Streams',
      'Electronic Program Guide (EPG)',
      'Instant Email & WhatsApp Delivery',
      '7-Day Money-Back Guarantee',
      '24/7 Priority Support'
    ],
    screens: {
      1: {
        price: '$35',
        priceMonthlyEquivalent: '$5.83 / mo',
        url: 'https://buy.stripe.com/5kQcN60it9uF4rr4ZO97G07'
      },
      2: {
        price: '$51',
        priceMonthlyEquivalent: '$8.50 / mo',
        url: 'https://buy.stripe.com/28E3cw3uFgX7ga98c097G08'
      },
      3: {
        price: '$80',
        priceMonthlyEquivalent: '$13.33 / mo',
        url: 'https://buy.stripe.com/aFa3cw1mxeOZe212RG97G09'
      }
    }
  }
};

const FAQ_ITEMS = [
  {
    q: 'What is IPTV?',
    a: 'IPTV (Internet Protocol Television) delivers television programming and video entertainment through your broadband internet connection rather than traditional satellite dishes or cable lines. You simply connect your compatible device to the internet to stream live channels, sports, and video on demand.'
  },
  {
    q: 'How does IPTV work?',
    a: 'Once your order is processed, you receive a digital playlist URL (M3U) or Xtream Codes API credentials. You enter these credentials into a compatible IPTV player application on your Smart TV, streaming stick, phone, or computer to instantly access your channels and content.'
  },
  {
    q: 'How quickly will I receive my access?',
    a: 'Your subscription credentials, playlist links, and simple setup instructions are delivered digitally to your payment email address shortly after completing your secure order.'
  },
  {
    q: 'Which devices are supported?',
    a: 'Our service supports a wide array of devices including Samsung Smart TVs (Tizen), LG Smart TVs (webOS), Android TV, Amazon Firestick/Fire TV, Apple TV, iPhone/iPad, Android phones and tablets, Windows PC, Mac, and dedicated IPTV hardware such as MAG and Formuler boxes.'
  },
  {
    q: 'Can I use my subscription on multiple devices?',
    a: 'Yes! You can install your playlist on multiple devices. The number of devices that can stream at the exact same time depends on the screen option you choose: 1 Screen, 2 Screens, or 3 Screens.'
  },
  {
    q: 'What is the difference between 1, 2, and 3 screens?',
    a: 'The screen count defines how many devices can stream simultaneously from your household. A 1 Screen plan allows one live stream at a time. The 2 Screens and 3 Screens plans allow multiple family members to watch different live channels or movies on different screens simultaneously.'
  },
  {
    q: 'Do I need a special application?',
    a: 'You can use popular, widely available IPTV player apps such as IPTV Smarters Pro, TiviMate, IBO Player, XCIPTV, GSE Smart IPTV, or VLC Player. App availability and installation methods vary depending on your specific device operating system.'
  },
  {
    q: 'What internet speed is recommended?',
    a: 'For stable HD streaming, a minimum download speed of 15 Mbps is recommended. For 4K Ultra HD streams, we suggest an internet connection of 30 Mbps or higher with a stable Wi-Fi or Ethernet connection.'
  },
  {
    q: 'Do you offer a money-back guarantee?',
    a: 'Yes, every subscription is backed by our 7-Day Money-Back Guarantee. If you encounter technical difficulties that our support team cannot resolve, you can request a full refund within 7 days of purchase.'
  },
  {
    q: 'How can I contact customer support?',
    a: 'Our technical support team is available 24/7 via email at contact@accessiqtech.net to assist you with installation guides, playlist configuration, or any troubleshooting questions.'
  }
];

export const Subscription: React.FC = () => {
  const [selectedScreens, setSelectedScreens] = useState<ScreenCount>(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // SEO metadata, favicon & mobile horizontal scroll protection
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Premium IPTV Subscription | Live TV, Sports, Movies & Series';

    // Update or insert meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    const originalMetaDesc = metaDescription?.getAttribute('content') || '';
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Explore flexible IPTV subscription plans with live TV, sports, movies and series across compatible devices. Choose your plan and activate your access online.'
      );
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute(
        'content',
        'Explore flexible IPTV subscription plans with live TV, sports, movies and series across compatible devices. Choose your plan and activate your access online.'
      );
      document.head.appendChild(metaDescription);
    }

    // Update favicon for /subscription page
    let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    const originalFaviconHref = faviconLink?.getAttribute('href') || '';
    const originalFaviconType = faviconLink?.getAttribute('type') || '';
    if (faviconLink) {
      faviconLink.setAttribute('type', 'image/svg+xml');
      faviconLink.setAttribute('href', SUBSCRIPTION_FAVICON_DATA_URI);
    } else {
      faviconLink = document.createElement('link');
      faviconLink.setAttribute('rel', 'icon');
      faviconLink.setAttribute('type', 'image/svg+xml');
      faviconLink.setAttribute('href', SUBSCRIPTION_FAVICON_DATA_URI);
      document.head.appendChild(faviconLink);
    }

    // Prevent horizontal scroll on mobile html/body
    const originalHtmlOverflowX = document.documentElement.style.overflowX;
    const originalBodyOverflowX = document.body.style.overflowX;
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';

    // Scroll to top on mount
    window.scrollTo(0, 0);

    return () => {
      document.title = originalTitle;
      if (metaDescription && originalMetaDesc) {
        metaDescription.setAttribute('content', originalMetaDesc);
      }
      if (faviconLink && originalFaviconHref) {
        faviconLink.setAttribute('href', originalFaviconHref);
        if (originalFaviconType) {
          faviconLink.setAttribute('type', originalFaviconType);
        }
      }
      document.documentElement.style.overflowX = originalHtmlOverflowX;
      document.body.style.overflowX = originalBodyOverflowX;
    };
  }, []);

  // Order Confirmation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>('12months');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<false | 'stripe' | 'whatsapp'>(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(prev => (prev === index ? null : index));
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOrderClick = (planKey: string) => {
    setSelectedPlanKey(planKey);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleProceedWithOrder = async (actionType: 'stripe' | 'whatsapp') => {
    const trimmedName = customerName.trim();
    const trimmedEmail = customerEmail.trim();

    if (!trimmedName) {
      setFormError('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setFormError('');
    setIsSubmitting(actionType);

    const plan = SUBSCRIPTION_PLANS[selectedPlanKey];
    const planOption = plan?.screens[selectedScreens];
    const price = planOption ? planOption.price : 'N/A';
    const actionLabel = actionType === 'stripe' ? 'Continue to Checkout (Stripe)' : 'Confirm via WhatsApp';
    const pageUrl = window.location.href;

    const payload = {
      name: trimmedName,
      email: trimmedEmail,
      plan: plan ? plan.name : selectedPlanKey,
      screens: `${selectedScreens} Screen(s)`,
      price: price,
      action: actionLabel,
      pageUrl: pageUrl
    };

    // 1. Dispatch notification to backend endpoint
    let dispatched = false;
    try {
      const resp = await fetch('/api/order_notification.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        dispatched = true;
      }
    } catch (e) {
      console.warn('Backend notification error, trying direct Telegram fallback...', e);
    }

    // 2. Direct Telegram fallback if backend was unavailable
    if (!dispatched) {
      try {
        const text = `🚨 *NEW IPTV ORDER NOTIFICATION* 🚨\n\n` +
          `👤 *Customer Name:* ${payload.name}\n` +
          `📧 *Customer Email:* ${payload.email}\n` +
          `📺 *Plan:* ${payload.plan}\n` +
          `🖥️ *Screens:* ${payload.screens}\n` +
          `💰 *Price:* ${payload.price}\n` +
          `⚡ *Action:* ${payload.action}\n` +
          `🌐 *Page Link:* ${payload.pageUrl}\n` +
          `📅 *Date:* ${new Date().toLocaleString()}`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: text,
            parse_mode: 'Markdown'
          })
        });
      } catch (err) {
        console.error('Direct Telegram notification failed:', err);
      }
    }

    setIsSubmitting(false);
    setIsModalOpen(false);

    if (actionType === 'stripe') {
      if (planOption?.url) {
        window.open(planOption.url, '_blank', 'noopener,noreferrer');
      }
    } else {
      const whatsappMsg = `Hello! I would like to confirm my IPTV subscription order.\n\n` +
        `• Name: ${trimmedName}\n` +
        `• Email: ${trimmedEmail}\n` +
        `• Plan: ${plan?.name}\n` +
        `• Screens: ${selectedScreens} Screen(s)\n` +
        `• Price: ${price}\n\n` +
        `Please send me payment instructions and activation credentials.`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMsg)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="bg-[#070b12] text-slate-100 min-h-screen w-full max-w-full overflow-x-hidden font-sans selection:bg-amber-400 selection:text-black"
      style={{ backgroundColor: '#070b12', color: '#f1f5f9', overflowX: 'hidden' }}
    >
      {/* ==================================================================== */}
      {/* 1. STANDALONE TOP NAVIGATION                                         */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-50 bg-[#070b12]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
          <div
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer min-w-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-amber-400/30 p-1.5 sm:p-2 flex items-center justify-center shadow-lg shadow-amber-500/15 flex-shrink-0">
              <BrandLogoIcon className="w-full h-full" gradientId="favHeaderLogo" />
            </div>
            <div className="min-w-0">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                StreamPass <span className="text-amber-400 text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 flex-shrink-0">IPTV</span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">USA • UK • Global Entertainment</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <button onClick={() => scrollToSection('usa-uk')} className="hover:text-amber-400 transition-colors">USA & UK Content</button>
            <button onClick={() => scrollToSection('benefits')} className="hover:text-amber-400 transition-colors">Service Benefits</button>
            <button onClick={() => scrollToSection('sports')} className="hover:text-amber-400 transition-colors">Live Sports</button>
            <button onClick={() => scrollToSection('devices')} className="hover:text-amber-400 transition-colors">Devices</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-amber-400 transition-colors">Subscription Plans</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-amber-400 transition-colors">FAQ</button>
          </nav>

          {/* Header Action Button */}
          <div className="hidden sm:flex items-center space-x-4 flex-shrink-0">
            <button 
              onClick={() => scrollToSection('pricing')}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold text-sm px-5 py-2.5 rounded-lg shadow-md shadow-amber-500/20 transition-all duration-200 active:scale-95"
            >
              Order Now
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-white p-2 -mr-1"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0c121d] border-b border-slate-800 px-4 py-4 space-y-2.5">
            <button onClick={() => scrollToSection('usa-uk')} className="block w-full text-left py-2 text-sm text-slate-200 font-medium hover:text-amber-400">USA & UK Content</button>
            <button onClick={() => scrollToSection('benefits')} className="block w-full text-left py-2 text-sm text-slate-200 font-medium hover:text-amber-400">Service Benefits</button>
            <button onClick={() => scrollToSection('sports')} className="block w-full text-left py-2 text-sm text-slate-200 font-medium hover:text-amber-400">Live Sports</button>
            <button onClick={() => scrollToSection('devices')} className="block w-full text-left py-2 text-sm text-slate-200 font-medium hover:text-amber-400">Compatible Devices</button>
            <button onClick={() => scrollToSection('pricing')} className="block w-full text-left py-2 text-sm text-slate-200 font-medium hover:text-amber-400">Subscription Plans</button>
            <button onClick={() => scrollToSection('faq')} className="block w-full text-left py-2 text-sm text-slate-200 font-medium hover:text-amber-400">FAQ</button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="w-full text-center bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm py-2.5 rounded-lg mt-2 shadow"
            >
              Choose a Plan
            </button>
          </div>
        )}
      </header>

      {/* ==================================================================== */}
      {/* 2. HERO SECTION                                                      */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-28">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-blue-600/10 to-indigo-600/15 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -top-32 right-0 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Subtle Country & Quality Badges */}
            <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] sm:text-sm font-medium text-slate-200 mb-5 sm:mb-6 shadow-inner max-w-full">
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                🇺🇸 USA & 🇬🇧 UK
              </span>
              <span className="text-slate-500">•</span>
              <span>Live TV & Sports Streaming</span>
              <span className="text-slate-500 hidden xs:inline sm:inline">•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" /> Instant Activation
              </span>
            </div>

            {/* Main H1 */}
            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.2] sm:leading-[1.15] mb-4 sm:mb-6">
              Premium IPTV Streaming for{' '}
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
                USA & UK Viewers
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-lg lg:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto mb-6 sm:mb-8">
              Access live television channels, non-stop premier sports, blockbuster movies, and complete series directly through your high-speed internet connection on any compatible device.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
              <button
                onClick={() => scrollToSection('pricing')}
                className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              >
                <span>View Plans & Order Now</span>
                <ArrowRight className="w-5 h-5 flex-shrink-0" />
              </button>
              <button
                onClick={() => scrollToSection('devices')}
                className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-sm sm:text-base transition-colors"
              >
                Check Device Compatibility
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto pt-4 border-t border-slate-800/80 text-left">
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-900/50 border border-slate-800 min-w-0">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
                <span className="text-[11px] sm:text-sm font-medium text-slate-200 leading-tight">Instant Digital Delivery</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-900/50 border border-slate-800 min-w-0">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] sm:text-sm font-medium text-slate-200 leading-tight">7-Day Money-Back Guarantee</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-900/50 border border-slate-800 min-w-0">
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                <span className="text-[11px] sm:text-sm font-medium text-slate-200 leading-tight">24/7 Dedicated Support</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-900/50 border border-slate-800 min-w-0">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                <span className="text-[11px] sm:text-sm font-medium text-slate-200 leading-tight">Multi-Device Support</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup: Premium Modern Living Room TV */}
          <div className="mt-8 sm:mt-12 lg:mt-16 max-w-5xl mx-auto">
            <div className="relative rounded-2xl sm:rounded-3xl p-1.5 sm:p-3 bg-gradient-to-b from-slate-700/50 via-slate-800/30 to-slate-900/80 shadow-2xl border border-slate-700/60 overflow-hidden">
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden min-h-[230px] sm:min-h-0 aspect-[4/3] sm:aspect-[16/9] bg-slate-950">
                {/* High quality cinematic streaming visual */}
                <img 
                  src="https://images.pexels.com/photos/4009402/pexels-photo-4009402.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                  alt="Modern 4K Smart TV in living room displaying streaming interface"
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                />
                
                {/* Dark Gradient Overlay for cinematic feel */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 sm:via-slate-950/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/40" />

                {/* Overlaid UI Elements representing streaming content */}
                <div className="absolute bottom-3 sm:bottom-8 left-3 sm:left-8 right-3 sm:right-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2 max-w-lg">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-red-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse" /> LIVE
                      </span>
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-slate-900/80 border border-slate-700 text-white text-[10px] sm:text-xs font-semibold">
                        4K UHD • 60 FPS
                      </span>
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] sm:text-xs font-semibold">
                        🇺🇸 USA + 🇬🇧 UK
                      </span>
                    </div>
                    <h3 className="text-base sm:text-2xl lg:text-3xl font-bold text-white leading-snug drop-shadow-md">
                      Live Sports, International News & VOD Cinema
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 drop-shadow">
                      Watch championship matches, breaking live news, and trending series on your Smart TV, Firestick, phone, or tablet.
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                    <button 
                      onClick={() => scrollToSection('pricing')}
                      className="px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs sm:text-sm shadow-md transition-colors"
                    >
                      Start Streaming
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. USA + UK CONTENT SECTION                                          */}
      {/* ==================================================================== */}
      <section id="usa-uk" className="py-12 sm:py-16 lg:py-24 bg-[#0a0f18] border-t border-b border-slate-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
              Geographic Programming
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Your Favorite USA & UK Entertainment in One Place
            </h2>
            <p className="text-slate-300 text-sm sm:text-lg">
              Designed specifically for American and British television enthusiasts, featuring premier sports, national news, kids channels, and movies.
            </p>
          </div>

          {/* Dual USA & UK Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 mb-8 sm:mb-12">
            {/* USA Card */}
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-slate-700/80 p-4 sm:p-8 overflow-hidden hover:border-slate-600 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="text-2xl sm:text-3xl">🇺🇸</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">United States</h3>
                    <p className="text-xs text-slate-400">American Television & Major Leagues</p>
                  </div>
                </div>
                <span className="px-2.5 sm:px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] sm:text-xs font-semibold">
                  East & West Coast
                </span>
              </div>

              {/* USA Visual Image */}
              <div className="rounded-xl overflow-hidden aspect-[16/9] mb-4 sm:mb-6 relative">
                <img 
                  src="https://images.pexels.com/photos/2570139/pexels-photo-2570139.jpeg?auto=compress&cs=tinysrgb&w=800" 
                  alt="American football and sports stadium lighting"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-2.5 sm:bottom-3 left-3 sm:left-4 right-3 sm:right-4 flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-xs text-white">
                  <span className="font-semibold">Football • Basketball • Baseball • News</span>
                  <span className="bg-black/60 px-2 py-0.5 rounded text-amber-300 font-mono flex-shrink-0">HD / 4K</span>
                </div>
              </div>

              {/* USA Content highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>American Football & NFL</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Basketball & NBA Action</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>National US News Networks</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Hollywood Blockbusters</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Prime Entertainment & Series</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Family & Kids Channels</span>
                </div>
              </div>
            </div>

            {/* UK Card */}
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-slate-700/80 p-4 sm:p-8 overflow-hidden hover:border-slate-600 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="text-2xl sm:text-3xl">🇬🇧</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">United Kingdom</h3>
                    <p className="text-xs text-slate-400">British Television & European Football</p>
                  </div>
                </div>
                <span className="px-2.5 sm:px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] sm:text-xs font-semibold">
                  UK & Ireland
                </span>
              </div>

              {/* UK Visual Image */}
              <div className="rounded-xl overflow-hidden aspect-[16/9] mb-4 sm:mb-6 relative">
                <img 
                  src="https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=800" 
                  alt="British football soccer stadium atmosphere"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-2.5 sm:bottom-3 left-3 sm:left-4 right-3 sm:right-4 flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-xs text-white">
                  <span className="font-semibold">Premier Football • UK News • British Drama</span>
                  <span className="bg-black/60 px-2 py-0.5 rounded text-amber-300 font-mono flex-shrink-0">HD / 4K</span>
                </div>
              </div>

              {/* UK Content highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Premier League Football</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Cricket, Rugby & Tennis</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>British Public & News TV</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>UK Cinema & Documentaries</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>BBC & ITV Style Entertainment</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Scottish & Irish Coverage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Channel Categories Horizontal Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-sm font-semibold text-amber-400 mb-1 flex items-center justify-center gap-1.5">
                <span>🇺🇸 USA Categories</span>
              </div>
              <p className="text-xs text-slate-300">Sports • News • Entertainment • Movies • Kids • Science</p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-sm font-semibold text-amber-400 mb-1 flex items-center justify-center gap-1.5">
                <span>🇬🇧 UK Categories</span>
              </div>
              <p className="text-xs text-slate-300">Sports • News • British Drama • Movies • Documentaries • Music</p>
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-sm font-semibold text-amber-400 mb-1 flex items-center justify-center gap-1.5">
                <span>🌍 International Hub</span>
              </div>
              <p className="text-xs text-slate-300">Canada • Europe • Australia • Worldwide International Feeds</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. SERVICE BENEFITS                                                  */}
      {/* ==================================================================== */}
      <section id="benefits" className="py-12 sm:py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
              Why Choose Our Service
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Engineered for Seamless Entertainment
            </h2>
            <p className="text-slate-300 text-sm sm:text-lg">
              Enjoy high-definition streams and comprehensive channels tailored for modern home theater setups and mobile streaming.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Benefit 1 */}
            <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                <Tv className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Live International TV</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Access a vast selection of live television channels from the USA, UK, Canada, and around the globe with real-time EPG program schedules.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Live Sports & Events</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Watch football leagues, basketball, baseball, combat sports, tennis tournaments, and racing events without missing a single highlight.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Movies & Series VOD</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Extensive Video-on-Demand library featuring Hollywood blockbusters, trending TV dramas, documentaries, and full seasons in multi-language audio.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">HD / 4K Streaming</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Enjoy 1080p Full HD and Ultra HD 4K resolution options where supported by your screen hardware and broadband internet bandwidth.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Multi-Device Support</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Watch seamlessly on Samsung, LG, Android TV, Firestick, Apple TV, iPhone, Android smartphones, tablets, Windows PC, and macOS.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="p-5 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Instant Digital Activation</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Receive your playlist link, M3U credentials, and easy setup instructions automatically via email right after completing your secure order.
              </p>
            </div>
          </div>

          {/* Technical Quality Disclaimer */}
          <div className="mt-6 sm:mt-8 p-3.5 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center max-w-3xl mx-auto">
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Streaming Notice:</span> Streaming performance and picture resolution depend upon your local internet speed, Wi-Fi or Ethernet stability, device processing capability, and local network conditions.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. CINEMATIC SPORTS VISUAL SECTION                                   */}
      {/* ==================================================================== */}
      <section id="sports" className="py-10 sm:py-16 bg-[#0a0f18] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-700/60 bg-slate-900">
            {/* Cinematic sports visual */}
            <div className="relative sm:aspect-[21/8] min-h-[300px] sm:min-h-[320px] flex items-center">
              <img 
                src="https://images.pexels.com/photos/269948/pexels-photo-269948.jpeg?auto=compress&cs=tinysrgb&w=1400" 
                alt="Major live sports soccer football stadium floodlights"
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 sm:via-slate-950/70 to-slate-950/30 sm:to-transparent" />
              
              <div className="relative z-10 p-5 sm:p-10 lg:p-14 flex flex-col justify-center max-w-2xl">
                <span className="inline-block px-2.5 sm:px-3 py-1 rounded bg-amber-400 text-black text-[10px] sm:text-xs font-bold uppercase tracking-wider w-fit max-w-full mb-3">
                  Live Sports • USA • UK • International
                </span>
                <h2 className="text-xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-3 sm:mb-4">
                  Never Miss a Championship Match or Game Day
                </h2>
                <p className="text-xs sm:text-base text-slate-200 mb-5 sm:mb-6">
                  Follow the Premier League, NFL, NBA, European football, golf majors, Formula 1, tennis, and combat sports with high-frame-rate streams.
                </p>
                <div>
                  <button 
                    onClick={() => scrollToSection('pricing')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm shadow-md transition-colors"
                  >
                    Get Sports Access Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. PROMOTIONAL BANNER: GET MORE MONTHS — PAY LESS                    */}
      {/* ==================================================================== */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-blue-500/10 border-t border-b border-amber-500/20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Flame className="w-4 h-4 text-amber-400" /> Limited Extended Offer
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white">
                Get More Months — Pay Less
              </h2>
              <p className="text-xs sm:text-base text-slate-300 mt-1 max-w-xl">
                Unlock 3 extra bonus months on our 12-Month plan (15 months total) or 6 bonus months on our 24-Month plan (30 months total).
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              <div className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-400/50 text-center">
                <span className="block text-[11px] sm:text-xs text-slate-400">12 Months</span>
                <span className="text-xs sm:text-sm font-bold text-amber-400">+3 Months Free</span>
              </div>
              <div className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-400/50 text-center">
                <span className="block text-[11px] sm:text-xs text-slate-400">24 Months</span>
                <span className="text-xs sm:text-sm font-bold text-amber-400">+6 Months Free</span>
              </div>
              <button
                onClick={() => scrollToSection('pricing')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm shadow-md transition-colors"
              >
                Claim Offer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. IPTV FEATURES SECTION                                             */}
      {/* ==================================================================== */}
      <section id="features" className="py-12 sm:py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
              All-In-One Features
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Everything You Need for Endless Streaming
            </h2>
            <p className="text-slate-300 text-sm sm:text-lg">
              Packed with modern features that elevate your home viewing experience across television, mobile, and desktop.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <Tv className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">Live TV Channels</h3>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">USA, UK & global channels broadcast in HD and 4K quality.</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <Film className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">Movies & Series</h3>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">Thousands of on-demand movies, series, and season boxsets.</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <PlayCircle className="w-6 h-6 sm:w-7 sm:h-7 text-red-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">Major Live Sports</h3>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">Full weekend fixture coverage, leagues, tournaments, and PPVs.</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">Electronic Guide (EPG)</h3>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">Interactive TV schedule to browse upcoming programming.</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <Monitor className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">Multiple Device Access</h3>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">Easily switch between Smart TVs, phones, tablets, and computers.</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">Digital Activation</h3>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">Credentials and M3U playlists sent directly to your email inbox.</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <Headphones className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">Customer Support</h3>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">24/7 technical team ready to assist with playlist configuration.</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-sm sm:text-base mb-1">Flexible Durations</h3>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">Choose from 3, 6, 12, or 24-month subscription plans.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. DEVICE COMPATIBILITY SECTION                                      */}
      {/* ==================================================================== */}
      <section id="devices" className="py-12 sm:py-16 lg:py-24 bg-[#0a0f18] border-t border-b border-slate-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
              Hardware & App Support
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Watch on Any Screen, Anywhere
            </h2>
            <p className="text-slate-300 text-sm sm:text-lg">
              Compatible with popular smart television platforms, streaming sticks, mobile devices, and desktop computers.
            </p>
          </div>

          {/* Device Icons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-8 sm:mb-12">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center">
              <Tv className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-xs sm:text-sm">Samsung Smart TV</h3>
              <span className="text-[11px] sm:text-xs text-slate-400 mt-1">Tizen OS</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center">
              <Tv className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-xs sm:text-sm">LG Smart TV</h3>
              <span className="text-[11px] sm:text-xs text-slate-400 mt-1">webOS Platform</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center">
              <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-xs sm:text-sm">Amazon Firestick</h3>
              <span className="text-[11px] sm:text-xs text-slate-400 mt-1">Fire TV 4K / Cube</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center">
              <Tv className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-xs sm:text-sm">Android & Google TV</h3>
              <span className="text-[11px] sm:text-xs text-slate-400 mt-1">Sony, TCL, Philips</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center">
              <Monitor className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-xs sm:text-sm">Apple TV</h3>
              <span className="text-[11px] sm:text-xs text-slate-400 mt-1">tvOS 4K</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center">
              <Smartphone className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-xs sm:text-sm">iPhone & iPad</h3>
              <span className="text-[11px] sm:text-xs text-slate-400 mt-1">iOS & iPadOS</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center">
              <Tablet className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-xs sm:text-sm">Android Phones & Tablets</h3>
              <span className="text-[11px] sm:text-xs text-slate-400 mt-1">Samsung, Xiaomi, Pixel</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center">
              <Laptop className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-xs sm:text-sm">Windows PC & Laptop</h3>
              <span className="text-[11px] sm:text-xs text-slate-400 mt-1">Windows 10 & 11</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center">
              <Laptop className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-xs sm:text-sm">Apple Mac</h3>
              <span className="text-[11px] sm:text-xs text-slate-400 mt-1">macOS / MacBook</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center flex flex-col items-center">
              <Layers className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mb-2.5 sm:mb-3" />
              <h3 className="font-bold text-white text-xs sm:text-sm">MAG & IPTV Boxes</h3>
              <span className="text-[11px] sm:text-xs text-slate-400 mt-1">Formuler & Stalker</span>
            </div>
          </div>

          {/* Supported IPTV Player Applications */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center max-w-4xl mx-auto">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Popular Compatible IPTV Player Apps
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-300">
              <span className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">IPTV Smarters Pro</span>
              <span className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">TiviMate IPTV Player</span>
              <span className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">IBO Player</span>
              <span className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">XCIPTV Player</span>
              <span className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">GSE Smart IPTV</span>
              <span className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">VLC Media Player</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 sm:mt-4">
              Note: App availability and setup steps depend on your specific device app store and platform guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 9. SUBSCRIPTION PRICING SECTION (CONVERSION FOCUS)                   */}
      {/* ==================================================================== */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-24 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-[700px] h-[300px] bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
              Flexible Subscriptions
            </div>
            <h2 className="text-2xl sm:text-5xl font-extrabold text-white mb-3 sm:mb-4">
              Choose Your IPTV Subscription
            </h2>
            <p className="text-slate-300 text-sm sm:text-lg">
              Select your simultaneous screen requirement, then choose your preferred subscription period.
            </p>
          </div>

          {/* SIMULTANEOUS SCREEN SELECTOR */}
          <div className="max-w-md mx-auto mb-10 sm:mb-14">
            <div className="text-center mb-2.5 sm:mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Simultaneous Screens / Devices
              </span>
            </div>
            <div className="grid grid-cols-3 p-1 sm:p-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
              {([1, 2, 3] as ScreenCount[]).map((screens) => (
                <button
                  key={screens}
                  onClick={() => setSelectedScreens(screens)}
                  className={`py-2.5 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
                    selectedScreens === screens
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {screens} {screens === 1 ? 'Screen' : 'Screens'}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              Streaming on {selectedScreens} {selectedScreens === 1 ? 'device' : 'devices'} simultaneously
            </p>
          </div>

          {/* PRICING CARDS (4 PLANS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {Object.keys(SUBSCRIPTION_PLANS).map((planKey) => {
              const plan = SUBSCRIPTION_PLANS[planKey];
              const screenOption = plan.screens[selectedScreens];

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
                    plan.isPopular
                      ? 'bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-2 border-amber-400 shadow-xl shadow-amber-500/10 lg:-translate-y-2 mt-2 sm:mt-0'
                      : plan.isBestValue
                      ? 'bg-gradient-to-b from-slate-800/80 to-slate-900/90 border-2 border-emerald-500/80 shadow-xl shadow-emerald-500/10 mt-2 sm:mt-0'
                      : 'bg-slate-900/70 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Badges */}
                  {plan.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[11px] font-extrabold uppercase tracking-wider shadow whitespace-nowrap">
                      Most Popular
                    </div>
                  )}
                  {plan.isBestValue && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-black text-[11px] font-extrabold uppercase tracking-wider shadow whitespace-nowrap">
                      Best Value
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-4">
                      {plan.bonusBadge && (
                        <span className="inline-block px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                          {plan.bonusBadge}
                        </span>
                      )}
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{plan.durationLabel}</p>
                    </div>

                    {/* Price Display */}
                    <div className="mb-5 pb-5 border-b border-slate-800">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                          {screenOption.price}
                        </span>
                      </div>
                      {screenOption.priceMonthlyEquivalent && (
                        <span className="text-xs text-amber-400 font-semibold mt-1 block">
                          ~ {screenOption.priceMonthlyEquivalent}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 block mt-1">
                        One-time payment • No auto-charge
                      </span>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2.5 mb-6 text-xs text-slate-300">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Order Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => handleOrderClick(planKey)}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 shadow-md ${
                        plan.isPopular
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/20'
                          : plan.isBestValue
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-black shadow-emerald-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      <span>ORDER NOW</span>
                    </button>
                    <span className="block text-[10px] text-slate-400 text-center mt-2">
                      Secure Stripe Checkout
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 sm:mt-8 text-center text-xs text-slate-400">
            All plans include full access to USA, UK & International Live TV, Sports & VOD with our 7-Day Money-Back Guarantee.
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 10. HOW IT WORKS SECTION                                             */}
      {/* ==================================================================== */}
      <section className="py-12 sm:py-16 lg:py-24 bg-[#0a0f18] border-t border-b border-slate-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
              Simple 3-Step Process
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-slate-300 text-sm sm:text-lg">
              Get up and streaming on your favorite device in just three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            <div className="p-5 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-400 text-black font-extrabold flex items-center justify-center text-base sm:text-lg mb-4 sm:mb-6 shadow-md shadow-amber-400/20">
                1
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Choose Your Plan</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Select your preferred subscription period (3, 6, 12, or 24 months) and the number of simultaneous screens you need for your household.
              </p>
            </div>

            <div className="p-5 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-400 text-black font-extrabold flex items-center justify-center text-base sm:text-lg mb-4 sm:mb-6 shadow-md shadow-amber-400/20">
                2
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Complete Payment</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Click Order Now and complete your payment securely via our encrypted Stripe checkout page. Your payment details are protected with 256-bit SSL encryption.
              </p>
            </div>

            <div className="p-5 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 relative">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-400 text-black font-extrabold flex items-center justify-center text-base sm:text-lg mb-4 sm:mb-6 shadow-md shadow-amber-400/20">
                3
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Receive Your Access</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Your IPTV credentials, M3U playlist link, and step-by-step setup guides are delivered digitally to your email address for immediate setup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 11. FAQ ACCORDION SECTION                                            */}
      {/* ==================================================================== */}
      <section id="faq" className="py-12 sm:py-16 lg:py-24 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
              Clear Answers
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-300 text-sm sm:text-lg">
              Everything you need to know about our IPTV subscription service, devices, and activation.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl bg-slate-900/70 border border-slate-800 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between text-left focus:outline-none hover:bg-slate-800/40"
                  >
                    <span className="font-semibold text-white text-sm sm:text-lg pr-3 sm:pr-4">
                      {item.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-6 sm:pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/50 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 12. TRUST & SECURITY SECTION                                         */}
      {/* ==================================================================== */}
      <section className="py-10 sm:py-14 bg-[#0a0f18] border-t border-slate-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 sm:gap-6 text-center">
            <div className="flex flex-col items-center">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 mb-2" />
              <h4 className="font-bold text-white text-xs sm:text-sm">Secure Payment</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">256-Bit SSL Stripe Checkout</p>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400 mb-2" />
              <h4 className="font-bold text-white text-xs sm:text-sm">Digital Delivery</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Instant Email Credentials</p>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 mb-2" />
              <h4 className="font-bold text-white text-xs sm:text-sm">7-Day Guarantee</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Risk-Free Evaluation</p>
            </div>
            <div className="flex flex-col items-center">
              <Headphones className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400 mb-2" />
              <h4 className="font-bold text-white text-xs sm:text-sm">Customer Support</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">24/7 Setup Assistance</p>
            </div>
            <div className="flex flex-col items-center col-span-2 md:col-span-1">
              <Layers className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400 mb-2" />
              <h4 className="font-bold text-white text-xs sm:text-sm">Multi-Device</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Smart TVs, Sticks & Mobile</p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 13. FINAL CONVERSION CTA SECTION                                     */}
      {/* ==================================================================== */}
      <section className="py-12 sm:py-20 relative overflow-hidden bg-gradient-to-b from-[#0a0f18] via-[#0d1624] to-[#070b12] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl sm:text-5xl font-extrabold text-white tracking-tight mb-3 sm:mb-4">
            Ready to Start Streaming?
          </h2>
          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto mb-6 sm:mb-8">
            Choose your plan and get instant digital access to live USA & UK television, sports tournaments, movies, and series today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => scrollToSection('pricing')}
              className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-sm sm:text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>View Plans</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="mailto:contact@accessiqtech.net"
              className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-sm sm:text-base transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 14. STANDALONE LANDING PAGE FOOTER                                   */}
      {/* ==================================================================== */}
      <footer className="bg-[#05080e] border-t border-slate-900 pt-8 pb-24 sm:pt-12 sm:pb-28 text-slate-400 text-xs overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 pb-6 sm:pb-8 border-b border-slate-800/60">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-400/30 p-1.5 flex items-center justify-center flex-shrink-0">
                <BrandLogoIcon className="w-full h-full" gradientId="favFooterLogo" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">StreamPass IPTV</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-300 text-xs">
              <button onClick={() => scrollToSection('usa-uk')} className="hover:text-amber-400 transition-colors">USA & UK</button>
              <button onClick={() => scrollToSection('benefits')} className="hover:text-amber-400 transition-colors">Benefits</button>
              <button onClick={() => scrollToSection('sports')} className="hover:text-amber-400 transition-colors">Sports</button>
              <button onClick={() => scrollToSection('devices')} className="hover:text-amber-400 transition-colors">Devices</button>
              <button onClick={() => scrollToSection('pricing')} className="hover:text-amber-400 transition-colors">Pricing</button>
              <button onClick={() => scrollToSection('faq')} className="hover:text-amber-400 transition-colors">FAQ</button>
              <a href="mailto:contact@accessiqtech.net" className="hover:text-amber-400 transition-colors">Support</a>
            </div>
          </div>

          <div className="pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left text-slate-400">
            <p>© {new Date().getFullYear()} StreamPass IPTV. All rights reserved. High-speed broadband internet connection required for streaming.</p>
            <p className="text-[11px] text-slate-400">Credentials delivered digitally after payment confirmation.</p>
          </div>
        </div>
      </footer>

      {/* ==================================================================== */}
      {/* 15. STICKY BOTTOM ACTION BAR                                         */}
      {/* ==================================================================== */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#070b12]/95 backdrop-blur-md border-t border-slate-800/90 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          <div className="hidden md:flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="font-semibold text-white truncate">Instant Digital Activation</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 truncate">24/7 WhatsApp & Email Support</span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => scrollToSection('pricing')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95"
            >
              <span>Order Now</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </button>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello! I have a question about StreamPass IPTV subscription plans.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 border border-emerald-500/40 flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span>Message Us</span>
            </a>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ORDER CONFIRMATION MODAL POPUP                                       */}
      {/* ==================================================================== */}
      {isModalOpen && selectedPlanKey && SUBSCRIPTION_PLANS[selectedPlanKey] && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-slate-900 to-[#070b12] border border-slate-700/80 shadow-2xl p-5 sm:p-8 text-white max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-5 sm:mb-6 pr-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Order Confirmation
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">Complete Your Order</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Enter your details to generate your order and receive activation credentials.
              </p>
            </div>

            {/* Selected Plan Summary Card */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/60 border border-slate-700/70 mb-5 flex items-center justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                  Selected Package
                </span>
                <h4 className="text-sm sm:text-lg font-bold text-white truncate">
                  {SUBSCRIPTION_PLANS[selectedPlanKey].name}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedScreens} {selectedScreens === 1 ? 'Screen' : 'Screens'} • 4K UHD Streams
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  {SUBSCRIPTION_PLANS[selectedPlanKey].screens[selectedScreens]?.price}
                </span>
                <span className="text-[11px] text-emerald-400 block font-medium">Instant Activation</span>
              </div>
            </div>

            {/* Input Form */}
            <div className="space-y-4 mb-5 sm:mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Full Name *
                </label>
                <input 
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" /> Email Address (For Credentials) *
                </label>
                <input 
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                  {formError}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Button 1: Continue to Checkout */}
              <button
                type="button"
                disabled={isSubmitting !== false}
                onClick={() => handleProceedWithOrder('stripe')}
                className="w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting === 'stripe' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span>Continue to Checkout (Card / Stripe)</span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  </>
                )}
              </button>

              {/* Button 2: Confirm via WhatsApp */}
              <button
                type="button"
                disabled={isSubmitting !== false}
                onClick={() => handleProceedWithOrder('whatsapp')}
                className="w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 border border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting === 'whatsapp' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>Opening WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span>Confirm via WhatsApp</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer Trust Note */}
            <div className="mt-5 pt-4 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>256-Bit SSL Encrypted • Fast Email & WhatsApp Digital Delivery</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
