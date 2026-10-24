import React, { createContext, useContext, useState, useEffect } from 'react';

interface PaymentSettings {
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  paymentRequired: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  paypalClientId: string;
  paypalSecret: string;
}

interface PlanSettings {
  trialLength: number;
  plans: Plan[];
}

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  popular?: boolean;
}

interface SettingsContextType {
  paymentSettings: PaymentSettings;
  planSettings: PlanSettings;
  integrations: Integration[];
  updatePaymentSettings: (settings: Partial<PaymentSettings>) => void;
  updatePlanSettings: (settings: Partial<PlanSettings>) => void;
  updateIntegrations: (integrations: Integration[]) => void;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  features: string[];
  status: 'Available' | 'Coming Soon';
  link: string;
}

const defaultPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 29,
    priceAnnual: 290,
    features: [
      'Up to 5 website scans per month',
      'Basic accessibility reports',
      'Email support',
      'WCAG 2.1 AA compliance checks'
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    priceMonthly: 79,
    priceAnnual: 790,
    popular: true,
    features: [
      'Up to 25 website scans per month',
      'Advanced AI-powered reports',
      'One-click fix suggestions',
      'Priority email support',
      'API access',
      'Custom branding'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 199,
    priceAnnual: 1990,
    features: [
      'Unlimited website scans',
      'White-label solutions',
      'Dedicated account manager',
      'Phone support',
      'Advanced integrations',
      'Custom reporting'
    ]
  }
];

const defaultIntegrations: Integration[] = [
  {
    id: 'wordpress',
    name: 'WordPress Plugin',
    description: 'Seamlessly integrate accessibility scanning into your WordPress workflow.',
    category: 'CMS',
    logo: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    features: ['One-click scanning', 'Dashboard widget', 'Automated reports'],
    status: 'Coming Soon',
    link: '#'
  },
  {
    id: 'shopify',
    name: 'Shopify App',
    description: 'Ensure your e-commerce store is accessible to all customers.',
    category: 'E-commerce',
    logo: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    features: ['Product page scanning', 'Checkout accessibility', 'Mobile optimization'],
    status: 'Coming Soon',
    link: '#'
  },
  {
    id: 'github',
    name: 'GitHub Action',
    description: 'Integrate accessibility testing into your CI/CD pipeline.',
    category: 'DevOps',
    logo: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    features: ['Automated PR checks', 'Build integration', 'Custom rules'],
    status: 'Coming Soon',
    link: '#'
  },
  {
    id: 'slack',
    name: 'Slack Bot',
    description: 'Get accessibility alerts and reports directly in Slack.',
    category: 'Communication',
    logo: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    features: ['Real-time alerts', 'Team notifications', 'Report sharing'],
    status: 'Coming Soon',
    link: '#'
  },
  {
    id: 'figma',
    name: 'Figma Plugin',
    description: 'Check accessibility compliance during the design phase.',
    category: 'Design',
    logo: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    features: ['Color contrast checking', 'Font size validation', 'Design annotations'],
    status: 'Coming Soon',
    link: '#'
  },
  {
    id: 'zapier',
    name: 'Zapier Integration',
    description: 'Connect AccessIQ Tech with 5000+ apps through Zapier.',
    category: 'Automation',
    logo: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    features: ['Custom workflows', 'Multi-app automation', 'Trigger actions'],
    status: 'Coming Soon',
    link: '#'
  }
];

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    stripeEnabled: false,
    paypalEnabled: false,
    paymentRequired: true,
    stripePublishableKey: 'pk_test_example',
    stripeSecretKey: 'sk_test_example',
    paypalClientId: 'paypal_client_id_example',
    paypalSecret: 'paypal_secret_example'
  });

  const [planSettings, setPlanSettings] = useState<PlanSettings>({
    trialLength: 8,
    plans: defaultPlans
  });
  
  const [integrations, setIntegrations] = useState<Integration[]>(defaultIntegrations);

  const updateIntegrations = (newIntegrations: Integration[]) => {
    setIntegrations(newIntegrations);
    localStorage.setItem('accessiq_integrations', JSON.stringify(newIntegrations));
  };

  const fetchPublicSettings = async () => {
    try {
      const response = await fetch('/api/settings/public-settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setPaymentSettings(prev => ({
            ...prev,
            stripeEnabled: data.settings.stripe_enabled,
            paypalEnabled: data.settings.paypal_enabled,
            paymentRequired: data.settings.payment_required
          }));
          
          setPlanSettings(prev => ({
            ...prev,
            trialLength: data.settings.trial_length_days
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch public settings:', error);
    }
  };

  const fetchPlansFromBackend = async () => {
    try {
      const response = await fetch('/api/plans', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.plans) {
          const formattedPlans = data.plans.map((plan: any) => ({
            id: plan.id.toString(),
            name: plan.name,
            priceMonthly: plan.priceMonthly,
            priceAnnual: plan.priceAnnual,
            features: plan.features,
            popular: plan.popular
          }));
          
          setPlanSettings(prev => ({
            ...prev,
            plans: formattedPlans
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const updatePaymentSettings = (settings: Partial<PaymentSettings>) => {
    setPaymentSettings(prev => ({ ...prev, ...settings }));
  };

  const updatePlanSettings = (settings: Partial<PlanSettings>) => {
    setPlanSettings(prev => ({ ...prev, ...settings }));
  };

  useEffect(() => {
    // Fetch settings from backend instead of localStorage
    fetchPublicSettings();
    fetchPlansFromBackend();
    
    // Only load integrations from localStorage (not managed by backend yet)
    const storedIntegrations = localStorage.getItem('accessiq_integrations');
    if (storedIntegrations) {
      setIntegrations(JSON.parse(storedIntegrations));
    }
  }, []);

  return (
    <SettingsContext.Provider value={{
      paymentSettings,
      planSettings,
      integrations,
      updatePaymentSettings,
      updatePlanSettings,
      updateIntegrations
    }}>
      {children}
    </SettingsContext.Provider>
  );
};