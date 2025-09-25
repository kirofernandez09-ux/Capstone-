import React, { useState, useEffect } from 'react';
import { Save, Edit3, Eye, FileText, Globe, Shield, Phone, Mail, MapPin, Clock } from 'lucide-react';
import DataService from '../../components/services/DataService';

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState('mission');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [content, setContent] = useState({
    mission: { title: 'Our Mission', content: '' },
    vision: { title: 'Our Vision', content: '' },
    terms: { title: 'Terms and Conditions', content: '' },
    privacy: { title: 'Privacy Policy', content: '' },
    contact: { title: 'Contact Information', content: '' },
    about: { title: 'About Us', content: '' }
  });

  const contentTabs = [
    { key: 'mission', label: 'Mission', icon: Globe, description: 'Company mission statement' },
    { key: 'vision', label: 'Vision', icon: Eye, description: 'Company vision and goals' },
    { key: 'about', label: 'About Us', icon: FileText, description: 'Company background and story' },
    { key: 'terms', label: 'Terms & Conditions', icon: Shield, description: 'Terms of service and conditions' },
    { key: 'privacy', label: 'Privacy Policy', icon: Shield, description: 'Privacy policy and data protection' },
    { key: 'contact', label: 'Contact Info', icon: Phone, description: 'Contact details and locations' }
  ];

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    setLoading(true);
    try {
      const promises = Object.keys(content).map(async (type) => {
        try {
          const response = await DataService.fetchContent(type);
          return { type, data: response.data };
        } catch (error) {
          return { type, data: { type, title: content[type].title, content: '' } };
        }
      });

      const results = await Promise.all(promises);
      const newContent = {};
      results.forEach(({ type, data }) => {
        newContent[type] = data;
      });
      setContent(newContent);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (field, value) => {
    setContent(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await DataService.updateContent(activeTab, content[activeTab]);
      alert('Content updated successfully!');
      setEditMode(false);
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const getDefaultContent = (type) => {
    const defaults = {
      mission: `At DoRayd Travel & Tours, our mission is to provide exceptional travel experiences that create lasting memories. We are committed to offering safe, reliable, and affordable transportation and tour services while showcasing the beauty and culture of the Philippines.

We strive to:
• Deliver outstanding customer service with every interaction
• Maintain the highest safety standards for all our vehicles and tours
• Support local communities and promote sustainable tourism
• Create personalized travel experiences that exceed expectations
• Build lasting relationships with our customers based on trust and reliability`,

      vision: `To be the leading travel and transportation company in the Philippines, recognized for our commitment to excellence, innovation, and customer satisfaction.

Our Vision includes:
• Expanding our services to cover more destinations across the Philippines
• Becoming the most trusted name in travel and transportation
• Setting industry standards for safety and customer service
• Contributing to the growth of Philippine tourism
• Creating employment opportunities in local communities
• Embracing sustainable and eco-friendly travel practices`,

      about: `DoRayd Travel & Tours was founded with a passion for sharing the incredible beauty and rich culture of the Philippines with travelers from around the world. Based in the heart of the Philippines, we have been serving customers with dedication and excellence since our establishment.

Our Story:
Founded by travel enthusiasts who understand the importance of reliable transportation and memorable experiences, DoRayd Travel & Tours has grown from a small local business to a trusted name in Philippine tourism.

What We Offer:
• Premium car rental services with well-maintained vehicles
• Expertly guided tours to the most beautiful destinations
• Customizable travel packages for individuals and groups
• Professional drivers and tour guides
• 24/7 customer support

Our Team:
Our experienced team consists of professional drivers, knowledgeable tour guides, and dedicated customer service representatives who are passionate about making your travel experience unforgettable.

Why Choose Us:
• Years of experience in the tourism industry
• Commitment to safety and reliability
• Competitive pricing with no hidden fees
• Local expertise and insider knowledge
• Personalized service tailored to your needs`,

      terms: `TERMS AND CONDITIONS

1. BOOKING AND PAYMENT
• All bookings must be confirmed with a valid payment method
• Full payment is required for tours; car rentals require a deposit
• Cancellation policies apply as outlined in your booking confirmation
• Prices are subject to change based on availability and season

2. VEHICLE RENTAL TERMS
• Valid driver's license required for all drivers
• Minimum age requirement: 21 years old
• Vehicle must be returned in the same condition as received
• Fuel costs are the responsibility of the renter
• Late return fees may apply

3. TOUR SERVICES
• Tour itineraries may be modified due to weather or safety conditions
• Tour guides reserve the right to adjust schedules for safety reasons
• Personal belongings are the responsibility of the customer
• Travel insurance is recommended but not mandatory

4. SAFETY AND LIABILITY
• DoRayd Travel & Tours maintains comprehensive insurance coverage
• Customers participate in activities at their own risk
• Safety briefings and instructions must be followed at all times
• Company liability is limited as outlined in our insurance policy

5. CANCELLATION POLICY
• 48 hours notice required for tour cancellations
• Car rental cancellations must be made 24 hours in advance
• Refund policies vary based on the type of service and timing
• Weather-related cancellations are subject to rescheduling

6. CUSTOMER RESPONSIBILITIES
• Provide accurate information during booking
• Arrive on time for scheduled services
• Respect local customs and environments
• Follow guide instructions and safety protocols

By booking our services, you agree to these terms and conditions.`,

      privacy: `PRIVACY POLICY

DoRayd Travel & Tours is committed to protecting your privacy and ensuring the security of your personal information.

INFORMATION WE COLLECT
• Personal details provided during booking (name, contact information)
• Payment information for processing transactions
• Travel preferences and special requirements
• Feedback and communication records

HOW WE USE YOUR INFORMATION
• Processing bookings and providing services
• Communicating important updates about your reservation
• Improving our services based on customer feedback
• Marketing communications (with your consent)
• Legal compliance and record-keeping

INFORMATION SHARING
• We do not sell or rent your personal information to third parties
• Information may be shared with service partners (hotels, activity providers)
• Data may be disclosed when required by law
• Anonymous data may be used for business analytics

DATA SECURITY
• We implement appropriate security measures to protect your information
• Payment data is processed through secure, encrypted systems
• Access to personal information is limited to authorized personnel
• Regular security audits and updates are conducted

YOUR RIGHTS
• Access to your personal information
• Correction of inaccurate data
• Deletion of your information (subject to legal requirements)
• Opt-out of marketing communications
• Data portability where applicable

COOKIES AND TRACKING
• Our website uses cookies to improve user experience
• You can control cookie preferences through your browser settings
• Third-party analytics tools may be used to improve our services

CONTACT INFORMATION
For privacy-related questions or concerns, please contact us at:
Email: privacy@dorayd.com
Phone: +63 917 123 4567

This policy is effective as of January 1, 2024 and may be updated periodically.`,

      contact: `CONTACT INFORMATION

HEAD OFFICE
DoRayd Travel & Tours
123 Tourism Boulevard
Makati City, Metro Manila 1234
Philippines

PHONE NUMBERS
Main Office: +63 (02) 8123-4567
Mobile/WhatsApp: +63 917 123 4567
Emergency Hotline: +63 917 987 6543

EMAIL ADDRESSES
General Inquiries: info@dorayd.com
Bookings: booking@dorayd.com
Customer Service: support@dorayd.com
Corporate Accounts: corporate@dorayd.com

OFFICE HOURS
Monday - Friday: 8:00 AM - 6:00 PM
Saturday: 8:00 AM - 5:00 PM
Sunday: 9:00 AM - 4:00 PM
Holidays: Limited hours (call ahead)

EMERGENCY CONTACT
24/7 Emergency Support: +63 917 987 6543
(For urgent matters related to ongoing bookings)

SOCIAL MEDIA
Facebook: facebook.com/DoRaydTravel
Instagram: @DoRaydTravel
Twitter: @DoRaydTours

BRANCH LOCATIONS
Cebu Branch:
456 Heritage Street, Cebu City
Phone: +63 (032) 234-5678

Davao Branch:
789 Sunrise Avenue, Davao City
Phone: +63 (082) 345-6789

Palawan Branch:
321 Paradise Road, Puerto Princesa
Phone: +63 (048) 456-7890

For the fastest response, please email us or use our online contact form on our website.`
    };

    return defaults[type] || '';
  };

  const activeContent = content[activeTab] || { title: '', content: '' };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-600">Manage website content, policies, and information</p>
        </div>
        <div className="flex items-center gap-3">
          {editMode ? (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Content
            </button>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {contentTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tab Description */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  {contentTabs.find(tab => tab.key === activeTab)?.description}
                </p>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={activeContent.title}
                    onChange={(e) => handleContentChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter title..."
                  />
                ) : (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {activeContent.title || 'No title set'}
                  </div>
                )}
              </div>

              {/* Content Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                {editMode ? (
                  <div className="space-y-3">
                    <textarea
                      value={activeContent.content}
                      onChange={(e) => handleContentChange('content', e.target.value)}
                      rows="20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Enter content..."
                    />
                    {!activeContent.content && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleContentChange('content', getDefaultContent(activeTab))}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Load Default Content
                        </button>
                        <span className="text-sm text-gray-500">
                          Click to load sample content for this section
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full min-h-96 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    {activeContent.content ? (
                      <div className="whitespace-pre-wrap text-sm text-gray-700">
                        {activeContent.content}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <FileText className="w-16 h-16 mb-4" />
                        <p className="text-lg font-medium mb-2">No content available</p>
                        <p className="text-sm">Click "Edit Content" to add content for this section</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content Statistics */}
              {activeContent.content && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Content Statistics</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Characters:</span>
                      <span className="ml-2 font-medium">{activeContent.content.length.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Words:</span>
                      <span className="ml-2 font-medium">{activeContent.content.split(/\s+/).filter(word => word.length > 0).length.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Lines:</span>
                      <span className="ml-2 font-medium">{activeContent.content.split('\n').length.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Last Updated Info */}
              {activeContent.updatedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>
                    Last updated: {new Date(activeContent.updatedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Preview Tips */}
      {editMode && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-yellow-800 font-medium mb-2">Content Editing Tips:</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Use line breaks to separate paragraphs and sections</li>
            <li>• Keep content clear and concise for better readability</li>
            <li>• Include relevant contact information in appropriate sections</li>
            <li>• Review legal content with appropriate professionals</li>
            <li>• Test content on different devices for optimal display</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;