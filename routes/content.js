import express from 'express';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Static content storage (in a real app, this would be in a database)
const staticContent = {
  'about': {
    title: 'About DoRayd Travel & Tours',
    content: `
      <h2>Welcome to DoRayd Travel & Tours</h2>
      <p>DoRayd Travel & Tours is your premier destination for exploring the breathtaking beauty of the Philippines. Founded with a passion for adventure and a commitment to exceptional service, we specialize in providing unforgettable travel experiences through our comprehensive car rental services and expertly curated tour packages.</p>
      
      <h3>Our Mission</h3>
      <p>To make the stunning landscapes, rich culture, and warm hospitality of the Philippines accessible to everyone through safe, reliable, and memorable travel experiences.</p>
      
      <h3>What We Offer</h3>
      <ul>
        <li><strong>Premium Car Rentals:</strong> From economy cars for city exploration to SUVs for island adventures, our well-maintained fleet ensures comfort and reliability for your journey.</li>
        <li><strong>Guided Tour Packages:</strong> Discover hidden gems and popular destinations with our expertly designed tours, led by knowledgeable local guides.</li>
        <li><strong>24/7 Customer Support:</strong> Our dedicated team is always ready to assist you, ensuring your travel experience is smooth and worry-free.</li>
      </ul>
      
      <h3>Why Choose DoRayd?</h3>
      <ul>
        <li>Local expertise with deep knowledge of Philippine destinations</li>
        <li>Competitive pricing with transparent, no-hidden-fee policies</li>
        <li>Modern, well-maintained vehicles and safety-first approach</li>
        <li>Customizable packages to suit your preferences and budget</li>
        <li>Commitment to sustainable and responsible tourism</li>
      </ul>
      
      <p>Whether you're planning a romantic getaway, family vacation, or adventure expedition, DoRayd Travel & Tours is here to make your Philippine travel dreams come true.</p>
    `
  },
  'terms': {
    title: 'Terms and Conditions',
    content: `
      <h2>Terms and Conditions</h2>
      <p><strong>Effective Date:</strong> September 3, 2025</p>
      
      <h3>1. Acceptance of Terms</h3>
      <p>By accessing and using DoRayd Travel & Tours services, you accept and agree to be bound by these Terms and Conditions.</p>
      
      <h3>2. Booking and Reservations</h3>
      <ul>
        <li>All bookings are subject to availability</li>
        <li>A valid government-issued ID is required for all rentals</li>
        <li>Drivers must be at least 21 years old with a valid driver's license</li>
        <li>Full payment or deposit may be required at the time of booking</li>
      </ul>
      
      <h3>3. Cancellation Policy</h3>
      <ul>
        <li>Cancellations made 48 hours before the scheduled time: Full refund</li>
        <li>Cancellations made 24-48 hours before: 50% refund</li>
        <li>Cancellations made less than 24 hours: No refund</li>
        <li>Emergency cancellations will be evaluated case-by-case</li>
      </ul>
      
      <h3>4. Vehicle Rental Terms</h3>
      <ul>
        <li>Vehicles must be returned in the same condition as received</li>
        <li>Fuel should be returned at the same level as provided</li>
        <li>Any damages will be charged according to repair costs</li>
        <li>Late returns may incur additional charges</li>
      </ul>
      
      <h3>5. Tour Package Terms</h3>
      <ul>
        <li>Tour itineraries may be subject to change due to weather or circumstances</li>
        <li>Participants must follow guide instructions for safety</li>
        <li>DoRayd is not responsible for personal belongings</li>
      </ul>
      
      <h3>6. Liability and Insurance</h3>
      <p>DoRayd maintains comprehensive insurance coverage. Customers are responsible for any damages not covered by insurance due to negligence or misuse.</p>
      
      <h3>7. Contact Information</h3>
      <p>For questions about these terms, contact us at legal@dorayd.com</p>
    `
  },
  'privacy': {
    title: 'Privacy Policy',
    content: `
      <h2>Privacy Policy</h2>
      <p><strong>Last Updated:</strong> September 3, 2025</p>
      
      <h3>Information We Collect</h3>
      <ul>
        <li><strong>Personal Information:</strong> Name, email, phone number, address</li>
        <li><strong>Booking Information:</strong> Travel dates, preferences, payment details</li>
        <li><strong>Usage Data:</strong> Website interactions, preferences, device information</li>
      </ul>
      
      <h3>How We Use Your Information</h3>
      <ul>
        <li>Process bookings and provide services</li>
        <li>Communicate about your reservations</li>
        <li>Improve our services and customer experience</li>
        <li>Send promotional offers (with your consent)</li>
      </ul>
      
      <h3>Information Sharing</h3>
      <p>We do not sell or rent your personal information. We may share information with:</p>
      <ul>
        <li>Service providers who assist in our operations</li>
        <li>Legal authorities when required by law</li>
        <li>Business partners for joint services (with your consent)</li>
      </ul>
      
      <h3>Data Security</h3>
      <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
      
      <h3>Your Rights</h3>
      <ul>
        <li>Access your personal information</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Opt-out of marketing communications</li>
      </ul>
      
      <h3>Contact Us</h3>
      <p>For privacy-related questions, email us at privacy@dorayd.com</p>
    `
  },
  'refund': {
    title: 'Refund Policy',
    content: `
      <h2>Refund Policy</h2>
      
      <h3>General Refund Guidelines</h3>
      <p>DoRayd Travel & Tours is committed to customer satisfaction. Our refund policy is designed to be fair while maintaining operational sustainability.</p>
      
      <h3>Car Rental Refunds</h3>
      <ul>
        <li><strong>Cancellation 48+ hours before pickup:</strong> 100% refund</li>
        <li><strong>Cancellation 24-48 hours before pickup:</strong> 50% refund</li>
        <li><strong>Cancellation less than 24 hours:</strong> No refund</li>
        <li><strong>No-show:</strong> No refund</li>
      </ul>
      
      <h3>Tour Package Refunds</h3>
      <ul>
        <li><strong>Cancellation 7+ days before tour:</strong> 100% refund</li>
        <li><strong>Cancellation 3-7 days before tour:</strong> 75% refund</li>
        <li><strong>Cancellation 1-3 days before tour:</strong> 50% refund</li>
        <li><strong>Cancellation day of tour:</strong> No refund</li>
      </ul>
      
      <h3>Weather-Related Cancellations</h3>
      <p>If we cancel due to severe weather or safety concerns, customers receive a full refund or option to reschedule.</p>
      
      <h3>Emergency Situations</h3>
      <p>Medical emergencies or family emergencies will be evaluated case-by-case. Documentation may be required.</p>
      
      <h3>Refund Processing</h3>
      <ul>
        <li>Refunds are processed within 5-7 business days</li>
        <li>Refunds are issued to the original payment method</li>
        <li>Processing fees may apply for certain payment methods</li>
      </ul>
      
      <h3>Dispute Resolution</h3>
      <p>If you're unsatisfied with a refund decision, contact our customer service team at refunds@dorayd.com for review.</p>
    `
  },
  'faq': {
    title: 'Frequently Asked Questions',
    content: `
      <h2>Frequently Asked Questions</h2>
      
      <h3>Booking and Reservations</h3>
      
      <h4>How do I make a reservation?</h4>
      <p>You can book through our website, call us directly, or visit our office. Online booking is available 24/7 with instant confirmation.</p>
      
      <h4>What payment methods do you accept?</h4>
      <p>We accept cash, credit/debit cards, GCash, PayMaya, and bank transfers.</p>
      
      <h4>Can I modify my booking?</h4>
      <p>Yes, modifications are allowed subject to availability and may incur additional charges depending on the changes.</p>
      
      <h3>Car Rentals</h3>
      
      <h4>What documents do I need to rent a car?</h4>
      <p>You need a valid driver's license, government-issued ID, and a credit card or cash deposit.</p>
      
      <h4>Is insurance included?</h4>
      <p>Basic insurance is included. Additional coverage options are available for extra protection.</p>
      
      <h4>What happens if the car breaks down?</h4>
      <p>We provide 24/7 roadside assistance. Contact our emergency hotline immediately for support.</p>
      
      <h3>Tour Packages</h3>
      
      <h4>Are meals included in tour packages?</h4>
      <p>Meal inclusions vary by package. Check the tour details or contact us for specific information.</p>
      
      <h4>What should I bring on tours?</h4>
      <p>Bring comfortable clothing, sun protection, water, and any personal medications. Specific requirements are provided upon booking.</p>
      
      <h4>Can I customize a tour package?</h4>
      <p>Yes! We offer customizable packages. Contact us to discuss your preferences and requirements.</p>
      
      <h3>General</h3>
      
      <h4>Do you operate during holidays?</h4>
      <p>Yes, we operate year-round with special holiday rates and packages.</p>
      
      <h4>How can I contact customer support?</h4>
      <p>Reach us via phone, email, live chat on our website, or visit our office during business hours.</p>
      
      <h4>Do you offer group discounts?</h4>
      <p>Yes, we provide special rates for groups. Contact us for a custom quote based on your group size and requirements.</p>
    `
  }
};

// @desc    Get content by type
// @route   GET /api/content/:type
// @access  Public
router.get('/:type', (req, res) => {
  try {
    const { type } = req.params;
    
    const content = staticContent[type];
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content'
    });
  }
});

// @desc    Update content
// @route   PUT /api/content/:type
// @access  Private (Admin only)
router.put('/:type', auth, authorize('admin'), (req, res) => {
  try {
    const { type } = req.params;
    const { title, content } = req.body;
    
    if (!staticContent[type]) {
      return res.status(404).json({
        success: false,
        message: 'Content type not found'
      });
    }

    staticContent[type] = {
      title: title || staticContent[type].title,
      content: content || staticContent[type].content
    };

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: staticContent[type]
    });

    console.log(`📝 Content updated: ${type} by ${req.user.name} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update content'
    });
  }
});

// @desc    Get all content types
// @route   GET /api/content
// @access  Public
router.get('/', (req, res) => {
  try {
    const contentTypes = Object.keys(staticContent).map(type => ({
      type,
      title: staticContent[type].title
    }));

    res.json({
      success: true,
      data: contentTypes
    });
  } catch (error) {
    console.error('Error fetching content types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content types'
    });
  }
});

export default router;