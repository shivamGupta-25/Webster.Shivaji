import nodemailer from 'nodemailer';
import { getEventById, getWhatsAppGroupLink, formatEventDateTime } from '@/app/_data/techelonsEventsData';

// Singleton transporter instance
let cachedTransporter = null;
let lastTransporterCreationTime = null;
const TRANSPORTER_TTL = 30 * 60 * 1000; // 30 minutes

// Create a transporter with environment variables
const createTransporter = async () => {
  // Check if we have a valid cached transporter
  const now = Date.now();
  if (cachedTransporter && lastTransporterCreationTime && (now - lastTransporterCreationTime < TRANSPORTER_TTL)) {
    return cachedTransporter;
  }

  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Using ethereal.email for testing.');

    // Create a test account at ethereal.email for development/testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      cachedTransporter = testTransporter;
      lastTransporterCreationTime = now;
      return testTransporter;
    } catch (error) {
      console.error('Failed to create test email account:', error);
      throw error;
    }
  }

  // Create Gmail-specific transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',  // Use Gmail service instead of custom host/port
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // This should be an app password for Gmail
    },
    tls: {
      rejectUnauthorized: false // Helps with self-signed certificates
    },
    pool: true, // Use connection pooling
    maxConnections: 5, // Maximum number of connections to make
    maxMessages: 100, // Maximum number of messages to send per connection
    rateDelta: 1000, // Define minimum amount of milliseconds between messages
    rateLimit: 5 // Maximum number of messages per rateDelta
  });

  // Verify the transporter configuration
  try {
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          reject(error);
        } else {
          resolve(success);
        }
      });
    });
    
    cachedTransporter = transporter;
    lastTransporterCreationTime = now;
    return transporter;
  } catch (error) {
    console.error('Transporter verification failed:', error);
    throw error;
  }
};

/**
 * Send an email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.text] - Plain text version (optional)
 * @returns {Promise<Object>} - Nodemailer response
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Get transporter (may be a Promise if using test account)
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER
        ? `"Websters - Shivaji College" <${process.env.EMAIL_USER}>`
        : '"Websters - Test" <websters@shivaji.du.ac.in>',
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text version if not provided
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // If using ethereal.email, log the preview URL
    if (info.messageId && info.messageId.includes('ethereal')) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Email preview URL:', previewUrl);
      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
        testMode: true
      };
    }

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending email to', to, ':', error);

    // Provide more detailed error information
    let errorDetails = 'Unknown error';

    if (error.code === 'EAUTH') {
      errorDetails = 'Authentication failed. Check email username and password in .env file.';
    } else if (error.code === 'ESOCKET') {
      errorDetails = 'Socket connection error. Check email host and port settings.';
    } else if (error.code === 'ECONNECTION') {
      errorDetails = 'Connection error. Check network and email server settings.';
    } else if (error.responseCode) {
      errorDetails = `SMTP response code: ${error.responseCode}, message: ${error.response}`;
    }

    return {
      success: false,
      error: error.message,
      details: errorDetails,
      code: error.code
    };
  }
};

// Cache for email templates to avoid regenerating them
const templateCache = new Map();
const TEMPLATE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Generate HTML email template for Techelons event confirmation
 * @param {Object} options - Template options
 * @param {string} options.name - Participant name
 * @param {Object} options.eventDetails - Event details
 * @param {string} options.whatsappLink - WhatsApp group link
 * @returns {string} - HTML email template
 */
export const generateEmailTemplate = ({ name, eventDetails, whatsappLink }) => {
  // Create a cache key based on the input parameters
  const cacheKey = `${eventDetails?.id || 'unknown'}_${!!whatsappLink}`;
  
  // Check if we have a cached template
  const cachedTemplate = templateCache.get(cacheKey);
  if (cachedTemplate && (Date.now() - cachedTemplate.timestamp < TEMPLATE_CACHE_TTL)) {
    // Replace the personalized parts
    return cachedTemplate.template
      .replace(/{{NAME}}/g, name || 'Participant');
  }
  
  // Get formatted event date and time from the utility function
  let formattedDate = "To be announced";
  let formattedTime = "To be announced";
  let dayOfWeek = "";

  try {
    // Use formatEventDateTime if available
    const eventDateTime = formatEventDateTime(eventDetails);
    formattedDate = eventDateTime.formattedDate;
    formattedTime = eventDateTime.formattedTime;
    dayOfWeek = eventDateTime.dayOfWeek;
  } catch (error) {
    console.error("Error formatting event date/time:", error);
    // Fallback to basic formatting if formatEventDateTime fails
    formattedDate = eventDetails?.date || "To be announced";
    formattedTime = eventDetails?.time || "To be announced";
  }

  // Format prizes if available and not empty
  const prizesHTML = eventDetails.prizes && Array.isArray(eventDetails.prizes) && eventDetails.prizes.length > 0
    ? `
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">🏆 Prizes</h3>
        <ul style="margin: 16px 0 0; padding-left: 20px; color: #374151;">
          ${eventDetails.prizes.map(prize =>
      `<li style="margin-bottom: 10px;"><span style="font-weight: 600; color: #10b981;">${prize.position}:</span> ${prize.reward}</li>`
    ).join('')}
        </ul>
      </div>
    `
    : '';

  // Format rules if available and not empty
  const rulesHTML = eventDetails.rules && Array.isArray(eventDetails.rules) && eventDetails.rules.length > 0
    ? `
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #ef4444;">
        <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">📋 Event Rules</h3>
        <ul style="margin: 16px 0 0; padding-left: 20px; color: #374151;">
          ${eventDetails.rules.map(rule =>
      `<li style="margin-bottom: 10px;">${rule}</li>`
    ).join('')}
        </ul>
      </div>
    `
    : '';

  // Format coordinators if available and not empty
  const coordinatorsHTML = eventDetails.coordinators && Array.isArray(eventDetails.coordinators) && eventDetails.coordinators.length > 0
    ? `
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #3b82f6;">
        <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">👥 Event Coordinators</h3>
        <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          ${eventDetails.coordinators.map(coordinator =>
      `<div style="margin-bottom: 16px; display: flex; align-items: center;">
              <div style="background-color: #f3f4f6; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                <span style="font-weight: bold; color: #3b82f6;">${coordinator.name.charAt(0)}</span>
              </div>
              <div>
                <p style="margin: 0; font-weight: 600; color: #111827;">${coordinator.name}</p>
                ${coordinator.email ? `<p style="margin: 4px 0 0;">📧 <a href="mailto:${coordinator.email}" style="color: #4f46e5; text-decoration: none;">${coordinator.email}</a></p>` : ''}
                ${coordinator.phone ? `<p style="margin: 4px 0 0;">📱 <a href="tel:${coordinator.phone}" style="color: #4f46e5; text-decoration: none;">${coordinator.phone}</a></p>` : ''}
              </div>
            </div>`
    ).join('')}
        </div>
      </div>
    `
    : '';

  // Format special instructions if available and not null/empty
  const instructionsHTML = eventDetails.instructions && eventDetails.instructions !== "TBA" && eventDetails.instructions !== "null"
    ? `
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #f59e0b;">
        <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">ℹ️ Special Instructions</h3>
        <p style="margin: 16px 0 0; color: #374151; line-height: 1.6;">${eventDetails.instructions}</p>
      </div>
    `
    : '';

  // Format resources if available and not null/empty
  const resourcesHTML = eventDetails.resources && eventDetails.resources !== "TBA" && eventDetails.resources !== "null"
    ? `
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #8b5cf6;">
        <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">📚 Recommended Resources</h3>
        <p style="margin: 16px 0 0; color: #374151; line-height: 1.6;">${eventDetails.resources}</p>
      </div>
    `
    : '';

  // Format description if available and not null/empty
  const descriptionHTML = eventDetails.description && eventDetails.description !== "TBA" && eventDetails.description !== "null"
    ? `
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #6366f1;">
        <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">📝 About the Event</h3>
        <p style="margin: 16px 0 0; color: #374151; line-height: 1.6;">${eventDetails.description}</p>
      </div>
    `
    : '';

  // Format category if available
  const category = eventDetails.category
    ? eventDetails.category.charAt(0).toUpperCase() + eventDetails.category.slice(1)
    : null;

  // Format team size if available
  const teamSize = eventDetails.teamSize
    ? (eventDetails.teamSize.min === eventDetails.teamSize.max
      ? `${eventDetails.teamSize.min} ${eventDetails.teamSize.min === 1 ? 'person' : 'people'}`
      : `${eventDetails.teamSize.min}-${eventDetails.teamSize.max} people`)
    : null;

  // Format fest day information
  const festDayInfo = eventDetails.festDay
    ? `<div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
        <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">📅 Fest Day:</span>
        <span>${eventDetails.festDay === 'day1' ? 'Day 1' : 'Day 2'}</span>
      </div>`
    : '';

  // Create the template with a placeholder for the name
  const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Techelons-25 Registration Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; color: #111827;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 700;">Techelons-25</h1>
          <p style="margin: 8px 0 0; color: #6b7280; font-size: 16px;">Shivaji College, University of Delhi</p>
        </div>
        
        <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <h2 style="margin-top: 0; margin-bottom: 24px; color: #111827; font-size: 24px; font-weight: 600; text-align: center;">Registration Confirmation</h2>
          
          <p style="margin-bottom: 24px; color: #374151; font-size: 16px; line-height: 1.6;">
            Hello <span style="font-weight: 600; color: #4f46e5;">{{NAME}}</span>,
          </p>
          
          <p style="margin-bottom: 24px; color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for registering for <span style="font-weight: 600; color: #4f46e5;">${eventDetails.name || 'Techelons-25'}</span>! Your registration has been confirmed.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">Event Details</h3>
            
            <div style="margin-top: 16px; color: #374151;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">🎯 Event:</span>
                <span>${eventDetails.name || 'Techelons-25'}</span>
              </div>
              
              ${category ? `
              <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">🏷️ Category:</span>
                <span>${category}</span>
              </div>
              ` : ''}
              
              ${teamSize ? `
              <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">👥 Team Size:</span>
                <span>${teamSize}</span>
              </div>
              ` : ''}
              
              ${festDayInfo}
              
              <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">📅 Date:</span>
                <span>${formattedDate}${dayOfWeek ? ` (${dayOfWeek})` : ''}</span>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">⏰ Time:</span>
                <span>${formattedTime}</span>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">📍 Venue:</span>
                <span>${eventDetails.venue || 'To be announced'}</span>
              </div>
            </div>
          </div>
          
          ${whatsappLink ? `
          <div style="background-color: #dcfce7; padding: 24px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">📱 Join WhatsApp Group</h3>
            <p style="margin: 16px 0 0; color: #374151; line-height: 1.6;">
              Please join the WhatsApp group for important updates and announcements:
            </p>
            <p style="margin: 16px 0 0; text-align: center;">
              <a href="${whatsappLink}" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin-top: 8px;">Join WhatsApp Group</a>
            </p>
          </div>
          ` : ''}
          
          ${descriptionHTML}
          ${instructionsHTML}
          ${rulesHTML}
          ${prizesHTML}
          ${resourcesHTML}
          ${coordinatorsHTML}
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              We look forward to seeing you at the event!
            </p>
            <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
              For any queries, please contact the event coordinators.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 24px; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">
            This is an automated email. Please do not reply to this email.
          </p>
          <p style="margin: 8px 0 0;">
            &copy; 2025 Techelons-25, Shivaji College, University of Delhi
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Cache the template
  templateCache.set(cacheKey, {
    template,
    timestamp: Date.now()
  });
  
  // Replace the personalized parts
  return template.replace(/{{NAME}}/g, name || 'Participant');
};

/**
 * Send a confirmation email for Techelons event registration
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.event - Event ID
 * @param {string} options.eventDate - Event date
 * @param {string} options.eventTime - Event time
 * @param {string} options.eventVenue - Event venue
 * @param {string} options.whatsappLink - WhatsApp group link
 * @param {boolean} options.isTeamMember - Whether the recipient is a team member
 * @param {string} options.teamLeader - Team leader name (if recipient is a team member)
 * @returns {Promise<Object>} - Email sending result
 */
export const sendTechelonsConfirmation = async ({
  to,
  name,
  event,
  eventDate,
  eventTime,
  eventVenue,
  whatsappLink,
  isTeamMember = false,
  teamLeader
}) => {
  try {
    // Validate required parameters
    if (!to || !name || !event) {
      throw new Error('Missing required parameters for sending confirmation email');
    }

    // Get event details
    const eventDetails = getEventById(event);
    if (!eventDetails) {
      throw new Error(`Event details not found for event ID: ${event}`);
    }

    // Generate email subject
    let subject = `Registration Confirmed: ${eventDetails.name} | Techelons-25`;
    if (isTeamMember) {
      subject = `Team Registration Confirmed: ${eventDetails.name} | Techelons-25`;
    }

    // Generate email content
    const emailContent = generateEmailTemplate({
      name,
      eventDetails: {
        ...eventDetails,
        date: eventDate || eventDetails.date,
        time: eventTime || eventDetails.time,
        venue: eventVenue || eventDetails.venue
      },
      whatsappLink
    });

    // Add team member specific content if applicable
    let finalEmailContent = emailContent;
    if (isTeamMember && teamLeader) {
      // Insert team member specific message after the greeting
      finalEmailContent = emailContent.replace(
        `Thank you for registering for <span style="font-weight: 600; color: #4f46e5;">${eventDetails.name || 'Techelons-25'}</span>! Your registration has been confirmed.`,
        `You have been registered as a team member for <span style="font-weight: 600; color: #4f46e5;">${eventDetails.name || 'Techelons-25'}</span> by <span style="font-weight: 600; color: #4f46e5;">${teamLeader}</span>. Your team registration has been confirmed.`
      );
    }

    // Send the email
    return await sendEmail({
      to,
      subject,
      html: finalEmailContent
    });
  } catch (error) {
    console.error('Error sending Techelons confirmation email:', error);
    return {
      success: false,
      error: error.message,
      details: error.stack
    };
  }
};
