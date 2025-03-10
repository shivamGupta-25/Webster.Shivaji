import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { TECHELONS_EVENTS, getEventById, getWhatsAppGroupLink } from '@/app/_data/techelonsEventsData';
import { sendTechelonsConfirmation } from '@/app/_utils/emailServiceTechelons';
import { validateFile, fileToBuffer, generateSanitizedFilename } from '@/app/_utils/fileUtils';

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
];

const SHEET_RANGE = 'Sheet1!A:Z';

// Validate environment variables
const validateEnvironmentVars = () => {
    const missingVars = [];
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
    const GOOGLE_SHEET_ID_TECHELONS = process.env.GOOGLE_SHEET_ID_TECHELONS;
    const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!GOOGLE_PRIVATE_KEY || GOOGLE_PRIVATE_KEY === "YOUR_PRIVATE_KEY_HERE") {
        missingVars.push('GOOGLE_PRIVATE_KEY');
    }
    
    if (!GOOGLE_CLIENT_EMAIL || GOOGLE_CLIENT_EMAIL === "YOUR_CLIENT_EMAIL_HERE") {
        missingVars.push('GOOGLE_CLIENT_EMAIL');
    }
    
    if (!GOOGLE_SHEET_ID_TECHELONS) {
        missingVars.push('GOOGLE_SHEET_ID_TECHELONS');
    }
    
    if (!GOOGLE_DRIVE_FOLDER_ID) {
        missingVars.push('GOOGLE_DRIVE_FOLDER_ID');
    }
    
    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
};

// Create a singleton instance of GoogleClient
let googleClientInstance = null;

class GoogleClient {
    constructor() {
        this.auth = null;
        this.drive = null;
        this.sheets = null;
        this.initialized = false;
        this.lastInitTime = null;
        this.initPromise = null;
        this.initLock = false;
    }

    static getInstance() {
        if (!googleClientInstance) {
            googleClientInstance = new GoogleClient();
        }
        return googleClientInstance;
    }

    async initialize() {
        // Validate environment variables first
        validateEnvironmentVars();
        
        // If already initializing, wait for that promise to resolve
        if (this.initPromise) {
            return this.initPromise;
        }
        
        // If already initialized and less than 30 minutes old, reuse
        const now = Date.now();
        if (this.initialized && this.lastInitTime && (now - this.lastInitTime < 30 * 60 * 1000)) {
            return;
        }
        
        // Set lock and create promise
        this.initLock = true;
        this.initPromise = this._doInitialize();
        
        try {
            await this.initPromise;
            this.lastInitTime = Date.now();
        } finally {
            this.initLock = false;
            this.initPromise = null;
        }
    }
    
    async _doInitialize() {
        try {
            this.auth = new JWT({
                email: process.env.GOOGLE_CLIENT_EMAIL,
                key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                scopes: SCOPES,
            });

            await this.auth.authorize();
            this.drive = google.drive({ version: 'v3', auth: this.auth });
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });

            await this.ensureSheetExists();
            this.initialized = true;
        } catch (error) {
            console.error('Initialization error:', error);
            throw new Error('Failed to initialize Google client');
        }
    }

    async ensureSheetExists() {
        try {
            await this.sheets.spreadsheets.values.get({
                spreadsheetId: process.env.GOOGLE_SHEET_ID_TECHELONS,
                range: 'Sheet1!A1'
            });
        } catch (error) {
            if (error.code === 404) {
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: process.env.GOOGLE_SHEET_ID_TECHELONS,
                    requestBody: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: 'Sheet1'
                                }
                            }
                        }]
                    }
                });
                
                // Add headers
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: process.env.GOOGLE_SHEET_ID_TECHELONS,
                    range: 'Sheet1!A1',
                    valueInputOption: 'RAW',
                    requestBody: {
                        values: [[
                            'Timestamp',
                            'Email',
                            'Name',
                            'Roll No',
                            'Course',
                            'College',
                            'Phone',
                            'Event',
                            'Year',
                            'Query',
                            'College ID URL',
                            'Team Member 1 Name',
                            'Team Member 1 Email',
                            'Team Member 1 Phone',
                            'Team Member 1 Roll No',
                            'Team Member 1 College',
                            'Team Member 1 College ID URL',
                            'Team Member 2 Name',
                            'Team Member 2 Email',
                            'Team Member 2 Phone',
                            'Team Member 2 Roll No',
                            'Team Member 2 College',
                            'Team Member 2 College ID URL',
                            'Team Member 3 Name',
                            'Team Member 3 Email',
                            'Team Member 3 Phone',
                            'Team Member 3 Roll No',
                            'Team Member 3 College',
                            'Team Member 3 College ID URL'
                        ]]
                    }
                });
            } else {
                throw error;
            }
        }
    }

    bufferToStream(buffer) {
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        return stream;
    }

    async uploadToDrive(file, prefix, userData) {
        if (!file) return null;
        
        try {
            // Validate file
            const validation = validateFile(file);
            if (!validation.success) {
                throw new Error(validation.error);
            }
            
            // Check file size explicitly again
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error(`File size exceeds the maximum limit of 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
            }
            
            // Convert file to buffer
            const buffer = await fileToBuffer(file);
            
            // Generate filename
            const eventDetails = getEventById(userData.event);
            const filename = generateSanitizedFilename(file, prefix, {
                ...userData,
                eventName: eventDetails?.name || 'Unknown-Event'
            });

            const driveResponse = await this.drive.files.create({
                requestBody: {
                    name: filename,
                    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
                },
                media: {
                    mimeType: file.type,
                    body: this.bufferToStream(buffer)
                },
                fields: 'id'
            });

            return `https://drive.google.com/file/d/${driveResponse.data.id}/view`;
        } catch (error) {
            console.error('File upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    async appendToSheet(rowData) {
        try {
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: process.env.GOOGLE_SHEET_ID_TECHELONS,
                range: SHEET_RANGE,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: { values: [rowData] },
            });
        } catch (error) {
            console.error('Sheet append error:', error);
            throw new Error(`Failed to append data to sheet: ${error.message}`);
        }
    }

    async checkDuplicateRegistration(email, phone, event) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: process.env.GOOGLE_SHEET_ID_TECHELONS,
                range: SHEET_RANGE,
            });

            const rows = response.data.values || [];
            
            // Skip the header row if it exists
            const dataRows = rows.length > 0 ? rows.slice(1) : [];
            
            // Check for duplicates using more efficient filtering
            return dataRows.some(row => {
                // Ensure row has enough elements
                if (row.length < 8) return false;
                
                const emailMatch = row[1] === email;
                const phoneMatch = row[6] === phone;
                const eventMatch = row[7] === event;
                return (emailMatch || phoneMatch) && eventMatch;
            });
        } catch (error) {
            console.error('Duplicate check error:', error);
            throw new Error(`Failed to check for duplicate registration: ${error.message}`);
        }
    }
}

export async function POST(req) {
    const googleClient = GoogleClient.getInstance();

    try {
        await googleClient.initialize();
        
        let formData;
        try {
            formData = await req.formData();
        } catch (formDataError) {
            console.error('Error parsing form data:', formDataError);
            return NextResponse.json(
                { 
                    error: 'Error processing your request',
                    details: 'There was an issue with your form data. This might be due to large file uploads exceeding the size limit.'
                },
                { status: 400 }
            );
        }

        // Basic validation
        const requiredFields = ['name', 'email', 'phone', 'rollNo', 'college', 'event', 'year', 'course'];
        for (const field of requiredFields) {
            if (!formData.get(field)) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        const userData = {
            name: formData.get('name'),
            college: formData.get('college'),
            otherCollege: formData.get('otherCollege'),
            event: formData.get('event')
        };

        // Check for duplicate registration
        const isDuplicate = await googleClient.checkDuplicateRegistration(
            formData.get('email'),
            formData.get('phone'),
            formData.get('event')
        );

        if (isDuplicate) {
            // Get event details for the WhatsApp link
            const eventDetails = getEventById(formData.get('event'));
            
            // Get WhatsApp link for the event
            let whatsappLink;
            try {
                whatsappLink = getWhatsAppGroupLink(formData.get('event'));
                console.log('WhatsApp link for event:', whatsappLink);
                
                // If no specific link found, use default
                if (!whatsappLink) {
                    console.log('Using default WhatsApp link');
                    whatsappLink = "https://chat.whatsapp.com/techelons-general-group";
                }
            } catch (whatsappError) {
                console.error('Error getting WhatsApp link:', whatsappError);
                // Fallback to default link
                whatsappLink = "https://chat.whatsapp.com/techelons-general-group";
            }
            
            // Create a registration token for the existing user
            const registrationToken = Buffer.from(formData.get('email')).toString('base64');
            
            return NextResponse.json({
                success: true,
                message: "You have already registered for this event",
                alreadyRegistered: true,
                eventName: eventDetails?.name,
                whatsappLink: whatsappLink,
                registrationToken: registrationToken
            });
        }

        // Upload files and prepare team member data in parallel
        const uploadPromises = [];
        const teamMembers = [];
        
        // Main participant's college ID upload
        const mainCollegeIdPromise = googleClient.uploadToDrive(
            formData.get('collegeId'),
            'Main_Participant',
            userData
        );
        uploadPromises.push(mainCollegeIdPromise);
        
        // Find all team member entries in the form data
        const teamMemberKeys = Array.from(formData.keys())
            .filter(key => key.startsWith('teamMember_') && !key.includes('_collegeId'));
        
        for (const key of teamMemberKeys) {
            const index = key.split('_')[1];
            let memberData;
            
            try {
                const rawData = formData.get(key);
                if (typeof rawData !== 'string') {
                    console.error(`Invalid team member data for ${key}:`, rawData);
                    throw new Error('Invalid team member data format');
                }
                memberData = JSON.parse(rawData);
            } catch (error) {
                console.error(`Error parsing team member data for ${key}:`, error);
                return NextResponse.json(
                    { 
                        error: `There may be an issue with your uploaded ID: ${error.message}`,
                        details: `Failed to parse team member data. Please try again with a smaller file size.`
                    },
                    { status: 400 }
                );
            }
            
            // Upload team member's college ID
            const memberCollegeIdFile = formData.get(`teamMember_${index}_collegeId`);
            const memberCollegeIdPromise = googleClient.uploadToDrive(
                memberCollegeIdFile,
                `Team_Member_${parseInt(index) + 1}`,
                {
                    ...userData,
                    name: memberData.name,
                    college: memberData.college,
                    otherCollege: memberData.otherCollege
                }
            );
            
            uploadPromises.push(memberCollegeIdPromise);
            teamMembers.push({
                ...memberData,
                index: parseInt(index)
            });
        }
        
        // Wait for all uploads to complete
        const uploadResults = await Promise.allSettled(uploadPromises);
        
        // Check for upload failures
        const failedUploads = uploadResults.filter(result => result.status === 'rejected');
        if (failedUploads.length > 0) {
            console.error('Some file uploads failed:', failedUploads);
            // Continue with registration but log the errors
        }
        
        // Get upload URLs (handle both fulfilled and rejected promises)
        const mainCollegeIdUrl = uploadResults[0].status === 'fulfilled' ? uploadResults[0].value : null;
        
        // Sort team members by index
        teamMembers.sort((a, b) => a.index - b.index);
        
        // Prepare row data for Google Sheet
        const timestamp = new Date().toISOString();
        const eventDetails = getEventById(formData.get('event'));
        
        // Prepare row data with team member information
        const rowData = [
            timestamp,
            formData.get('email'),
            formData.get('name'),
            formData.get('rollNo'),
            formData.get('course'),
            formData.get('college') === 'Other' ? formData.get('otherCollege') : formData.get('college'),
            formData.get('phone'),
            formData.get('event'),
            formData.get('year'),
            formData.get('query') || '',
            mainCollegeIdUrl || ''
        ];
        
        // Add team member data to row
        for (let i = 0; i < 3; i++) {
            const member = teamMembers[i];
            if (member) {
                const memberCollegeIdUrl = uploadResults[i + 1]?.status === 'fulfilled' ? uploadResults[i + 1].value : null;
                rowData.push(
                    member.name,
                    member.email,
                    member.phone,
                    member.rollNo,
                    member.college === 'Other' ? member.otherCollege : member.college,
                    memberCollegeIdUrl || ''
                );
            } else {
                // Add empty cells for missing team members
                rowData.push('', '', '', '', '', '');
            }
        }
        
        // Append data to Google Sheet
        await googleClient.appendToSheet(rowData);
        
        // Get WhatsApp link for the event
        let whatsappLink;
        try {
            whatsappLink = getWhatsAppGroupLink(formData.get('event'));
            console.log('WhatsApp link for event:', whatsappLink);
            
            // If no specific link found, use default
            if (!whatsappLink) {
                console.log('Using default WhatsApp link');
                whatsappLink = "https://chat.whatsapp.com/techelons-general-group";
            }
        } catch (whatsappError) {
            console.error('Error getting WhatsApp link:', whatsappError);
            // Fallback to default link
            whatsappLink = "https://chat.whatsapp.com/techelons-general-group";
        }
        
        // Send confirmation email in the background
        let emailResult = { success: false, error: 'Email sending not attempted' };
        
        try {
            emailResult = await sendTechelonsConfirmation({
                to: formData.get('email'),
                name: formData.get('name'),
                event: formData.get('event'),
                eventDate: eventDetails?.date,
                eventTime: eventDetails?.time,
                eventVenue: eventDetails?.venue,
                whatsappLink
            });
            
            // Send emails to team members in the background
            if (teamMembers.length > 0) {
                try {
                    // Properly await the Promise.all to ensure emails are sent before the route completes
                    await Promise.all(
                        teamMembers.map(member => 
                            sendTechelonsConfirmation({
                                to: member.email,
                                name: member.name,
                                event: formData.get('event'),
                                eventDate: eventDetails?.date,
                                eventTime: eventDetails?.time,
                                eventVenue: eventDetails?.venue,
                                whatsappLink,
                                isTeamMember: true,
                                teamLeader: formData.get('name')
                            })
                        )
                    );
                    console.log(`Successfully sent confirmation emails to ${teamMembers.length} team members`);
                } catch (teamEmailError) {
                    console.error('Error sending team member emails:', teamEmailError);
                    // Don't fail the whole registration if team member emails fail
                    // But record the error in the response
                    emailResult.teamMemberEmailsError = teamEmailError.message;
                }
            }
        } catch (error) {
            console.error('Error sending confirmation email:', error);
            emailResult = { 
                success: false, 
                error: error.message,
                emailDetails: error.details || 'Unknown error'
            };
        }
        
        // Return success response
        return NextResponse.json({
            success: true,
            message: "Registration successful",
            eventName: eventDetails?.name,
            whatsappLink: whatsappLink,
            emailSent: emailResult.success,
            // Use only the email for the token, without timestamp
            registrationToken: Buffer.from(formData.get('email')).toString('base64')
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        return NextResponse.json(
            { 
                error: error.message || 'Registration failed',
                details: error.details || 'An unexpected error occurred'
            },
            { status: 500 }
        );
    }
}