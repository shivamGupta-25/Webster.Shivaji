import nodemailer from 'nodemailer';

// Create a transporter with environment variables
const createTransporter = () => {
    // Check for required environment variables
    const user = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASSWORD;
    
    if (!user || !password) {
        throw new Error('Missing email credentials. Please check your environment variables.');
    }
    
    // For production, use environment variables
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user,
            pass: password,
        },
    });
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
        const transporter = createTransporter();

        const mailOptions = {
            from: `"Websters - Shivaji College" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text version if not provided
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { 
            success: false, 
            error: error.message,
            // Don't include stack trace in production
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
    }
};

/**
 * Send a workshop registration confirmation email
 * @param {Object} options - Registration details
 * @param {string} options.email - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Email HTML template
 * @returns {Promise<Object>} - Email sending result
 */
export const sendWorkshopConfirmation = async ({ email, name, subject, template }) => {
    if (!email || !name || !subject || !template) {
        return {
            success: false,
            error: 'Missing required parameters for workshop confirmation email'
        };
    }
    
    return sendEmail({
        to: email,
        subject,
        html: template,
    });
};