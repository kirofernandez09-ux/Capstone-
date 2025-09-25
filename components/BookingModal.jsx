import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import DataService from './services/DataService.jsx';

const BookingModal = ({ isOpen, onClose, item, itemType }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    startDate: '', endDate: '', numberOfGuests: 1,
    paymentMethod: 'credit_card', agreedToTerms: false,
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Effect to calculate total price dynamically
  useEffect(() => {
    if (item) {
        if (itemType === 'car' && formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            if (days > 0) setTotalPrice(days * item.pricePerDay);
        } else if (itemType === 'tour') {
            setTotalPrice(formData.numberOfGuests * item.price);
        }
    }
  }, [formData.startDate, formData.endDate, formData.numberOfGuests, item, itemType]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreedToTerms) {
      setSubmitError('You must agree to the terms and conditions.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');

    try {
      const bookingData = { ...formData, itemId: item._id, itemType, totalPrice };
      const result = await DataService.createBooking(bookingData);
      if (result.success) {
        setSubmitSuccess(true);
      } else {
        throw new Error(result.message || 'Booking failed.');
      }
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Success screen
  if (submitSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/>
            <h2 className="text-2xl font-bold mb-2">Booking Received!</h2>
            <p className="text-gray-600 mb-6">You will receive an email confirmation once our team reviews and confirms your booking.</p>
            <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Book: {item.brand ? `${item.brand} ${item.model}` : item.title}</h2>
              <button onClick={onClose}><X size={24}/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && <p className="text-red-500 bg-red-100 p-3 rounded">{submitError}</p>}
              {/* Form fields */}
              <input name="firstName" onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="First Name" required className="w-full p-2 border rounded"/>
              <input name="lastName" onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Last Name" required className="w-full p-2 border rounded"/>
              <input type="email" name="email" onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email" required className="w-full p-2 border rounded"/>
              <input type="tel" name="phone" onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Phone Number" required className="w-full p-2 border rounded"/>
              {/* Date & Guest fields */}
              <div className="grid grid-cols-2 gap-4">
                <input type="date" name="startDate" onChange={(e) => setFormData({...formData, startDate: e.target.value})} required className="w-full p-2 border rounded"/>
                {itemType === 'car' && <input type="date" name="endDate" onChange={(e) => setFormData({...formData, endDate: e.target.value})} required className="w-full p-2 border rounded"/>}
                <input type="number" name="numberOfGuests" min="1" onChange={(e) => setFormData({...formData, numberOfGuests: e.target.value})} placeholder="Guests" required className="w-full p-2 border rounded"/>
              </div>

              <div className="font-bold text-xl text-right">Total: ₱{totalPrice.toLocaleString()}</div>
              
              <div>
                  <label className="flex items-center space-x-2">
                      <input type="checkbox" name="agreedToTerms" onChange={(e) => setFormData({...formData, agreedToTerms: e.target.checked})} />
                      <span>I agree to the Terms and Conditions</span>
                  </label>
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-blue-400">
                  {submitting ? 'Submitting...' : 'Submit Booking'}
              </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;