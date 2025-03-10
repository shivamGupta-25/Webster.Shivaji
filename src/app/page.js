"use client";

// without loading Screen

import { useCallback, useState, useEffect, memo, useRef } from "react";
import dynamic from 'next/dynamic';
import Header from "./_components/Header";
import Footer from "./_components/Footer";

// Dynamically import components with loading priority
// Critical components loaded first with higher priority
const Banner = dynamic(() => import("./_components/Banner"), { 
  ssr: true,
  loading: () => <div className="h-[400px] animate-pulse bg-gray-100 rounded-lg" aria-label="Loading banner" />
});

// Less critical components loaded with lower priority
const About = dynamic(() => import("./_components/About"), { ssr: true });
const Workshop = dynamic(() => import("./_components/Workshop"), { ssr: true });
const PastEvent = dynamic(() => import("./_components/PastEvent"), { ssr: true });
const Council = dynamic(() => import("./_components/Council"), { ssr: true });
const ScrollToTopButton = dynamic(() => import("./_components/ScrollToTopButton"), { ssr: false });

// Memoize UI components to prevent unnecessary re-renders
const ScrollIndicator = memo(({ visible }) => (
  <div 
    className={`fixed bottom-8 w-full flex justify-center z-50 transition-opacity duration-500 ${
      visible ? 'opacity-80 hover:opacity-100' : 'opacity-0 pointer-events-none'
    }`}
    aria-hidden={!visible}
  >
    <div className="flex flex-col items-center animate-bounce">
      <span className="text-sm text-gray-600 mb-1 text-center px-4">Scroll to explore</span>
      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </div>
));

ScrollIndicator.displayName = 'ScrollIndicator';

// Custom hook for scroll state management with optimized performance
const useScrollState = () => {
  // Use a single state object to reduce re-renders
  const [scroll, setScroll] = useState({
    showIndicator: true,
    showTopButton: false
  });
  
  // Use refs to avoid dependency issues and prevent unnecessary re-renders
  const scrollRef = useRef(scroll);
  scrollRef.current = scroll;
  
  // Use ref for tracking animation frame to properly clean up
  const rafIdRef = useRef(null);
  const tickingRef = useRef(false);

  useEffect(() => {
    // Store last scroll position to avoid unnecessary calculations
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      // Store current scroll position
      lastScrollY = window.scrollY;
      
      if (!tickingRef.current) {
        rafIdRef.current = window.requestAnimationFrame(() => {
          // Only update state if values would actually change
          const shouldShowIndicator = lastScrollY < 100;
          const shouldShowTopButton = lastScrollY > 300;
          
          if (scrollRef.current.showIndicator !== shouldShowIndicator || 
              scrollRef.current.showTopButton !== shouldShowTopButton) {
            setScroll({
              showIndicator: shouldShowIndicator,
              showTopButton: shouldShowTopButton
            });
          }
          
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };

    // Use passive event listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []); // Empty dependency array since we're using refs

  return scroll;
};

// Memoized main content component to prevent unnecessary re-renders
const MainContent = memo(({ scroll, scrollToTop }) => (
  <>
    <Header />
    <main>
      <Banner />
      <About />
      <Workshop />
      <PastEvent />
      <Council />
      <ScrollIndicator visible={scroll.showIndicator} />
      <ScrollToTopButton visible={scroll.showTopButton} onClick={scrollToTop} />
    </main>
    <Footer />
  </>
));

MainContent.displayName = 'MainContent';

export default function Home() {
  // Use custom hook for optimized scroll handling
  const scroll = useScrollState();
  
  // Memoize callback functions to prevent unnecessary re-renders
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Use memoized main content to prevent unnecessary re-renders
  return <MainContent scroll={scroll} scrollToTop={scrollToTop} />;
}