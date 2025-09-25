import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendBookingConfirmation(booking) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.guestInfo.email,
        subject: `DoRayd Booking Confirmation - ${booking.bookingReference}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Booking Confirmation</h2>
            <p>Dear ${booking.guestInfo.firstName} ${booking.guestInfo.lastName},</p>
            <p>Thank you for booking with DoRayd Travel & Tours! Your booking has been confirmed.</p>
            
            <div style="background: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3>Booking Details:</h3>
              <p><strong>Reference:</strong> ${booking.bookingReference}</p>
              <p><strong>Type:</strong> ${booking.itemType === 'car' ? 'Car Rental' : 'Tour Package'}</p>
              <p><strong>Date:</strong> ${booking.startDate.toDateString()}</p>
              <p><strong>Guests:</strong> ${booking.numberOfGuests}</p>
              <p><strong>Total Amount:</strong> ₱${booking.totalPrice.toLocaleString()}</p>
              <p><strong>Status:</strong> ${booking.status}</p>
            </div>
            
            <p>We will contact you soon with further details.</p>
            <p>For any questions, please contact us at info@dorayd.com or +63 917 123 4567.</p>
            
            <p>Best regards,<br>DoRayd Travel & Tours Team</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              This email was sent on ${new Date().toISOString()}<br>
              DoRayd Travel & Tours - Your gateway to Philippine adventures
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Booking confirmation email sent to ${booking.guestInfo.email}`);
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  async sendStatusUpdate(booking, newStatus) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.guestInfo.email,
        subject: `DoRayd Booking Update - ${booking.bookingReference}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Booking Status Update</h2>
            <p>Dear ${booking.guestInfo.firstName} ${booking.guestInfo.lastName},</p>
            <p>Your booking status has been updated.</p>
            
            <div style="background: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
              <p><strong>New Status:</strong> <span style="color: #16a34a; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
            </div>
            
            <p>For any questions, please contact us at info@dorayd.com or +63 917 123 4567.</p>
            
            <p>Best regards,<br>DoRayd Travel & Tours Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Status update email sent to ${booking.guestInfo.email}`);
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  async sendContactReply(message, reply) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: message.email,
        subject: `Re: ${message.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">DoRayd Customer Support</h2>
            <p>Dear ${message.name},</p>
            <p>Thank you for contacting DoRayd Travel & Tours. Here's our response to your inquiry:</p>
            
            <div style="background: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <p><strong>Your Message:</strong></p>
              <p style="font-style: italic;">"${message.message}"</p>
              
              <hr style="margin: 20px 0;">
              
              <p><strong>Our Response:</strong></p>
              <p>${reply}</p>
            </div>
            
            <p>If you have any additional questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>DoRayd Customer Support Team</p>
            <p>Email: info@dorayd.com | Phone: +63 917 123 4567</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Contact reply sent to ${message.email}`);
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }
}

export default new EmailService();