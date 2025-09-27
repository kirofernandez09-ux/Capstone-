import DataService from './services/DataService.jsx';
import React, { useState, useEffect } from "react";
import { X, Calendar, Users, Upload, AlertCircle, CheckCircle, CreditCard, FileText, User as UserIcon } from "lucide-react";
import { useAuth } from './Login.jsx';

const BookingModal = ({ isOpen, onClose, item, itemType }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    numberOfGuests: 1,
    startDate: "",
    endDate: "",
    governmentIdUrl: "",
    agreedToTerms: false,
    paymentMethod: "gcash",
    paymentProofUrl: "",
    paymentReferenceNumber: "",
    amountPaid: "",
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      if (itemType === "car" && formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        setTotalPrice(days > 0 ? days * item.pricePerDay : 0);
      } else if (itemType === "tour") {
        setTotalPrice(formData.numberOfGuests * item.price);
      }
    }
  }, [formData.startDate, formData.endDate, formData.numberOfGuests, item, itemType]);

  const handleFileUpload = async (file, category, fieldName) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const response = await DataService.uploadImage(file, category);
      if (response.success) {
        setFormData(prev => ({ ...prev, [fieldName]: response.data.url }));
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      setError(`Failed to upload ${file.name}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };
  
  const nextStep = () => {
    setError("");
    if (step === 1 && itemType === "car" && (!formData.startDate || !formData.endDate || new Date(formData.endDate) <= new Date(formData.startDate))) {
      setError("Please select a valid date range.");
      return;
    }
    if (step === 2 && (!formData.firstName || !formData.lastName || !formData.email || !formData.governmentIdUrl)) {
      setError("Please fill all fields and upload your ID.");
      return;
    }
    if (step === 3 && !formData.agreedToTerms) {
      setError("You must agree to the Terms & Conditions.");
      return;
    }
    if (step === 5 && (!formData.paymentProofUrl || !formData.paymentReferenceNumber || !formData.amountPaid)) {
      setError("Please upload payment proof and fill in all payment details.");
      return;
    }
    if (step === 5) { // Final step before confirmation
        handleSubmitBooking();
    } else {
        setStep(s => s + 1);
    }
  };

  const prevStep = () => setStep(s => s - 1);
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmitBooking = async () => {
    setIsSubmitting(true);
    setError('');
    try {
        const response = await DataService.createBooking({ ...formData, itemType, itemId: item._id, totalPrice });
        if (response.success) {
            setStep(6);
        } else {
            throw new Error(response.message || 'Booking failed.');
        }
    } catch (err) {
        setError(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative max-h-[90vh] flex flex-col">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose}><X /></button>
        <div className="mb-4">
            <h2 className="text-xl font-bold">{item.title || `${item.brand} ${item.model}`}</h2>
            <p className="font-semibold text-lg text-blue-600">Total: ₱{totalPrice.toLocaleString()}</p>
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
            {step === 1 && (
                <div>
                    <h3 className="font-semibold mb-2">1. Select Dates & Guests</h3>
                    {itemType === 'car' && <>
                        <label>Start Date</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full border p-2 rounded mb-2"/>
                        <label>End Date</label><input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full border p-2 rounded mb-2"/>
                    </>}
                    <label>Guests</label><input type="number" name="numberOfGuests" value={formData.numberOfGuests} onChange={handleChange} min="1" className="w-full border p-2 rounded"/>
                </div>
            )}
            {step === 2 && (
                <div>
                    <h3 className="font-semibold mb-2">2. Personal Info & ID</h3>
                    <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="w-full border p-2 rounded mb-2"/>
                    <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="w-full border p-2 rounded mb-2"/>
                    <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded mb-2"/>
                    <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="w-full border p-2 rounded mb-2"/>
                    <label className="block mt-2">Upload Valid ID</label>
                    <input type="file" onChange={e => handleFileUpload(e.target.files[0], 'ids', 'governmentIdUrl')} className="w-full border p-2 rounded"/>
                    {formData.governmentIdUrl && <p className="text-green-600 text-sm mt-1">ID Uploaded!</p>}
                </div>
            )}
            {step === 3 && (
                <div>
                    <h3 className="font-semibold mb-2">3. Terms & Conditions</h3>
                    <div className="h-24 overflow-y-scroll border p-2 text-sm mb-2"><p>Summary of terms: By checking this box, you agree to our policies regarding cancellations, damages, and late returns...</p></div>
                    <label><input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleChange}/> I agree to the terms.</label>
                </div>
            )}
            {step === 4 && (
                <div>
                    <h3 className="font-semibold mb-2">4. Payment</h3>
                    <p>Please pay <strong>₱{totalPrice.toLocaleString()}</strong> via one of the methods below and proceed to the next step to upload proof.</p>
                    <img src="/qr-sample.png" alt="QR Code for Payment" className="mx-auto my-4 w-48 h-48"/>
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full border p-2 rounded">
                        <option value="gcash">GCash</option><option value="paymaya">PayMaya</option><option value="bank">Bank Transfer</option>
                    </select>
                </div>
            )}
            {step === 5 && (
                <div>
                    <h3 className="font-semibold mb-2">5. Upload Payment Proof</h3>
                    <input name="amountPaid" placeholder="Amount Paid" type="number" value={formData.amountPaid} onChange={handleChange} className="w-full border p-2 rounded mb-2"/>
                    <input name="paymentReferenceNumber" placeholder="Reference Number" value={formData.paymentReferenceNumber} onChange={handleChange} className="w-full border p-2 rounded mb-2"/>
                    <label>Upload Screenshot</label>
                    <input type="file" onChange={e => handleFileUpload(e.target.files[0], 'payments', 'paymentProofUrl')} className="w-full border p-2 rounded"/>
                    {formData.paymentProofUrl && <p className="text-green-600 text-sm mt-1">Proof Uploaded!</p>}
                </div>
            )}
            {step === 6 && (
                <div className="text-center p-8">
                    <CheckCircle className="mx-auto text-green-500 w-16 h-16 mb-4"/>
                    <h2 className="text-2xl font-semibold mb-2">Booking Submitted!</h2>
                    <p>Thank you! Our team will review your booking and payment. You'll receive a confirmation email shortly.</p>
                </div>
            )}
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {uploading && <p className="text-blue-600 text-sm mt-2">Uploading file...</p>}
        <div className="mt-4 flex justify-between pt-4 border-t">
            {step > 1 && step < 6 && <button onClick={prevStep} className="px-4 py-2 bg-gray-200 rounded">Back</button>}
            {step < 5 && <button onClick={nextStep} disabled={uploading} className="ml-auto px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">Next</button>}
            {step === 5 && <button onClick={nextStep} disabled={uploading || isSubmitting} className="ml-auto px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400">{isSubmitting ? 'Submitting...' : 'Submit Booking'}</button>}
            {step === 6 && <button onClick={onClose} className="w-full px-4 py-2 bg-blue-600 text-white rounded">Close</button>}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;