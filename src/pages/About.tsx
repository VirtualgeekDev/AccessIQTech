import React from 'react';
import { Shield, Users, Target, Award, Heart, Zap } from 'lucide-react';

const About: React.FC = () => {
  const values = [
    {
      icon: <Shield className="h-8 w-8 text-brand-accent" />,
      title: 'Accessibility First',
      description: 'We believe the web should be accessible to everyone, regardless of ability.'
    },
    {
      icon: <Zap className="h-8 w-8 text-brand-accent" />,
      title: 'Innovation',
      description: 'Leveraging cutting-edge AI to solve complex accessibility challenges.'
    },
    {
      icon: <Heart className="h-8 w-8 text-brand-accent" />,
      title: 'Empathy',
      description: 'Understanding the real impact of accessibility on users\' daily lives.'
    },
    {
      icon: <Award className="h-8 w-8 text-brand-accent" />,
      title: 'Excellence',
      description: 'Delivering the highest quality tools and support to our customers.'
    }
  ];

  const team = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former accessibility consultant with 10+ years helping Fortune 500 companies achieve compliance.',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'CTO & Co-Founder',
      bio: 'AI researcher and former Google engineer specializing in computer vision and natural language processing.',
      image: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
    },
    {
      name: 'Dr. Emily Watson',
      role: 'Head of Accessibility',
      bio: 'Disability rights advocate and WCAG expert with a PhD in Human-Computer Interaction.',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-brand-dark py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Making the Web
            <span className="text-brand-accent block mt-2">Accessible for All</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            AccessIQ Tech was founded on the belief that digital accessibility shouldn't be 
            an afterthought—it should be built into every website from the ground up.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                We're on a mission to eliminate digital barriers and create an inclusive web 
                experience for the 1.3 billion people worldwide living with disabilities.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Through AI-powered automation and expert guidance, we make WCAG compliance 
                achievable for businesses of all sizes, turning accessibility from a burden 
                into a competitive advantage.
              </p>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-accent">1.3B</div>
                  <div className="text-sm text-gray-600">People with disabilities</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-accent">98%</div>
                  <div className="text-sm text-gray-600">Websites have barriers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-accent">$13T</div>
                  <div className="text-sm text-gray-600">Disability market value</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop"
                alt="Team collaborating on accessibility solutions"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Story
            </h2>
            <p className="text-xl text-gray-600">
              How a chance encounter led to a revolutionary accessibility platform
            </p>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">The Problem</h3>
              <p className="text-gray-700">
                In 2022, our founders Sarah and Marcus were working on separate projects when 
                they discovered a shocking statistic: 98% of websites fail basic accessibility 
                tests. Despite decades of guidelines and legal requirements, the web remained 
                largely inaccessible to people with disabilities.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">The Insight</h3>
              <p className="text-gray-700">
                Traditional accessibility testing was manual, expensive, and time-consuming. 
                Most businesses wanted to be inclusive but lacked the expertise and resources 
                to implement proper accessibility measures. There had to be a better way.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">The Solution</h3>
              <p className="text-gray-700">
                By combining Sarah's accessibility expertise with Marcus's AI background, 
                they created the first AI-powered platform that could automatically scan 
                websites, identify accessibility issues, and provide one-click fixes. 
                AccessIQ Tech was born.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover-scale bg-gray-50">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-md">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600">
              The passionate people behind AccessIQ Tech
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-brand-accent font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Join Us in Making the Web Accessible
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Whether you're a developer, business owner, or accessibility advocate, 
            we'd love to have you as part of our mission.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="bg-brand-accent text-brand-dark px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-400 transition-all transform hover:scale-105 inline-block"
            >
              Start Free Trial
            </a>
            <a
              href="/contact"
              className="border-2 border-brand-accent text-brand-accent px-8 py-4 rounded-lg text-lg font-semibold hover:bg-brand-accent hover:text-brand-dark transition-all"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;