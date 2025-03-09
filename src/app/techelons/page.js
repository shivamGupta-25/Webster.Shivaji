"use client";

import { Suspense, useEffect, useRef } from "react";
import Header from "../_components/Header";
import Footer from "../_components/Footer";
import TechelonsHero from "../_components/TechelonsComponents/TechelonsMain";
import TechelonsSchedule from "../_components/TechelonsComponents/TechelonsSchedule";
import Head from "next/head";

// Loading fallback components
const HeroSkeleton = () => (
    <div className="animate-pulse" aria-hidden="true">
        <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
    </div>
);

const ScheduleSkeleton = () => (
    <div className="animate-pulse" aria-hidden="true">
        <div className="h-20 bg-gray-200 rounded-lg mb-4 w-3/4 mx-auto"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
        </div>
    </div>
);

export default function Techelons() {
    // Create a ref for the events section
    const eventsRef = useRef(null);

    // Handle hash navigation when the page loads
    useEffect(() => {
        // Function to handle hash navigation
        const handleHashNavigation = () => {
            // Check if the URL has a hash fragment
            if (window.location.hash === '#events' && eventsRef.current) {
                // Scroll to the events section with a delay to ensure everything is loaded
                setTimeout(() => {
                    // Use scrollIntoView with a block: "start" option to ensure it's at the top
                    eventsRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 500); // Reduced delay for better user experience
            }
        };

        // Call the function when the component mounts
        handleHashNavigation();

        // Also handle hash changes
        window.addEventListener('hashchange', handleHashNavigation);

        // Cleanup
        return () => {
            window.removeEventListener('hashchange', handleHashNavigation);
        };
    }, []);

    return (
        <>
            <Head>
                <title>Techelons 2025 - Shivaji College's Premier Tech Festival</title>
                <meta name="description" content="Join Techelons 2025, Shivaji College's premier technical festival featuring competitions, workshops, seminars and networking opportunities." />
                <meta name="keywords" content="techelons, tech fest, shivaji college, technical festival, coding competition" />
            </Head>

            <div className="flex flex-col min-h-screen">
                <Header />

                <main className="flex-grow">
                    <section aria-label="Techelons Hero Section">
                        <Suspense fallback={<HeroSkeleton />}>
                            <TechelonsHero />
                        </Suspense>
                    </section>

                    <hr className="h-px bg-gray-200 border-0 w-4/5 mx-auto shadow-sm my-8" />

                    <section
                        ref={eventsRef}
                        id="events"
                        aria-label="Techelons Event Schedule"
                    >
                        <Suspense fallback={<ScheduleSkeleton />}>
                            <TechelonsSchedule />
                        </Suspense>
                    </section>
                </main>

                <Footer />
            </div>
        </>
    );
}