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
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  if (!emailUser || !emailPassword || 
      emailUser === "YOUR_EMAIL_HERE" || 
      emailPassword === "YOUR_APP_PASSWORD_HERE") {
    console.warn('Email credentials not configured or using placeholder values. Using ethereal.email for testing.');

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
      user: emailUser,
      pass: emailPassword, // This should be an app password for Gmail
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
  // Validate inputs
  if (!to || !subject || !html) {
    console.error('Missing required email parameters');
    return { 
      success: false, 
      error: 'Missing required email parameters (to, subject, or html)' 
    };
  }
  
  try {
    // Get transporter (may be a Promise if using test account)
    const transporter = await createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER && process.env.EMAIL_USER !== "YOUR_EMAIL_HERE"
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
      code: error.code,
      // Don't include stack trace in production
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

  // Format WhatsApp link section with improved UI
  const whatsappHTML = whatsappLink ? `
    <div style="background-color: #dcfce7; padding: 24px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border-left: 4px solid #10b981;">
      <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600;">📱 Join WhatsApp Group</h3>
      <p style="margin: 16px 0 0; color: #374151; line-height: 1.6;">
        Please join the WhatsApp group for important updates, announcements, and to connect with other participants:
      </p>
      <p style="margin: 16px 0 0; text-align: center;">
        <a href="${whatsappLink}" target="_blank" style="display: inline-block; background-color: #25D366; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin-top: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); transition: all 0.3s ease;">
          <span style="display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-right: 8px;">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Join WhatsApp Group
          </span>
        </a>
      </p>
    </div>
  ` : '';

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
        <div style="text-align: center; margin-bottom: 24px; padding: 20px; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 0.5px;">Techelons-25</h1>
          <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">Shivaji College, University of Delhi</p>
        </div>
        
        <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background-color: #ecfdf5; padding: 12px 24px; border-radius: 50px;">
              <h2 style="margin: 0; color: #10b981; font-size: 22px; font-weight: 600;">Registration Confirmed</h2>
            </div>
          </div>
          
          <p style="margin-bottom: 24px; color: #374151; font-size: 16px; line-height: 1.6;">
            Hello <span style="font-weight: 600; color: #4f46e5;">{{NAME}}</span>,
          </p>
          
          <p style="margin-bottom: 24px; color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for registering for <span style="font-weight: 600; color: #4f46e5;">${eventDetails.name || 'Techelons-25'}</span>! Your registration has been confirmed.
          </p>
          
          <div style="background-color: #f3f4f6; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
            <h3 style="margin-top: 0; color: #111827; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
              <span style="background-color: #4f46e5; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 14px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </span>
              Event Details
            </h3>
            
            <div style="margin-top: 16px; color: #374151;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">🎯 Event:</span>
                <span style="font-weight: 500;">${eventDetails.name || 'Techelons-25'}</span>
              </div>
              
              ${category ? `
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">🏷️ Category:</span>
                <span>${category}</span>
              </div>
              ` : ''}
              
              ${teamSize ? `
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">👥 Team Size:</span>
                <span>${teamSize}</span>
              </div>
              ` : ''}
              
              ${festDayInfo}
              
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">📅 Date:</span>
                <span>${formattedDate}${dayOfWeek ? ` <span style="color: #6b7280; font-size: 14px;">(${dayOfWeek})</span>` : ''}</span>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">⏰ Time:</span>
                <span>${formattedTime}</span>
              </div>
              
              <div style="display: flex; align-items: flex-start; margin-bottom: 0;">
                <span style="color: #4f46e5; font-weight: 500; min-width: 100px;">📍 Venue:</span>
                <span>${eventDetails.venue || 'To be announced'}</span>
              </div>
            </div>
          </div>
          
          ${whatsappHTML}
          
          ${descriptionHTML}
          ${instructionsHTML}
          ${rulesHTML}
          ${prizesHTML}
          ${resourcesHTML}
          ${coordinatorsHTML}
          
          <div style="margin-top: 32px; padding: 24px; border-radius: 12px; background-color: #f3f4f6; text-align: center;">
            <p style="margin: 0; color: #4b5563; font-size: 16px; font-weight: 500;">
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

    // If whatsappLink is not provided, try to get it from the event data
    if (!whatsappLink) {
      try {
        const { getWhatsAppGroupLink } = require('../_data/techelonsEventsData');
        whatsappLink = getWhatsAppGroupLink(event);
      } catch (error) {
        console.warn('Could not fetch WhatsApp group link:', error.message);
      }
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
