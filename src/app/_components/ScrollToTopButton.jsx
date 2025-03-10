"use client";

import { memo } from 'react';

const ScrollToTopButton = memo(({ visible, onClick }) => (
  <button
    onClick={onClick}
    className={`fixed bottom-4 right-4 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 z-40 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
    }`}
    aria-label="Scroll to top"
  >
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  </button>
));

export default ScrollToTopButton; 