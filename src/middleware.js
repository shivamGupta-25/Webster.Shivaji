import { NextResponse } from 'next/server';

export function middleware(request) {
    // Check if the request is for a protected form submission page
    if (request.nextUrl.pathname === '/formsubmitted/workshop' || request.nextUrl.pathname === '/formsubmitted/techelons') {
        // Get the registration token from the URL
        const token = request.nextUrl.searchParams.get('token');

        // If no token is present, redirect to home
        if (!token) {
            return NextResponse.redirect(new URL('/', request.url));
        }

        try {
            // Decode and verify the token
            const decodedToken = Buffer.from(token, 'base64').toString();

            // Simple email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(decodedToken)) {
                return NextResponse.redirect(new URL('/', request.url));
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