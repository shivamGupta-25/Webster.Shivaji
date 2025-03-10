import nodemailer from 'nodemailer';

// Cache the transporter to avoid creating a new one for each email
let cachedTransporter = null;
let transporterCreatedAt = 0;
const TRANSPORTER_TTL = 30 * 60 * 1000; // 30 minutes

// Create a transporter with environment variables
const createTransporter = async () => {
    // Check if we have a valid cached transporter
    const now = Date.now();
    if (cachedTransporter && now - transporterCreatedAt < TRANSPORTER_TTL) {
        return cachedTransporter;
    }
    
    // Check for required environment variables
    const user = process.env.EMAIL_USER;
    const password = process.env.EMAIL_PASSWORD;
    
    if (!user || !password || user === "YOUR_EMAIL_HERE" || password === "YOUR_APP_PASSWORD_HERE") {
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
            transporterCreatedAt = now;
            return testTransporter;
        } catch (error) {
            console.error('Failed to create test email account:', error);
            throw error;
        }
    }
    
    // For production, use environment variables
    cachedTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user,
            pass: password,
        },
        // Add connection pool settings
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        // Add timeout settings
        connectionTimeout: 10000, // 10 seconds
        socketTimeout: 20000, // 20 seconds
    });
    
    transporterCreatedAt = now;
    return cachedTransporter;
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
        const transporter = await createTransporter();

        const mailOptions = {
            from: `"Websters - Shivaji College" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text version if not provided
            // Add priority and importance headers
            priority: 'high',
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'high'
            }
        };

        // Set a timeout for the email sending operation
        const emailPromise = transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Email sending timed out')), 30000) // 30 seconds timeout
        );
        
        // Race the email sending against the timeout
        const info = await Promise.race([emailPromise, timeoutPromise]);
        
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error.message);
        
        return { 
            success: false, 
            error: error.message,
            code: error.code
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