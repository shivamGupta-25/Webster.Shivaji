"use client";

import { memo } from 'react';
import PropTypes from 'prop-types';

const ScrollToTopButton = memo(({ visible, onClick }) => (
  <button
    onClick={onClick}
    type="button"
    className={`fixed bottom-4 right-4 p-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 z-40 transform will-change-transform ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
    }`}
    aria-label="Scroll to top"
    title="Scroll to top"
    style={{ transform: 'translateZ(0)' }} // Force GPU acceleration
  >
    <svg 
      className="w-5 h-5" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      aria-hidden="true"
      width="20"
      height="20"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  </button>
));

ScrollToTopButton.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

ScrollToTopButton.displayName = 'ScrollToTopButton';

export default ScrollToTopButton; 