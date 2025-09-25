import React, { useState } from 'react';
import { X, Calendar, Users, Clock, MapPin, Phone, Mail, User, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import DataService from './services/DataService.jsx';

const BookingModal = ({ isOpen, onClose, item, itemType }) => {
  const [formData, setFormData] = useState({
    // Guest Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Booking Details
    startDate: '',
    endDate: '',
    numberOfGuests: 1,
    specialRequests: '',
    
    // Payment Information
    paymentMethod: 'credit_card',
    
    // Agreement
    agreedToTerms: false,
    
    // Tour specific
    pickupLocation: ''
  });

  const [calculating, setCalculating] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  React.useEffect(() => {
    if (formData.startDate && formData.endDate && item) {
      calculateTotal();
    }
  }, [formData.startDate, formData.endDate, formData.numberOfGuests, item]);

  const calculateTotal = () => {
    setCalculating(true);
    
    try {
      if (itemType === 'car') {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (days > 0 && item.pricePerDay) {
          const total = days * item.pricePerDay;
          setTotalPrice(total);
        } else {
          setTotalPrice(0);
        }
      } else if (itemType === 'tour') {
        if (item.price && formData.numberOfGuests > 0) {
          const total = formData.numberOfGuests * item.price;
          setTotalPrice(total);
        } else {
          setTotalPrice(0);
        }
      }
    } catch (error) {
      console.error('Error calculating total:', error);
      setTotalPrice(0);
    }
    
    setCalculating(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agreedToTerms) {
      setSubmitError('Please agree to the terms and conditions');
      return;
    }

    if (!item || !item._id) {
      setSubmitError('Invalid item selected for booking');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      console.log(`📝 Creating booking for ${itemType} at 2025-09-03 17:08:57`);
      console.log('👤 Current User: BlueDrinkingWater');

      const bookingData = {
        // Guest Information
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        
        // Booking Details
        itemId: item._id,
        itemType: itemType,
        itemName: itemType === 'car' ? `${item.brand} ${item.model}` : item.title || item.name,
        startDate: formData.startDate,
        endDate: itemType === 'car' ? formData.endDate : formData.startDate,
        numberOfGuests: formData.numberOfGuests,
        specialRequests: formData.specialRequests.trim(),
        pickupLocation: formData.pickupLocation.trim(),
        
        // Pricing
        totalPrice: totalPrice,
        unitPrice: itemType === 'car' ? item.pricePerDay : item.price,
        
        // Payment
        paymentMethod: formData.paymentMethod,
        
        // Status
        status: 'pending',
        source: 'website',
        
        // Metadata
        createdAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        sessionInfo: {
          currentUser: 'BlueDrinkingWater',
          timestamp: '2025-09-03 17:08:57',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      const result = await DataService.createBooking(bookingData);

      if (result.success) {
        setSubmitSuccess(true);
        console.log(`✅ Booking created successfully in database: ${result.data.bookingReference || result.data._id} at 2025-09-03 17:08:57`);
        
        // Show success message for 3 seconds then close
        setTimeout(() => {
          onClose();
          resetForm();
        }, 3000);
      } else {
        throw new Error(result.message || 'Booking creation failed in database');
      }
    } catch (error) {
      console.error('❌ Database booking creation error:', error);
      setSubmitError(error.message || 'Failed to create booking in database. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      startDate: '',
      endDate: '',
      numberOfGuests: 1,
      specialRequests: '',
      paymentMethod: 'credit_card',
      agreedToTerms: false,
      pickupLocation: ''
    });
    setTotalPrice(0);
    setSubmitError('');
    setSubmitSuccess(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  if (!isOpen || !item) return null;

  // Success screen
  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Saved to Database!</h2>
          <p className="text-gray-600 mb-6">
            Your booking has been successfully saved to our database. You will receive a confirmation email shortly with your booking details.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>What's next?</strong><br />
              Our team will review your booking from the database and contact you within 24 hours to confirm details and arrange payment.
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Book {itemType === 'car' ? 'Car Rental' : 'Tour Package'}
              </h2>
              <p className="text-gray-600">
                {itemType === 'car' ? `${item.brand} ${item.model}` : item.title || item.name}
              </p>
              <p className="text-xs text-blue-600 mt-1">Data will be saved to database</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Database Booking Error</p>
                  <p className="text-sm">{submitError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Form */}
              <div className="space-y-6">
                {/* Guest Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Guest Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your first name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your last name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+63 917 123 4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Booking Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {itemType === 'car' ? 'Pickup Date *' : 'Tour Date *'}
                        </label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {itemType === 'car' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Return Date *</label>
                          <input
                            type="date"
                            required
                            min={formData.startDate || new Date().toISOString().split('T')[0]}
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {itemType === 'car' ? 'Number of Passengers' : 'Number of Guests *'}
                      </label>
                      <select
                        value={formData.numberOfGuests}
                        onChange={(e) => setFormData({ ...formData, numberOfGuests: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ 
                          length: itemType === 'car' ? (item.seats || 4) : (item.maxGroupSize || 10) 
                        }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} {itemType === 'car' ? 'passenger' : 'guest'}{i > 0 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {itemType === 'tour' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                        <input
                          type="text"
                          value={formData.pickupLocation}
                          onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your preferred pickup location"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                      <textarea
                        value={formData.specialRequests}
                        onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Any special requirements or requests..."
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Method
                  </h3>
                  
                  <div className="space-y-3">
                    {[
                      { value: 'credit_card', label: 'Credit/Debit Card', description: 'Pay securely with your card' },
                      { value: 'gcash', label: 'GCash', description: 'Pay using GCash mobile wallet' },
                      { value: 'paymaya', label: 'PayMaya', description: 'Pay using PayMaya digital wallet' },
                      { value: 'bank_transfer', label: 'Bank Transfer', description: 'Direct bank transfer' },
                      { value: 'cash', label: 'Cash on Pickup', description: 'Pay when you pickup' }
                    ].map((method) => (
                      <label key={method.value} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.value}
                          checked={formData.paymentMethod === method.value}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{method.label}</div>
                          <div className="text-sm text-gray-600">{method.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.agreedToTerms}
                      onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <label htmlFor="terms" className="font-medium text-gray-900 cursor-pointer">
                        I agree to the Terms and Conditions *
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        By checking this box, you agree to our booking terms, cancellation policy, and privacy policy. Data will be stored securely in our database.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Summary */}
              <div className="space-y-6">
                {/* Item Details */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {itemType === 'car' ? 'Car Details' : 'Tour Details'}
                  </h3>
                  
                  <div className="space-y-3">
                    {item.images && item.images.length > 0 && (
                      <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${item.images[0]}`}
                          alt={itemType === 'car' ? `${item.brand} ${item.model}` : item.title || item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/300/200';
                          }}
                        />
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {itemType === 'car' ? `${item.brand} ${item.model} (${item.year})` : item.title || item.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                        {item.description}
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {itemType === 'car' ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Seats:</span>
                            <span>{item.seats} passengers</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transmission:</span>
                            <span className="capitalize">{item.transmission}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Fuel Type:</span>
                            <span className="capitalize">{item.fuelType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span>{item.location}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Destination:</span>
                            <span>{item.destination}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span>{item.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Difficulty:</span>
                            <span className="capitalize">{item.difficulty}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Max Group:</span>
                            <span>{item.maxGroupSize} people</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
                  
                  <div className="space-y-3">
                    {itemType === 'car' ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Daily Rate:</span>
                          <span>{formatPrice(item.pricePerDay || 0)}</span>
                        </div>
                        {formData.startDate && formData.endDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Number of Days:</span>
                            <span>
                              {Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Price per Person:</span>
                          <span>{formatPrice(item.price || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Number of Guests:</span>
                          <span>{formData.numberOfGuests} {formData.numberOfGuests === 1 ? 'person' : 'people'}</span>
                        </div>
                      </>
                    )}
                    
                    <hr className="border-gray-300" />
                    
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-900">Total Amount:</span>
                      <span className="text-blue-600">
                        {calculating ? 'Calculating...' : formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Important Information */}
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900">Important Information</h4>
                      <ul className="text-sm text-amber-800 mt-2 space-y-1">
                        <li>• Booking confirmation will be sent to your email</li>
                        <li>• {itemType === 'car' ? 'Valid driver\'s license required' : 'Tour guide will contact you before the tour'}</li>
                        <li>• Cancellation policy applies - check terms and conditions</li>
                        <li>• {itemType === 'car' ? 'Fuel and insurance included' : 'Weather conditions may affect tour schedule'}</li>
                        <li>• All data is stored securely in our database with encryption</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Need Help?</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">+63 917 123 4567</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">booking@dorayd.com</span>
                    </div>
                  </div>
                </div>

                {/* Development Info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-gray-100 border border-gray-300 p-3 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">🔧 Debug Info:</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>User: BlueDrinkingWater</p>
                      <p>Item Type: {itemType}</p>
                      <p>Item ID: {item._id}</p>
                      <p>Total Price: ₱{totalPrice}</p>
                      <p>Time: 2025-09-03 17:08:57</p>
                      <p>Database: Connected</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.agreedToTerms || calculating || totalPrice <= 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving to Database...
                  </>
                ) : (
                  `Save Booking to Database - ${formatPrice(totalPrice)}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;