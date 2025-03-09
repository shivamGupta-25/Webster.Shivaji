/**
 * Techelons Events Data
 * 
 * This file serves as the central repository for all Techelons event information.
 * Any changes to event details should be made here, and they will propagate
 * throughout the application.
 */

import { MemoryCache, memoizeWithTTL } from '@/app/_utils/performanceUtils';

// MASTER SWITCH: Set to false to force close all registrations regardless of other settings
export const REGISTRATION_ENABLED = true;

// Techelons Fest Dates - EDIT THESE FOR FUTURE EVENTS
export const FEST_DATES = {
  DAY_1: "April 10, 2025",
  DAY_2: "April 11, 2025",
  REGISTRATION_DEADLINE: "April 8, 2025"
};

// Date utilities for consistent date handling
export const DATE_UTILS = {
  // Parse a date string into a Date object
  parseDate: (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  },

  // Format a date to display format (e.g., "April 10, 2025")
  formatDate: (date) => {
    if (!date) return "To be announced";

    try {
      if (typeof date === 'string') {
        date = DATE_UTILS.parseDate(date);
      }

      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "To be announced";
      }

      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "To be announced";
    }
  },

  // Format time (e.g., "10:00 AM")
  formatTime: (timeString) => {
    if (!timeString) return "To be announced";
    return timeString;
  },

  // Get day of week
  getDayOfWeek: (date) => {
    if (!date) return "";

    try {
      if (typeof date === 'string') {
        date = DATE_UTILS.parseDate(date);
      }

      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return "";
      }

      const options = { weekday: 'long' };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error("Error getting day of week:", error);
      return "";
    }
  },

  // Check if a date is in the future
  isFutureDate: (dateString) => {
    try {
      const date = DATE_UTILS.parseDate(dateString);
      if (!date) return false;
      return date > new Date();
    } catch (error) {
      console.error("Error checking if date is in future:", error);
      return false;
    }
  },

  // Check if a date is in the past
  isPastDate: (dateString) => {
    try {
      const date = DATE_UTILS.parseDate(dateString);
      if (!date) return false;
      return date < new Date();
    } catch (error) {
      console.error("Error checking if date is in past:", error);
      return false;
    }
  },

  // Get days remaining until a date
  getDaysRemaining: (dateString) => {
    try {
      const date = DATE_UTILS.parseDate(dateString);
      if (!date) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = date - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch (error) {
      console.error("Error calculating days remaining:", error);
      return 0;
    }
  }
};

// Event categories
export const EVENT_CATEGORIES = Object.freeze({
  TECHNICAL: 'technical',
  WORKSHOP: 'workshop',
  GAMING: 'gaming',
  CREATIVE: 'creative',
  SEMINAR: 'seminar'
});

// Constants for event images
export const EVENT_IMAGES = Object.freeze({
  DEFAULT_EVENT_IMAGE: "/placeholder.svg?height=160&width=320",
  FALLBACK_IMAGE: "/placeholder.svg?height=200&width=600"
});

// Category styles for UI display
export const CATEGORY_STYLES = Object.freeze({
  technical: {
    color: "bg-blue-500 text-white hover:bg-blue-600",
    icon: "Code"
  },
  workshop: {
    color: "bg-purple-500 text-white hover:bg-purple-600",
    icon: "Wrench"
  },
  gaming: {
    color: "bg-red-500 text-white hover:bg-red-600",
    icon: "Gamepad2"
  },
  creative: {
    color: "bg-green-500 text-white hover:bg-green-600",
    icon: "Palette"
  },
  seminar: {
    color: "bg-amber-500 text-white hover:bg-amber-600",
    icon: "Presentation"
  },
  default: {
    color: "bg-gray-500 text-white hover:bg-gray-600",
    icon: "Calendar"
  }
});

// Helper function to get image path
export const getImagePath = (imagePath) => {
  if (!imagePath) return EVENT_IMAGES.DEFAULT_EVENT_IMAGE;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  if (imagePath.startsWith("/public/")) return imagePath.replace("/public", "");
  return imagePath;
};

// Helper function to get category style
export const getCategoryStyle = (category) => {
  const categoryLower = (category || "").toLowerCase();
  return CATEGORY_STYLES[categoryLower] || CATEGORY_STYLES.default;
};

// Event registration status
export const REGISTRATION_STATUS = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
  COMING_SOON: 'coming-soon'
});

// Techelons Fest Days
export const FEST_DAYS = Object.freeze({
  DAY_1: 'day1',
  DAY_2: 'day2'
});

/**
 * Main events data array
 * 
 * Each event object contains:
 * - id: Unique identifier for the event
 * - name: Display name of the event
 * - shortDescription: Brief description for cards and previews
 * - description: Full description of the event
 * - category: Event category from EVENT_CATEGORIES
 * - difficulty: Difficulty level from EVENT_DIFFICULTY
 * - teamSize: Min and max team size (including the main participant)
 * - venue: Event venue (string or "TBA")
 * - festDay: Day of the Techelons fest (day1 = April 10, day2 = April 11)
 * - date: Specific date of the event (if different from festDay date)
 * - time: Start time of the event (e.g., "09:00 AM")
 * - duration: Duration of the event (e.g., "2 hours")
 * - registrationStatus: Status from REGISTRATION_STATUS
 * - prizes: Array of prize information
 * - coordinators: Array of coordinator contact information
 * - rules: Array of event rules
 * - instructions: Special instructions for participants
 * - resources: Optional resources for participants
 */
export const TECHELONS_EVENTS = [
  {
    id: "Seminar",
    image: "/assets/Poster.png",
    name: "AI and Cyber Security (Seminar)",
    shortDescription: "Learn about the latest trends in AI and Cyber Security",
    description: "Join us for an informative seminar on AI and Cyber Security. Industry experts will share insights on the latest trends, challenges, and opportunities in these rapidly evolving fields.",
    category: EVENT_CATEGORIES.SEMINAR,
    speaker: "Dr. Amit Kumar, University of Delhi",
    teamSize: { min: 1, max: 1 },
    venue: "Main Auditorium",
    festDay: FEST_DAYS.DAY_1,
    date: FEST_DATES.DAY_1,
    time: "10:00 AM",
    duration: "2 hours",
    registrationStatus: REGISTRATION_STATUS.OPEN,
    prizes: [
      { position: "Participation", reward: "Certificate of Participation" }
    ],
    coordinators: [
      { name: "Dr. Amit Kumar", email: "amit.kumar@example.com", phone: "9876543210" }
    ],
    rules: [
      "Registration is mandatory",
      "Arrive 15 minutes before the seminar starts",
      "Q&A session will be held at the end"
    ],
    instructions: "Please bring your college ID and registration confirmation",
    resources: "Recommended reading: Latest trends in AI and Cybersecurity, Basic knowledge of computer security concepts"
  },
  {
    id: "debug-code",
    image: "/assets/Poster.png",
    name: "Debug the Code",
    shortDescription: "Test your debugging skills by fixing broken code",
    description: "Debug the Code is a competitive event where participants are given broken code snippets and must identify and fix the bugs within a time limit. Test your problem-solving skills and coding knowledge!",
    category: EVENT_CATEGORIES.TECHNICAL,
    teamSize: { min: 1, max: 1 },
    venue: "Computer Lab 1",
    festDay: FEST_DAYS.DAY_1,
    date: FEST_DATES.DAY_1,
    time: "02:00 PM",
    duration: "2 hours",
    registrationStatus: REGISTRATION_STATUS.OPEN,
    prizes: [
      { position: "1st", reward: "₹5,000 + Certificate" },
      { position: "2nd", reward: "₹3,000 + Certificate" },
      { position: "3rd", reward: "₹1,500 + Certificate" }
    ],
    coordinators: [
      { name: "Rahul Sharma", email: "rahul.sharma@example.com", phone: "9876543211" }
    ],
    rules: [
      "Individual participation only",
      "Time limit: 2 hours",
      "Languages supported: C, C++, Java, Python",
      "Internet access will be restricted during the competition"
    ],
    instructions: "Bring your own laptop with required development environments installed",
    resources: "Recommended preparation: Practice debugging in C, C++, Java, and Python. Familiarize yourself with common programming errors and debugging techniques."
  },
  {
    id: "ai-artistry",
    image: "/assets/Poster.png",
    name: "AI Artistry",
    shortDescription: "Create stunning artwork using AI tools",
    description: "AI Artistry is a team event where participants use AI tools to create original artwork based on a given theme. Showcase your creativity and technical skills in this unique blend of art and technology!",
    category: EVENT_CATEGORIES.CREATIVE,
    teamSize: { min: 2, max: 2 },
    venue: "CS Lab 3",
    festDay: FEST_DAYS.DAY_2,
    date: FEST_DATES.DAY_2,
    time: "10:00 AM",
    duration: "2 hours",
    registrationStatus: REGISTRATION_STATUS.OPEN,
    prizes: [
      { position: "1st", reward: "₹6,000 + Certificate" },
      { position: "2nd", reward: "₹4,000 + Certificate" },
      { position: "3rd", reward: "₹2,000 + Certificate" }
    ],
    coordinators: [
      { name: "Priya Singh", email: "priya.singh@example.com", phone: "9876543212" }
    ],
    rules: [
      "Team of exactly 2 members",
      "Theme will be announced on the day of the event",
      "Participants must use at least one AI tool in their creation",
      "Final submission should include the artwork and a brief explanation"
    ],
    instructions: "Bring your own devices with necessary AI tools installed",
    resources: "Recommended AI tools: Midjourney, DALL-E, Stable Diffusion"
  },
  {
    id: "gaming",
    image: "/assets/Poster.png",
    name: "E-Lafda (Tekken)",
    shortDescription: "Compete in Tekken tournament to prove your gaming skills",
    description: "E-Lafda is an exciting Tekken tournament where gamers can showcase their fighting skills. Compete against other players in thrilling matches and claim the title of Tekken Champion!",
    category: EVENT_CATEGORIES.GAMING,
    teamSize: { min: 1, max: 4 },
    venue: "Gaming Arena",
    festDay: FEST_DAYS.DAY_2,
    date: FEST_DATES.DAY_2,
    time: "02:00 PM",
    duration: "2 hours",
    registrationStatus: REGISTRATION_STATUS.OPEN,
    prizes: [
      { position: "1st", reward: "₹8,000 + Gaming Peripherals + Certificate" },
      { position: "2nd", reward: "₹5,000 + Certificate" },
      { position: "3rd", reward: "₹3,000 + Certificate" }
    ],
    coordinators: [
      { name: "Vikram Patel", email: "vikram.patel@example.com", phone: "9876543213" }
    ],
    rules: [
      "Individual or team participation (max 4 members)",
      "Tournament will follow a double elimination format",
      "Standard Tekken tournament rules apply",
      "Participants can bring their own controllers"
    ],
    instructions: "Registration will be on a first-come, first-served basis with limited slots",
    resources: "Recommended practice: Tekken 7 or Tekken 8, familiarity with game controls and basic combos"
  },
  {
    id: "data-diviation",
    image: "/assets/Poster.png",
    name: "Data Diviation",
    shortDescription: "Analyze complex datasets to derive meaningful insights",
    description: "Data Diviation challenges participants to analyze complex datasets and derive meaningful insights. Showcase your data analysis skills, statistical knowledge, and visualization techniques in this competitive event.",
    category: EVENT_CATEGORIES.TECHNICAL,
    teamSize: { min: 1, max: 1 },
    venue: "Computer Lab 2",
    festDay: FEST_DAYS.DAY_1,
    date: FEST_DATES.DAY_1,
    time: "10:00 AM",
    duration: "2 hours",
    registrationStatus: REGISTRATION_STATUS.OPEN,
    prizes: [
      { position: "1st", reward: "₹7,000 + Certificate" },
      { position: "2nd", reward: "₹4,000 + Certificate" },
      { position: "3rd", reward: "₹2,000 + Certificate" }
    ],
    coordinators: [
      { name: "Dr. Neha Gupta", email: "neha.gupta@example.com", phone: "9876543214" }
    ],
    rules: [
      "Individual participation only",
      "Time limit: 4 hours",
      "Participants can use any data analysis tool or programming language",
      "Final submission should include analysis code, visualizations, and a report"
    ],
    instructions: "Bring your own laptop with required software installed",
    resources: "Recommended tools: Python (pandas, matplotlib, scikit-learn), R, Tableau"
  },
  {
    id: "poster-making",
    image: "/assets/Poster.png",
    name: "Digital Poster Making",
    shortDescription: "Design creative digital posters on given themes",
    description: "Digital Poster Making is a creative competition where participants design digital posters based on given themes. Showcase your graphic design skills, creativity, and visual storytelling abilities!",
    category: EVENT_CATEGORIES.CREATIVE,
    teamSize: { min: 1, max: 1 },
    venue: "Design Lab",
    festDay: FEST_DAYS.DAY_2,
    date: FEST_DATES.DAY_2,
    time: "10:00 AM",
    duration: "2 hours",
    registrationStatus: REGISTRATION_STATUS.OPEN,
    prizes: [
      { position: "1st", reward: "₹4,000 + Certificate" },
      { position: "2nd", reward: "₹2,500 + Certificate" },
      { position: "3rd", reward: "₹1,500 + Certificate" }
    ],
    coordinators: [
      { name: "Ananya Desai", email: "ananya.desai@example.com", phone: "9876543215" }
    ],
    rules: [
      "Individual participation only",
      "Time limit: 3 hours",
      "Theme will be announced on the day of the event",
      "Participants must create original artwork",
      "Final poster should be submitted in digital format (PNG/JPG)"
    ],
    instructions: "Bring your own laptop with design software installed",
    resources: "Recommended software: Adobe Photoshop, Illustrator, Canva, GIMP"
  },
  {
    id: "reel-comp",
    image: "/assets/Poster.png",
    name: "Tech Reel War",
    shortDescription: "Create engaging tech-themed short video reels",
    description: "Tech Reel War challenges participants to create engaging and informative short video reels on technology-related topics. Showcase your video editing skills, creativity, and ability to communicate complex tech concepts in an engaging way!",
    category: EVENT_CATEGORIES.CREATIVE,
    teamSize: { min: 1, max: 1 },
    venue: "Virtual",
    festDay: FEST_DAYS.DAY_1,
    date: FEST_DATES.DAY_1,
    time: "10:00 AM",
    duration: "2 hours",
    registrationStatus: REGISTRATION_STATUS.OPEN,
    prizes: [
      { position: "1st", reward: "₹5,000 + Certificate" },
      { position: "2nd", reward: "₹3,000 + Certificate" },
      { position: "3rd", reward: "₹2,000 + Certificate" }
    ],
    coordinators: [
      { name: "Karan Malhotra", email: "karan.malhotra@example.com", phone: "9876543216" }
    ],
    rules: [
      "Individual participation only",
      "Reel duration: 30-60 seconds",
      "Topic must be technology-related",
      "Content must be original and created specifically for this competition",
      "Submission deadline: April 10, 2024, 11:59 PM"
    ],
    instructions: "Submit your reel through the provided submission portal",
    resources: "Recommended apps: Instagram, TikTok, CapCut, Adobe Premiere Rush"
  }
];

// WhatsApp group links for different events
export const WHATSAPP_GROUP_LINKS = {
  "Seminar": "https://chat.whatsapp.com/JKLMNOPQRSTUVWXYZabcdef",
  "debug-code": "https://chat.whatsapp.com/ABCDEFGHIJKLMNOPQRSTUv",
  "ai-artistry": "https://chat.whatsapp.com/123456789abcdefghijklm",
  "gaming": "https://chat.whatsapp.com/nopqrstuvwxyz1234567890",
  "data-diviation": "https://chat.whatsapp.com/abcdefghijklmnopqrstuv",
  "poster-making": "https://chat.whatsapp.com/wxyz1234567890abcdefghi",
  "reel-comp": "https://chat.whatsapp.com/jklmnopqrstuvwxyz123456",
  // Default group for all Techelons participants
  "default": "https://chat.whatsapp.com/techelons-general-group"
};

/**
 * Helper functions to work with events data
 */

// Required fields for a complete event
const REQUIRED_EVENT_FIELDS = Object.freeze([
  'id', 'name', 'shortDescription', 'description', 'category',
  'teamSize', 'venue', 'festDay', 'registrationStatus',
  'prizes', 'coordinators', 'rules', 'instructions'
]);

// Date mapping for quick lookup
const DATE_MAP = Object.freeze({
  [FEST_DAYS.DAY_1]: FEST_DATES.DAY_1,
  [FEST_DAYS.DAY_2]: FEST_DATES.DAY_2
});

// Create a cache for event data
const eventCache = new MemoryCache(3600000); // 1 hour TTL

// Helper function to check if a field is valid (not null, undefined, or empty string)
const isValidField = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
};

/**
 * Get an event by its ID
 * @param {string} eventId - The event ID to look up
 * @returns {Object|null} - The event object or null if not found
 */
export const getEventById = memoizeWithTTL((eventId) => {
  if (!isValidField(eventId)) return null;

  const cacheKey = `event_${eventId}`;
  const cachedEvent = eventCache.get(cacheKey);
  if (cachedEvent) return cachedEvent;

  const event = TECHELONS_EVENTS.find(e => e.id === eventId);
  if (event) {
    eventCache.set(cacheKey, event);
  }

  return event || null;
}, { ttlMs: 3600000 }); // 1 hour TTL

/**
 * Filter events by a specific property
 * @param {string} property - The property to filter by
 * @param {any} value - The value to match
 * @returns {Array} - Array of matching events
 */
const filterEventsByProperty = memoizeWithTTL((property, value) => {
  if (!isValidField(property) || !isValidField(value)) return [];

  const cacheKey = `events_by_${property}_${value}`;
  const cachedEvents = eventCache.get(cacheKey);
  if (cachedEvents) return cachedEvents;

  const filteredEvents = TECHELONS_EVENTS.filter(event => {
    // Handle nested properties (e.g., "teamSize.min")
    if (property.includes('.')) {
      const [parentProp, childProp] = property.split('.');
      return event[parentProp] && event[parentProp][childProp] === value;
    }

    return event[property] === value;
  });

  eventCache.set(cacheKey, filteredEvents);
  return filteredEvents;
}, { ttlMs: 3600000 }); // 1 hour TTL

/**
 * Get events by category
 * @param {string} category - The category to filter by
 * @returns {Array} - Array of events in the specified category
 */
export const getEventsByCategory = (category) => {
  return filterEventsByProperty('category', category);
};

/**
 * Get events by registration status
 * @param {string} status - The registration status to filter by
 * @returns {Array} - Array of events with the specified registration status
 */
export const getEventsByStatus = (status) => {
  // If master switch is off and we're looking for open events, return empty array
  if (!REGISTRATION_ENABLED && status === REGISTRATION_STATUS.OPEN) {
    return [];
  }

  // If master switch is off and we're looking for closed events, return all events
  if (!REGISTRATION_ENABLED && status === REGISTRATION_STATUS.CLOSED) {
    return [...TECHELONS_EVENTS];
  }

  // Otherwise, filter by the registration status
  return filterEventsByProperty('registrationStatus', status);
};

/**
 * Get team size requirements for an event
 * @param {string} eventId - The event ID to look up
 * @returns {Object|null} - The team size requirements or null if not found
 */
export const getTeamSizeRequirements = (eventId) => {
  const event = getEventById(eventId);
  return event ? event.teamSize : null;
};

/**
 * Get all events with open registration
 * @returns {Array} - Array of events with open registration
 */
export const getOpenRegistrationEvents = memoizeWithTTL(() => {
  const cacheKey = 'open_registration_events';
  const cachedEvents = eventCache.get(cacheKey);
  if (cachedEvents) return cachedEvents;

  // Master switch check
  if (!REGISTRATION_ENABLED) {
    eventCache.set(cacheKey, []);
    return [];
  }

  const openEvents = TECHELONS_EVENTS.filter(event =>
    event.registrationStatus === REGISTRATION_STATUS.OPEN
  );

  eventCache.set(cacheKey, openEvents);
  return openEvents;
}, { ttlMs: 3600000 }); // 1 hour TTL

/**
 * Get coordinators for an event
 * @param {string} eventId - The event ID to look up
 * @returns {Array} - Array of coordinator objects
 */
export const getEventCoordinators = (eventId) => {
  const event = getEventById(eventId);
  return event && event.coordinators ? event.coordinators : [];
};

/**
 * Format event date and time information
 * @param {Object} event - The event object
 * @returns {Object} - Formatted date and time information
 */
export const formatEventDateTime = memoizeWithTTL((event) => {
  if (!event) {
    return {
      formattedDate: "To be announced",
      formattedTime: "To be announced",
      dayOfWeek: ""
    };
  }

  try {
    // Determine the event date based on festDay or specific date
    let eventDate = event.date;
    if (!eventDate && event.festDay) {
      eventDate = event.festDay === FEST_DAYS.DAY_1 ? FEST_DATES.DAY_1 : FEST_DATES.DAY_2;
    }

    // Format the date
    const formattedDate = DATE_UTILS.formatDate(eventDate);

    // Get day of week
    const dayOfWeek = DATE_UTILS.getDayOfWeek(eventDate);

    // Format the time
    const formattedTime = DATE_UTILS.formatTime(event.time);

    return {
      formattedDate,
      formattedTime,
      dayOfWeek
    };
  } catch (error) {
    console.error("Error formatting event date/time:", error);
    return {
      formattedDate: "To be announced",
      formattedTime: "To be announced",
      dayOfWeek: ""
    };
  }
}, {
  ttlMs: 3600000, // 1 hour TTL
  keyFn: (event) => `event_datetime_${event?.id || 'unknown'}`
});

/**
 * Get WhatsApp group link for an event
 * @param {string} eventId - The event ID to look up
 * @returns {string|null} - The WhatsApp group link or null if not found
 */
export const getWhatsAppGroupLink = (eventId) => {
  // First check if there's a direct match in the WHATSAPP_GROUP_LINKS object
  if (WHATSAPP_GROUP_LINKS[eventId]) {
    return WHATSAPP_GROUP_LINKS[eventId];
  }

  // If no direct match, return the default group link
  return WHATSAPP_GROUP_LINKS.default || null;
};

/**
 * Get events formatted for form selection
 * @returns {Array} - Array of events formatted for form selection
 */
export const getEventsForForm = memoizeWithTTL(() => {
  // If master switch is off, return empty array as no events are open for registration
  if (!REGISTRATION_ENABLED) {
    return [];
  }

  const cacheKey = 'events_for_form';
  const cachedEvents = eventCache.get(cacheKey);
  if (cachedEvents) return cachedEvents;

  const formattedEvents = TECHELONS_EVENTS
    .filter(event => event.registrationStatus === REGISTRATION_STATUS.OPEN)
    .map(event => ({
      id: event.id,
      name: event.name,
      category: event.category,
      teamSize: event.teamSize
    }));

  eventCache.set(cacheKey, formattedEvents);
  return formattedEvents;
}, { ttlMs: 3600000 }); // 1 hour TTL

/**
 * Clear all cached data
 */
export const clearCache = () => {
  eventCache.clear();
};

/**
 * Check if global registration is open based on master switch and deadline
 * @returns {boolean} - Whether global registration is open
 */
export const isRegistrationOpen = memoizeWithTTL(() => {
  // Check master switch - if it's off, all registrations are closed
  if (!REGISTRATION_ENABLED) return false;

  // Check registration deadline
  const deadline = DATE_UTILS.parseDate(FEST_DATES.REGISTRATION_DEADLINE);
  if (!deadline) return true; // If no deadline is set, registration is open

  const now = new Date();
  return now <= deadline;
}, { ttlMs: 60000 }); // 1 minute TTL

/**
 * Get global registration status message
 * @returns {Object} - Registration status message
 */
export const getRegistrationStatusMessage = memoizeWithTTL(() => {
  // If master switch is off, all registrations are closed
  if (!REGISTRATION_ENABLED) {
    return {
      open: false,
      message: "Registration is currently closed."
    };
  }

  const deadline = DATE_UTILS.parseDate(FEST_DATES.REGISTRATION_DEADLINE);
  if (!deadline) {
    return {
      open: true,
      message: "Registration is open."
    };
  }

  const now = new Date();
  if (now <= deadline) {
    const daysRemaining = DATE_UTILS.getDaysRemaining(FEST_DATES.REGISTRATION_DEADLINE);
    return {
      open: true,
      message: `Registration is open. Closes in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`
    };
  } else {
    return {
      open: false,
      message: "Registration is closed. The deadline has passed."
    };
  }
}, { ttlMs: 60000 }); // 1 minute TTL

/**
 * Get events by fest day
 * @param {string} day - The fest day to filter by (day1 or day2)
 * @returns {Array} - Array of events on the specified day
 */
export const getEventsByFestDay = memoizeWithTTL((day) => {
  if (!isValidField(day) || !Object.values(FEST_DAYS).includes(day)) {
    return [];
  }

  const cacheKey = `events_by_festday_${day}`;
  const cachedEvents = eventCache.get(cacheKey);
  if (cachedEvents) return cachedEvents;

  const filteredEvents = TECHELONS_EVENTS.filter(event => event.festDay === day);

  eventCache.set(cacheKey, filteredEvents);
  return filteredEvents;
}, { ttlMs: 3600000 }); // 1 hour TTL

/**
 * Get the effective registration status for an event, taking into account the master switch
 * @param {Object} event - The event object or event registration status
 * @returns {string} - The effective registration status (OPEN, CLOSED, or COMING_SOON)
 */
export const getEffectiveRegistrationStatus = memoizeWithTTL((event) => {
  // If master switch is off, all registrations are closed regardless of individual event status
  if (!REGISTRATION_ENABLED) {
    return REGISTRATION_STATUS.CLOSED;
  }

  // If event is a string (status), return it directly
  if (typeof event === 'string') {
    return event;
  }

  // Otherwise, return the event's registration status
  return event?.registrationStatus || REGISTRATION_STATUS.CLOSED;
}, { ttlMs: 60000 }); // 1 minute TTL