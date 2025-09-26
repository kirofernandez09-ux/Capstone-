import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Users, CreditCard, AlertCircle, CheckCircle, ArrowLeft, ArrowRight, User, Upload, Shield, FileText, QrCode } from 'lucide-react';
import DataService from './services/DataService.jsx';

const BookingModal = ({ isOpen, onClose, item, itemType }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    startDate: '', endDate: '', numberOfGuests: 1,
    governmentIdUrl: '', paymentProofUrl: '', agreedToTerms: false,
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const idUploadRef = useRef(null);
  const paymentUploadRef = useRef(null);

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

  const handleFileUpload = async (file, type) => {
    try {
        const response = await DataService.uploadImage(file, 'documents');
        if(response.success){
            const url = response.data.url;
            console.log(`Uploaded ${type} to ${url}`);
            return url;
        } else {
            throw new Error(response.message || `Failed to upload ${type}`);
        }
    } catch(error){
        console.error(`Error uploading ${type}:`, error);
        setSubmitError(error.message);
        return '';
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const bookingData = { ...formData, itemId: item._id, itemType, totalPrice };
      const result = await DataService.createBooking(bookingData);
      if (result.success) {
        setSubmitSuccess(true);
      } else {
        throw new Error(result.message || 'Booking submission failed.');
      }
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (step) {
      case 1: // Select Dates
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Step 1: Select Your Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="date" name="startDate" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} required className="w-full p-2 border rounded"/>
              {itemType === 'car' && <input type="date" name="endDate" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} required className="w-full p-2 border rounded"/>}
              <input type="number" name="numberOfGuests" value={formData.numberOfGuests} min="1" onChange={(e) => setFormData({...formData, numberOfGuests: parseInt(e.target.value)})} placeholder="Guests" required className="w-full p-2 border rounded"/>
            </div>
          </div>
        );
      case 2: // Personal Info & ID Upload
        return (
          <div>
            <h3 className="text-lg font-semibold mb-4">Step 2: Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="firstName" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="First Name" required className="w-full p-2 border rounded"/>
                <input name="lastName" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="Last Name" required className="w-full p-2 border rounded"/>
                <input type="email" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email" required className="w-full p-2 border rounded"/>
                <input type="tel" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Phone Number" required className="w-full p-2 border rounded"/>
            </div>
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Valid ID</label>
                <input type="file" ref={idUploadRef} className="hidden" onChange={async (e) => {
                    const url = await handleFileUpload(e.target.files[0], 'id');
                    setFormData({...formData, governmentIdUrl: url});
                }} />
                <button type="button" onClick={() => idUploadRef.current.click()} className="w-full p-2 border rounded flex items-center justify-center gap-2">
                    <Upload size={16}/> {formData.governmentIdUrl ? "ID Uploaded!" : "Choose File"}
                </button>
            </div>
          </div>
        );
    case 3: // Terms & Conditions
        return (
            <div>
                <h3 className="text-lg font-semibold mb-4">Step 3: Terms & Conditions</h3>
                <div className="h-48 overflow-y-auto border p-2 rounded bg-gray-50 text-sm">
                    <p>All bookings must be confirmed with a payment proof. Cancellations made 48 hours before the booking date are eligible for a full refund. No-shows are non-refundable. The company is not liable for any loss or damage to personal belongings.</p>
                </div>
                <label className="flex items-center space-x-2 mt-4">
                    <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={(e) => setFormData({...formData, agreedToTerms: e.target.checked})} />
                    <span>I agree to the Terms and Conditions</span>
                </label>
            </div>
        );
    case 4: // Payment
        return (
            <div>
                <h3 className="text-lg font-semibold mb-4">Step 4: Make Payment</h3>
                <p className="text-center mb-4">Scan the QR code using your preferred payment app.</p>
                <div className="flex justify-center">
                    {/* In a real app, you would have an actual QR code image */}
                    <div className="w-40 h-40 bg-gray-200 flex items-center justify-center">
                        <QrCode size={100}/>
                    </div>
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">Supports GCash, PayMaya, and Bank Apps</p>
            </div>
        );
    case 5: // Upload Payment Proof
        return (
            <div>
                <h3 className="text-lg font-semibold mb-4">Step 5: Upload Payment Proof</h3>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload screenshot of your transaction</label>
                <input type="file" ref={paymentUploadRef} className="hidden" onChange={async (e) => {
                    const url = await handleFileUpload(e.target.files[0], 'payment');
                    setFormData({...formData, paymentProofUrl: url});
                }} />
                <button type="button" onClick={() => paymentUploadRef.current.click()} className="w-full p-2 border rounded flex items-center justify-center gap-2">
                    <Upload size={16}/> {formData.paymentProofUrl ? "Proof Uploaded!" : "Choose File"}
                </button>
            </div>
        );
      default:
        return null;
    }
  };

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
          {submitError && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{submitError}</p>}
          
          {renderStep()}

          <div className="font-bold text-xl text-right my-4">Total: ₱{totalPrice.toLocaleString()}</div>

          <div className="flex justify-between items-center mt-6">
              <button onClick={prevStep} disabled={step === 1} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 flex items-center gap-2">
                  <ArrowLeft size={16}/> Back
              </button>
              {step < 5 ? (
                  <button onClick={nextStep} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                      Next <ArrowRight size={16}/>
                  </button>
              ) : (
                  <button onClick={handleSubmit} disabled={submitting || !formData.paymentProofUrl} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-green-400">
                      {submitting ? 'Submitting...' : 'Submit Booking'}
                  </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;