"use client";

import { Suspense, useEffect, useRef, useState, useCallback, memo } from "react";
import dynamic from 'next/dynamic';
import Head from "next/head";
import Header from "../_components/Header";
import Footer from "../_components/Footer";
import ScrollToTopButton from "../_components/ScrollToTopButton";

// Constants
const SCROLL_THRESHOLD = 300;
const HASH_NAVIGATION_DELAY = 100;
const SCROLL_THROTTLE_MS = 100; // Throttle scroll events

// Dynamically import components with loading priority and explicit chunk names
const TechelonsHero = dynamic(() => 
  import(/* webpackChunkName: "techelons-hero" */ "../_components/TechelonsComponents/TechelonsMain"), {
  loading: () => <HeroSkeleton />,
  ssr: true // Enable SSR for better SEO and initial load performance
});

const TechelonsSchedule = dynamic(() => 
  import(/* webpackChunkName: "techelons-schedule" */ "../_components/TechelonsComponents/TechelonsSchedule"), {
  loading: () => <ScheduleSkeleton />,
  ssr: false // Disable SSR for this heavy component to improve initial load time
});

// Loading fallback components - memoized to prevent unnecessary re-renders
const HeroSkeleton = memo(() => (
    <div className="animate-pulse" aria-hidden="true">
        <div className="h-96 bg-gray-200 rounded-lg mb-8" role="presentation"></div>
    </div>
));

const ScheduleSkeleton = memo(() => (
    <div className="animate-pulse" aria-hidden="true">
        <div className="h-20 bg-gray-200 rounded-lg mb-4 w-3/4 mx-auto" role="presentation"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg" role="presentation"></div>
            ))}
        </div>
    </div>
));

// Add display names for better debugging
HeroSkeleton.displayName = 'HeroSkeleton';
ScheduleSkeleton.displayName = 'ScheduleSkeleton';

// Optimized custom hook for scroll-to-top functionality with throttling
const useScrollToTop = () => {
    const [showTopButton, setShowTopButton] = useState(false);
    
    // Memoized scroll to top function
    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);
    
    // Optimized scroll handler with throttle pattern
    useEffect(() => {
        if (typeof window === 'undefined') return; // Guard for SSR
        
        let lastScrollY = 0;
        let ticking = false;
        let lastScrollTime = 0;
        
        const handleScroll = () => {
            const now = Date.now();
            
            // Skip if we're throttling
            if (now - lastScrollTime < SCROLL_THROTTLE_MS) return;
            
            lastScrollTime = now;
            lastScrollY = window.scrollY;
            
            if (!ticking) {
                // Use requestAnimationFrame for better performance
                window.requestAnimationFrame(() => {
                    setShowTopButton(lastScrollY > SCROLL_THRESHOLD);
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        // Add passive event listener for better performance
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Initial check
        setShowTopButton(window.scrollY > SCROLL_THRESHOLD);
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return { showTopButton, scrollToTop };
};

// Optimized custom hook for hash navigation with better performance
const useHashNavigation = (ref) => {
    useEffect(() => {
        if (typeof window === 'undefined') return; // Guard for SSR
        
        // Memoize DOM queries to avoid layout thrashing
        let cachedNavHeight = 0;
        
        const handleHashNavigation = () => {
            if (window.location.hash === '#events' && ref.current) {
                // Cache the nav height to avoid repeated DOM queries
                if (!cachedNavHeight) {
                    cachedNavHeight = document.querySelector('header')?.offsetHeight || 0;
                }
                
                // Use requestAnimationFrame for smoother scrolling
                requestAnimationFrame(() => {
                    const elementPosition = ref.current.getBoundingClientRect().top + window.scrollY;
                    
                    // Debounce the scroll operation
                    setTimeout(() => {
                        window.scrollTo({
                            top: elementPosition - cachedNavHeight - 20, // Account for header height and add some padding
                            behavior: 'smooth'
                        });
                    }, HASH_NAVIGATION_DELAY);
                });
            }
        };

        // Handle initial hash and subsequent changes
        handleHashNavigation();
        window.addEventListener('hashchange', handleHashNavigation);

        return () => {
            window.removeEventListener('hashchange', handleHashNavigation);
        };
    }, [ref]);
};

const Techelons = () => {
    const eventsRef = useRef(null);
    const { showTopButton, scrollToTop } = useScrollToTop();
    
    // Use the hash navigation hook
    useHashNavigation(eventsRef);

    return (
        <>
            <Head>
                <title>Techelons 2025 - Shivaji College's Premier Tech Festival</title>
                <meta name="description" content="Join Techelons 2025, Shivaji College's premier technical festival featuring competitions, workshops, seminars and networking opportunities." />
                <meta name="keywords" content="techelons, tech fest, shivaji college, technical festival, coding competition" />
                {/* Add Open Graph tags for better social sharing */}
                <meta property="og:title" content="Techelons 2025 - Shivaji College's Premier Tech Festival" />
                <meta property="og:description" content="Join Techelons 2025, Shivaji College's premier technical festival featuring competitions, workshops, seminars and networking opportunities." />
                <meta property="og:type" content="website" />
                {/* Add canonical URL if needed */}
                <link rel="canonical" href="https://yourwebsite.com/techelons" />
                
                {/* Add preload hints for critical resources */}
                <link rel="preload" href="/fonts/your-main-font.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://prod.spline.design" />
            </Head>

            <div className="flex flex-col min-h-screen">
                <Header />

                <main className="flex-grow">
                    {/* Use content-visibility for better rendering performance */}
                    <Suspense fallback={<HeroSkeleton />}>
                        <section 
                            aria-label="Techelons Hero Section"
                            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
                        >
                            <TechelonsHero />
                        </section>
                    </Suspense>

                    <hr className="h-px bg-gray-200 border-0 w-4/5 mx-auto shadow-sm my-8" />

                    {/* Lazy load the schedule section with Intersection Observer */}
                    <Suspense fallback={<ScheduleSkeleton />}>
                        <section
                            ref={eventsRef}
                            id="events"
                            aria-label="Techelons Event Schedule"
                            style={{ contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}
                        >
                            <TechelonsSchedule />
                        </section>
                    </Suspense>
                    
                    <ScrollToTopButton visible={showTopButton} onClick={scrollToTop} />
                </main>

                <Footer />
            </div>
        </>
    );
};

// Export memoized component to prevent unnecessary re-renders
export default memo(Techelons);