import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';
import { sendWorkshopConfirmation } from '@/app/_utils/emailServiceWorkshop';
import workshopData from '@/app/_data/workshopData';

// Scopes and environment variables
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_SHEET_ID_WORKSHOP = process.env.GOOGLE_SHEET_ID_WORKSHOP;

// Validate environment variables early
const validateEnvironmentVars = () => {
    const missingVars = [];
    
    if (!GOOGLE_PRIVATE_KEY || GOOGLE_PRIVATE_KEY === "YOUR_PRIVATE_KEY_HERE") {
        missingVars.push('GOOGLE_PRIVATE_KEY');
    }
    
    if (!GOOGLE_CLIENT_EMAIL || GOOGLE_CLIENT_EMAIL === "YOUR_CLIENT_EMAIL_HERE") {
        missingVars.push('GOOGLE_CLIENT_EMAIL');
    }
    
    if (!GOOGLE_SHEET_ID_WORKSHOP) {
        missingVars.push('GOOGLE_SHEET_ID_WORKSHOP');
    }
    
    if (missingVars.length > 0) {
        const error = new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        error.type = ERROR_TYPES.MISSING_CREDENTIALS;
        throw error;
    }
};

// Error types
const ERROR_TYPES = {
    MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',
    MISSING_SHEET_ID: 'MISSING_SHEET_ID',
    AUTH_FAILED: 'AUTH_FAILED',
    MISSING_FIELDS: 'MISSING_FIELDS',
    DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
    DUPLICATE_PHONE: 'DUPLICATE_PHONE',
    SHEETS_API_ERROR: 'SHEETS_API_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    INVALID_JSON: 'INVALID_JSON',
    EMAIL_FAILED: 'EMAIL_FAILED'
};

// Simple cache for recent registrations - using Map for better performance
const registrationCache = {
    emails: new Map(), // Using Map instead of Set for O(1) lookups
    phones: new Map(),
    lastRefreshed: 0,
    TTL: 5 * 60 * 1000, // 5 minutes

    needsRefresh() {
        return Date.now() - this.lastRefreshed > this.TTL || this.emails.size === 0;
    },

    reset() {
        this.emails.clear();
        this.phones.clear();
        this.lastRefreshed = Date.now();
    },

    add(email, phone) {
        this.emails.set(email.toLowerCase(), true);
        this.phones.set(phone, true);
    },

    has(email, phone) {
        return this.emails.has(email.toLowerCase()) || this.phones.has(phone);
    }
};

// Auth client with caching
let authClient = null;
let authClientExpiry = 0;

const getAuthToken = async () => {
    // Validate environment variables
    validateEnvironmentVars();

    // Return existing client if still valid (with 5-minute buffer)
    const now = Date.now();
    if (authClient && authClientExpiry > now + 300000) {
        return authClient;
    }

    try {
        const client = new JWT({
            email: GOOGLE_CLIENT_EMAIL,
            key: GOOGLE_PRIVATE_KEY,
            scopes: SCOPES,
        });

        await client.authorize();
        authClient = client;

        // Set expiry time if available, otherwise default to 1 hour
        authClientExpiry = client.credentials?.expiry_date || (now + 3600000);

        return client;
    } catch (error) {
        console.error('Auth error:', error.message);
        const authError = new Error('Authentication failed with Google API');
        authError.type = ERROR_TYPES.AUTH_FAILED;
        authError.cause = error;
        throw authError;
    }
};

// Cached sheets instance
let sheetsInstance = null;
const getSheets = async () => {
    const client = await getAuthToken();
    if (!sheetsInstance) {
        sheetsInstance = google.sheets({ version: 'v4', auth: client });
    } else {
        // Update auth if needed
        sheetsInstance.context._options.auth = client;
    }
    return sheetsInstance;
};

const checkDuplicateRegistration = async (sheets, data) => {
    const email = data.email.toLowerCase();
    const phone = data.phone;

    // Quick check in local cache first
    if (registrationCache.has(email, phone)) {
        if (registrationCache.emails.has(email)) {
            const error = new Error('You have already registered with this email');
            error.type = ERROR_TYPES.DUPLICATE_EMAIL;
            return error;
        }

        if (registrationCache.phones.has(phone)) {
            const error = new Error('This phone number is already registered');
            error.type = ERROR_TYPES.DUPLICATE_PHONE;
            return error;
        }
    }

    // Refresh cache if needed
    if (registrationCache.needsRefresh()) {
        try {
            registrationCache.reset();

            // Use batch get to improve performance
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: GOOGLE_SHEET_ID_WORKSHOP,
                range: 'Sheet1!B:G', // Only get email and phone columns
                valueRenderOption: 'UNFORMATTED_VALUE',
                majorDimension: 'ROWS',
            });

            const rows = response.data.values || [];

            // Skip header row and process data
            for (let i = 1; i < rows.length; i++) {
                if (!rows[i] || !rows[i][0]) continue;

                const rowEmail = rows[i][0]?.toLowerCase();
                const rowPhone = rows[i][5];

                if (rowEmail) registrationCache.emails.set(rowEmail, true);
                if (rowPhone) registrationCache.phones.set(rowPhone, true);

                if (rowEmail === email) {
                    const error = new Error('You have already registered with this email');
                    error.type = ERROR_TYPES.DUPLICATE_EMAIL;
                    return error;
                }

                if (rowPhone && rowPhone === phone) {
                    const error = new Error('This phone number is already registered');
                    error.type = ERROR_TYPES.DUPLICATE_PHONE;
                    return error;
                }
            }
        } catch (error) {
            console.error('Duplicate check error:', error.message);
            throw new Error('Failed to check registration status');
        }
    }

    return null;
};

const validateRequestData = (data) => {
    const requiredFields = ['email', 'name', 'rollNo', 'course', 'year', 'phone'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
        const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
        error.type = ERROR_TYPES.MISSING_FIELDS;
        error.fields = missingFields;
        return error;
    }

    return null;
};

// Send confirmation email
const sendConfirmationEmail = async (data) => {
    try {
        const { email, name } = data;
        const { subject, template } = workshopData.emailNotification;
        
        console.log(`Sending workshop confirmation email to ${email}`);
        
        const emailResult = await sendWorkshopConfirmation({
            email,
            name,
            subject,
            template: template(name)
        });

        if (emailResult.success) {
            console.log(`Workshop confirmation email sent successfully to ${email} with messageId: ${emailResult.messageId}`);
        } else {
            console.error(`Failed to send workshop confirmation email to ${email}:`, emailResult.error);
        }

        return emailResult;
    } catch (error) {
        console.error('Email sending error:', error.message, error.stack);
        // Don't fail the registration if email fails
        return { 
            success: false, 
            error: error.message,
            stack: error.stack
        };
    }
};

export async function POST(req) {
    // Track request timing for performance monitoring
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    try {
        console.log(`[${requestId}] Workshop registration API called`);
        
        // Get retry count from headers if available
        const retryCount = parseInt(req.headers.get('x-retry-count') || '0');
        if (retryCount > 0) {
            console.log(`[${requestId}] Retry attempt ${retryCount}`);
        }
        
        // Validate environment variables first
        validateEnvironmentVars();

        // Parse request body
        let data;
        try {
            data = await req.json();
        } catch (error) {
            console.error(`[${requestId}] Invalid request body:`, error.message);
            return NextResponse.json(
                { error: 'Invalid request body', type: ERROR_TYPES.INVALID_JSON },
                { status: 400 }
            );
        }

        // Validate required fields
        const validationError = validateRequestData(data);
        if (validationError) {
            return NextResponse.json(
                {
                    error: validationError.message,
                    type: validationError.type,
                    fields: validationError.fields
                },
                { status: 400 }
            );
        }

        // Get sheets instance (cached)
        const sheets = await getSheets();

        // Check for duplicates
        const duplicateError = await checkDuplicateRegistration(sheets, data);
        if (duplicateError) {
            // Instead of returning an error, create a token and redirect
            if (duplicateError.type === ERROR_TYPES.DUPLICATE_EMAIL || duplicateError.type === ERROR_TYPES.DUPLICATE_PHONE) {
                // Create a registration token for the existing user
                const registrationToken = Buffer.from(data.email).toString('base64');
                
                console.log(`[${requestId}] User already registered: ${data.email}`);
                
                return NextResponse.json(
                    { 
                        success: true,
                        message: "You are already registered",
                        alreadyRegistered: true,
                        registrationToken,
                        whatsappLink: workshopData.whatsappGroupLink
                    },
                    { status: 200 }
                );
            } else {
                // For other types of errors, return the error as before
                return NextResponse.json(
                    { error: duplicateError.message, type: duplicateError.type },
                    { status: 400 }
                );
            }
        }

        // Prepare row data and save to spreadsheet
        const timestamp = new Date().toISOString();
        const rowData = [
            timestamp,
            data.email,
            data.name,
            data.rollNo,
            data.course,
            data.college || "Shivaji College",
            data.phone,
            "Workshop",
            data.year,
            data.query || ''
        ];

        // Save to spreadsheet
        const sheetResponse = await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID_WORKSHOP,
            range: 'Sheet1!A:J',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [rowData] },
        });

        // Update cache
        registrationCache.add(data.email, data.phone);

        // Send confirmation email with proper error handling
        console.log(`[${requestId}] Registration successful, sending confirmation email`);
        let emailResult = { success: false, error: 'Email sending not attempted' };
        
        try {
            // Send email and await the result
            emailResult = await sendConfirmationEmail(data);
            
            if (!emailResult.success) {
                console.warn(`[${requestId}] Email notification failed but registration succeeded:`, emailResult.error);
            }
        } catch (emailError) {
            console.error(`[${requestId}] Unexpected error sending confirmation email:`, emailError);
            emailResult = { 
                success: false, 
                error: emailError.message,
                stack: emailError.stack
            };
        }

        // Return success response
        const response = {
            success: true,
            message: "Registration successful",
            timestamp,
            whatsappLink: workshopData.whatsappGroupLink,
            registrationToken: Buffer.from(data.email).toString('base64'),
            emailSent: emailResult.success
        };
        
        // Log performance metrics
        const endTime = Date.now();
        console.log(`[${requestId}] Request completed in ${endTime - startTime}ms`);

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        const endTime = Date.now();
        console.error(`[${requestId}] Registration error (${endTime - startTime}ms):`, {
            message: error.message,
            type: error.type || ERROR_TYPES.UNKNOWN_ERROR,
            cause: error.cause?.message
        });

        // Map error types to status codes
        let statusCode = 500;
        if (error.type === ERROR_TYPES.MISSING_CREDENTIALS || error.type === ERROR_TYPES.MISSING_SHEET_ID) {
            statusCode = 503;
        } else if (error.type === ERROR_TYPES.AUTH_FAILED) {
            statusCode = 401;
        } else if (error.type === ERROR_TYPES.MISSING_FIELDS || error.type === ERROR_TYPES.INVALID_JSON) {
            statusCode = 400;
        } else if (error.type === ERROR_TYPES.DUPLICATE_EMAIL || error.type === ERROR_TYPES.DUPLICATE_PHONE) {
            statusCode = 409;
        }

        return NextResponse.json(
            {
                error: error.message || 'Registration failed',
                type: error.type || ERROR_TYPES.UNKNOWN_ERROR
            },
            { status: statusCode }
        );
    }
}