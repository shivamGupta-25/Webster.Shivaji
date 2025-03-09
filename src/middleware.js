import { NextResponse } from 'next/server';

export function middleware(request) {
    // Check if the request is for a protected form submission page
    if (request.nextUrl.pathname === '/formsubmitted/workshop' || request.nextUrl.pathname === '/formsubmitted/techelons') {
        // Get the registration token from the URL
        const token = request.nextUrl.searchParams.get('token');

        // If no token is present, redirect to home
        if (!token) {
            console.warn('Access attempt without token to protected page:', request.nextUrl.pathname);
            return NextResponse.redirect(new URL('/', request.url));
        }

        try {
            // Decode and verify the token
            const decodedToken = Buffer.from(token, 'base64').toString();
            
            // More comprehensive email validation
            const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|du\.ac\.in|ipu\.ac\.in|ignou\.ac\.in|jnu\.ac\.in|iitd\.ac\.in|nsut\.ac\.in|dtu\.ac\.in|igdtuw\.ac\.in|aud\.ac\.in|jamiahamdard\.edu|bhu\.ac\.in|bvpindia\.com|mait\.ac\.in|ip\.edu|msit\.in|gbpuat\.ac\.in)$/;
            
            if (!emailRegex.test(decodedToken)) {
                console.warn('Invalid token format detected:', request.nextUrl.pathname);
                return NextResponse.redirect(new URL('/', request.url));
            }
            
            // Check token age if timestamp is included (format: email|timestamp)
            if (decodedToken.includes('|')) {
                const [email, timestamp] = decodedToken.split('|');
                const tokenTime = parseInt(timestamp, 10);
                const currentTime = Date.now();
                
                // Token expires after 24 hours
                if (isNaN(tokenTime) || currentTime - tokenTime > 24 * 60 * 60 * 1000) {
                    console.warn('Expired token detected:', request.nextUrl.pathname);
                    return NextResponse.redirect(new URL('/', request.url));
                }
            }
        } catch (error) {
            // If token is invalid, redirect to home
            console.error('Token validation error:', error);
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/formsubmitted/workshop', '/formsubmitted/techelons']
};