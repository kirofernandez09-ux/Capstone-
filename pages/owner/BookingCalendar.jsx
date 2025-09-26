import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import DataService from '../../components/services/DataService';
import { useSocket } from '../../hooks/useSocket';

const BookingCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { connected } = useSocket();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await DataService.fetchAllBookings();
      if (response.success) {
        const formattedEvents = response.data.map(booking => ({
          id: booking._id,
          title: `${booking.bookingReference} - ${booking.firstName}`,
          start: new Date(booking.startDate),
          end: booking.endDate ? new Date(booking.endDate) : new Date(new Date(booking.startDate).getTime() + 2 * 60 * 60 * 1000), // Add a default duration for tours
          backgroundColor: getStatusColor(booking.status),
          borderColor: getStatusColor(booking.status),
          extendedProps: {
            item: booking.itemType,
            status: booking.status,
            customer: `${booking.firstName} ${booking.lastName}`
          }
        }));
        setEvents(formattedEvents);
      } else {
        throw new Error(response.message || "Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Failed to fetch bookings for calendar:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    // Note: If your useSocket hook provides the socket instance, you can listen for real-time updates here.
  }, [fetchBookings]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';   // Amber 500
      case 'confirmed': return '#10b981'; // Emerald 500
      case 'cancelled': return '#6b7280'; // Gray 500
      case 'completed': return '#3b82f6'; // Blue 500
      case 'rejected': return '#ef4444';  // Red 500
      default: return '#6b7280';
    }
  };

  if (loading) return <div className="text-center p-8">Loading Calendar...</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border">
      <div className="text-sm text-gray-500 mb-2">
        Socket Status: {connected ? <span className="text-green-500 font-semibold">Connected</span> : <span className="text-red-500 font-semibold">Disconnected</span>}
      </div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        editable={false}
        selectable={true}
        dayMaxEvents={true}
        eventDisplay="block"
      />
    </div>
  );
};

export default BookingCalendar;