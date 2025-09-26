import DataService from './services/DataService.jsx';
import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Users,
  Upload,
  AlertCircle,
  CheckCircle,
  CreditCard,
  FileText,
} from "lucide-react";

const BookingModal = ({ isOpen, onClose, item, itemType }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    numberOfGuests: 1,
    startDate: "",
    endDate: "",
    validId: null,
    agreedToTerms: false,
    paymentMethod: "",
    paymentProof: null,
    referenceNumber: "",
    amountPaid: "",
  });
  const [totalPrice, setTotalPrice] = useState(0);
  const [validationError, setValidationError] = useState("");

  // ✅ Calculate total price
  useEffect(() => {
    if (item) {
      if (itemType === "car" && formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (days > 0) setTotalPrice(days * item.pricePerDay);
      } else if (itemType === "tour") {
        setTotalPrice(formData.numberOfGuests * item.price);
      } else if (itemType === "package") {
        setTotalPrice(item.price);
      }
    }
  }, [formData.startDate, formData.endDate, formData.numberOfGuests, item, itemType]);

  // ✅ Validation
  const nextStep = () => {
    setValidationError("");

    if (step === 1) {
      if (itemType === "car" && formData.numberOfGuests > item.capacity) {
        setValidationError(`This car can only seat ${item.capacity} passengers.`);
        return;
      }
      if (itemType === "tour" && formData.numberOfGuests > item.maxGuests) {
        setValidationError(`This tour allows max ${item.maxGuests} participants.`);
        return;
      }
      if (itemType === "car" && (!formData.startDate || !formData.endDate)) {
        setValidationError("Please select start and end dates.");
        return;
      }
    }

    if (step === 2) {
      if (!formData.name || !formData.email || !formData.phone) {
        setValidationError("Please fill in all personal details.");
        return;
      }
      if (!formData.validId) {
        setValidationError("Please upload a valid ID.");
        return;
      }
    }

    if (step === 3 && !formData.agreedToTerms) {
      setValidationError("You must agree to the Terms & Conditions.");
      return;
    }

    if (step === 4 && !formData.paymentMethod) {
      setValidationError("Please select a payment method.");
      return;
    }

    if (step === 5) {
      if (!formData.paymentProof || !formData.referenceNumber || !formData.amountPaid) {
        setValidationError("Please upload payment proof, reference number, and amount.");
        return;
      }
    }

    setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
          ? files[0]
          : value,
    }));
  };

  if (!isOpen || !item) return null;

  const renderStep = () => {
    switch (step) {
      case 1: // Select Package/Car/Tour
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="mr-2" /> Select {itemType}
            </h2>
            {itemType === "car" && (
              <>
                <label>Start Date:</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="border p-2 rounded w-full mb-2"
                />
                <label>End Date:</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="border p-2 rounded w-full mb-2"
                />
              </>
            )}
            {itemType === "tour" && (
              <div className="flex items-center">
                <Users className="mr-2" />
                <input
                  type="number"
                  name="numberOfGuests"
                  min="1"
                  value={formData.numberOfGuests}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            )}
          </div>
        );
      case 2: // Personal Info + Valid ID
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="border p-2 rounded w-full mb-2"
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="border p-2 rounded w-full mb-2"
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="border p-2 rounded w-full mb-2"
            />
            <label className="block mb-2">Upload Valid ID:</label>
            <input
              type="file"
              name="validId"
              accept="image/*,application/pdf"
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>
        );
      case 3: // Terms & Conditions
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <AlertCircle className="mr-2" /> Terms & Conditions
            </h2>
            <div className="h-32 overflow-y-scroll border p-2 mb-2 text-sm">
              <p>
                By booking this {itemType}, you agree to our policies regarding
                cancellations, reschedules, and responsibilities.
              </p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onChange={handleChange}
                className="mr-2"
              />
              I agree to the Terms & Conditions
            </label>
          </div>
        );
      case 4: // Payment via QR
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CreditCard className="mr-2" /> Payment
            </h2>
            <p className="mb-2">Please scan the QR code to pay:</p>
            <img
              src="/qr-sample.png"
              alt="QR Code"
              className="mx-auto mb-4 w-40 h-40"
            />
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            >
              <option value="">Select Payment Method</option>
              <option value="gcash">GCash</option>
              <option value="paymaya">PayMaya</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
        );
      case 5: // Upload Payment Proof
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Upload className="mr-2" /> Upload Payment Proof
            </h2>
            <input
              type="file"
              name="paymentProof"
              accept="image/*,application/pdf"
              onChange={handleChange}
              className="border p-2 rounded w-full mb-2"
            />
            <input
              type="text"
              name="referenceNumber"
              placeholder="Reference Number"
              value={formData.referenceNumber}
              onChange={handleChange}
              className="border p-2 rounded w-full mb-2"
            />
            <input
              type="number"
              name="amountPaid"
              placeholder="Amount Paid"
              value={formData.amountPaid}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
            <p className="mt-2 font-bold">
              Total Price: ₱{totalPrice.toLocaleString()}
            </p>
          </div>
        );
      case 6: // Confirmation
        return (
          <div className="text-center">
            <CheckCircle className="mx-auto text-green-500 w-12 h-12 mb-2" />
            <h2 className="text-xl font-semibold mb-2">Booking Submitted!</h2>
            <p className="mb-2">We will verify your payment and confirm shortly.</p>
            <p className="font-bold">
              Total Paid: ₱{formData.amountPaid || totalPrice.toLocaleString()}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
          onClick={onClose}
        >
          <X />
        </button>
        {renderStep()}
        {validationError && (
          <p className="text-red-500 text-sm mt-2">{validationError}</p>
        )}
        <div className="mt-4 flex justify-between">
          {step > 1 && step < 6 && (
            <button
              onClick={prevStep}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Back
            </button>
          )}
          {step < 6 && (
            <button
              onClick={nextStep}
              className="ml-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
