import React, { useState, useEffect } from 'react';

const CalendarBooking = ({ serviceId, serviceType, onBookingSelect }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);

  useEffect(() => {
    fetchAvailability();
  }, [serviceId]);

  const fetchAvailability = async () => {
    try {
      const response = await fetch(`/api/bookings/availability/${serviceId}`);
      const data = await response.json();
      setBookedDates(data.bookedDates);
      setAvailableSlots(data.availableSlots);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const isDateBooked = (date) => {
    return bookedDates.some(bookedDate => 
      new Date(bookedDate).toDateString() === date.toDateString()
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Select Date & Time</h3>
      
      {/* Calendar Component */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {/* Calendar implementation */}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Available Times:</h4>
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                className="p-2 border rounded hover:bg-blue-50"
                onClick={() => onBookingSelect({ date: selectedDate, time: slot })}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarBooking;