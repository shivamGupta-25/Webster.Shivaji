// "use client"

// import { useMemo, useState, memo, useEffect, useCallback, useRef } from "react"
// import PropTypes from 'prop-types'
// import { ErrorBoundary } from 'react-error-boundary'
// import { createGlobalStyle } from 'styled-components'
// import { ArrowRight, MapPin, Calendar, Filter, Info, User, Search, X, CalendarDays, Trophy } from "lucide-react"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Card, CardContent } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Skeleton } from "@/components/ui/skeleton"
// import { cn } from "@/lib/utils"
// import {
//     FEST_DAYS,
//     FEST_DATES,
//     getEventsByFestDay,
//     formatEventDateTime
// } from "@/app/_data/techelonsEventsData"
// import EventModal from "./TechelonsEventDialog"

// /**
//  * Global styles for animations
//  */
// const GlobalStyle = createGlobalStyle`
//   @keyframes fadeIn {
//     from { 
//       opacity: 0; 
//       transform: translate3d(0, 5px, 0); 
//     }
//     to { 
//       opacity: 1; 
//       transform: translate3d(0, 0, 0); 
//     }
//   }
  
//   .animate-fadeIn {
//     animation: fadeIn 0.25s ease-out forwards;
//     will-change: opacity, transform;
//     transform: translateZ(0);
//   }
// `

// // Constants
// const DEFAULT_EVENT_IMAGE = "/placeholder.svg?height=160&width=320"
// const LOADING_TIMEOUT = 800
// const ANIMATION_DELAY = 50

// /**
//  * Category styling configuration with colors
//  */
// const CATEGORY_STYLES = {
//     Ceremony: {
//         color: "bg-primary text-primary-foreground hover:bg-primary/90",
//     },
//     Competition: {
//         color: "bg-blue-500 text-white hover:bg-blue-600",
//     },
//     Seminar: {
//         color: "bg-indigo-500 text-white hover:bg-indigo-600",
//     },
//     Workshop: {
//         color: "bg-emerald-500 text-white hover:bg-emerald-600",
//     },
//     Presentation: {
//         color: "bg-amber-500 text-white hover:bg-amber-600",
//     },
//     default: {
//         color: "bg-gray-500 text-white hover:bg-gray-600",
//     },
// }

// /**
//  * Resolves image paths to their correct location
//  * @param {string} imagePath - The raw image path
//  * @returns {string} The resolved image path
//  */
// const getImagePath = (imagePath) => {
//     if (!imagePath) return DEFAULT_EVENT_IMAGE
//     if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath
//     if (imagePath.startsWith("/public/")) return imagePath.replace("/public", "")
//     if (imagePath === "Poster2.jpg" || imagePath === "Poster.png") return `/assets/${imagePath}`
//     if (!imagePath.startsWith("/")) return `/${imagePath}`
//     return imagePath
// }

// /**
//  * Gets the appropriate style for a category
//  * @param {string} category - The event category
//  * @returns {Object} The style object for the category
//  */
// const getCategoryStyle = (category) => {
//     if (!category) return CATEGORY_STYLES.default
//     const categoryKey = Object.keys(CATEGORY_STYLES).find((key) =>
//         category.toLowerCase().includes(key.toLowerCase())
//     )
//     return categoryKey ? CATEGORY_STYLES[categoryKey] : CATEGORY_STYLES.default
// }

// /**
//  * Custom hook for event filtering functionality
//  * @param {Array} scheduleData - The event schedule data
//  * @returns {Object} Filtering state and functions
//  */
// const useEventFiltering = (scheduleData) => {
//     const [activeDay, setActiveDay] = useState(FEST_DAYS.DAY_1)
//     const [activeFilter, setActiveFilter] = useState("all")
//     const [searchTerm, setSearchTerm] = useState("")

//     // Get all categories for filtering
//     const allCategories = useMemo(() => {
//         const categories = new Set()
//         scheduleData.forEach((day) => {
//             day.events.forEach((event) => {
//                 if (event.category) categories.add(event.category)
//             })
//         })
//         return Array.from(categories).sort()
//     }, [scheduleData])

//     // Filter and sort events
//     const filteredEvents = useMemo(() => {
//         const currentDayEvents = scheduleData.find((day) => day.value === activeDay)?.events || []

//         return currentDayEvents
//             .filter((event) => {
//                 // Filter by category
//                 if (activeFilter !== "all" && event.category !== activeFilter) return false

//                 // Filter by search term
//                 if (searchTerm) {
//                     const searchLower = searchTerm.toLowerCase()
//                     return (
//                         event.name.toLowerCase().includes(searchLower) ||
//                         (event.description && event.description.toLowerCase().includes(searchLower)) ||
//                         (event.venue && event.venue.toLowerCase().includes(searchLower)) ||
//                         (event.speaker && event.speaker.toLowerCase().includes(searchLower))
//                     )
//                 }

//                 return true
//             })
//             .sort((a, b) => {
//                 // Sort by time (ascending by default)
//                 return new Date(`2023-10-27T${a.startTime}`) - new Date(`2023-10-27T${b.startTime}`)
//             })
//     }, [activeDay, activeFilter, searchTerm, scheduleData])

//     const resetFilters = useCallback(() => {
//         setActiveFilter("all")
//         setSearchTerm("")
//     }, [])

//     return {
//         activeDay,
//         setActiveDay,
//         activeFilter,
//         setActiveFilter,
//         searchTerm,
//         setSearchTerm,
//         allCategories,
//         filteredEvents,
//         resetFilters
//     }
// }

// /**
//  * Custom hook for modal handling
//  * @returns {Object} Modal state and functions
//  */
// const useEventModal = () => {
//     const [selectedEvent, setSelectedEvent] = useState(null)
//     const [isModalOpen, setIsModalOpen] = useState(false)

//     const openEventModal = useCallback((event) => {
//         setSelectedEvent(event)
//         setIsModalOpen(true)
//     }, [])

//     const closeEventModal = useCallback(() => {
//         setIsModalOpen(false)
//         setTimeout(() => setSelectedEvent(null), 300) // Clear after animation
//     }, [])

//     return {
//         selectedEvent,
//         isModalOpen,
//         openEventModal,
//         closeEventModal
//     }
// }

// /**
//  * Loading skeleton for event cards
//  */
// const EventCardSkeleton = memo(() => (
//     <Card className="overflow-hidden h-full border-0 bg-white dark:bg-gray-900 shadow-md rounded-xl animate-pulse">
//         <CardContent className="p-0 h-full flex flex-col">
//             {/* Image skeleton with responsive aspect ratio */}
//             <div
//                 className="w-full overflow-hidden relative bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
//                 style={{ paddingTop: '56.25%' }} // 16:9 aspect ratio
//             >
//                 <Skeleton className="absolute inset-0 w-full h-full" />
//                 <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-end">
//                     <Skeleton className="h-4 w-16 sm:h-5 sm:w-20 rounded-full" />
//                 </div>
//             </div>
//             <div className="p-3 sm:p-4 flex flex-col flex-grow space-y-2 sm:space-y-3">
//                 <div className="flex items-center">
//                     <Skeleton className="h-5 w-5 rounded-full mr-2" />
//                     <Skeleton className="h-4 w-24 sm:h-5 sm:w-28" />
//                 </div>
//                 <Skeleton className="h-5 w-5/6 sm:h-6" />
//                 <div className="flex">
//                     <Skeleton className="h-4 w-28 sm:h-5 sm:w-32 rounded-md" />
//                 </div>
//                 <Skeleton className="h-3 w-full sm:h-4" />
//                 <Skeleton className="h-3 w-5/6 sm:h-4" />
//                 <div className="mt-auto pt-2">
//                     <Skeleton className="h-8 w-full sm:h-9 rounded-md" />
//                 </div>
//             </div>
//         </CardContent>
//     </Card>
// ))

// /**
//  * Custom hook for image handling in EventCard
//  * @param {string} imagePath - The image path
//  * @returns {Object} Image state and handlers
//  */
// const useEventCardImage = (imagePath) => {
//     const [imageError, setImageError] = useState(false)
//     const [imageLoading, setImageLoading] = useState(true)
//     const [imageAspectRatio, setImageAspectRatio] = useState(16 / 9) // Default aspect ratio
//     const [imageHeight, setImageHeight] = useState(0)
//     const [imageWidth, setImageWidth] = useState(0)

//     const handleImageLoad = useCallback((e) => {
//         setImageLoading(false)

//         // Calculate aspect ratio and store dimensions
//         const naturalHeight = e.target.naturalHeight;
//         const naturalWidth = e.target.naturalWidth;

//         if (naturalHeight && naturalWidth) {
//             setImageAspectRatio(naturalWidth / naturalHeight);
//             setImageHeight(naturalHeight);
//             setImageWidth(naturalWidth);
//         }
//     }, [])

//     const handleImageError = useCallback(() => {
//         setImageError(true)
//         setImageLoading(false)
//     }, [])

//     return {
//         imageError,
//         imageLoading,
//         imageAspectRatio,
//         imageHeight,
//         imageWidth,
//         handleImageLoad,
//         handleImageError
//     }
// }

// /**
//  * EventCard component for displaying event information
//  */
// const EventCard = memo(({ event, openEventModal, index }) => {
//     const imagePath = useMemo(() => getImagePath(event.image), [event.image])
//     const categoryStyle = useMemo(() => getCategoryStyle(event.category), [event.category])
//     const { formattedDate, dayOfWeek, formattedTime } = useMemo(() => formatEventDateTime(event), [event])
//     const imageContainerRef = useRef(null)
    
//     // Get event day (Day 1 or Day 2) from the event object
//     const eventDay = useMemo(() => {
//         return event.festDay === FEST_DAYS.DAY_1 ? "Day 1" : "Day 2"
//     }, [event.festDay])

//     const {
//         imageError,
//         imageLoading,
//         imageAspectRatio,
//         imageHeight,
//         imageWidth,
//         handleImageLoad,
//         handleImageError
//     } = useEventCardImage(imagePath)

//     return (
//         <Card
//             className="group overflow-hidden h-full border-0 bg-white dark:bg-gray-900 shadow-md rounded-xl relative will-change-transform hover:shadow-lg p-0"
//             style={{
//                 animationDelay: `${Math.min(index * 0.03, 0.3)}s`,
//                 transform: "translateZ(0)", // Force GPU acceleration
//                 transition: "transform 0.2s ease-out, box-shadow 0.2s ease-out",
//             }}
//             onMouseEnter={(e) => {
//                 e.currentTarget.style.transform = "translateZ(0) translateY(-4px)";
//             }}
//             onMouseLeave={(e) => {
//                 e.currentTarget.style.transform = "translateZ(0)";
//             }}
//         >
//             {event.featured && (
//                 <div className="absolute top-0 right-0 z-10">
//                     <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 rounded-tl-none rounded-br-none font-medium text-xs shadow-md">
//                         ⭐ Featured
//                     </Badge>
//                 </div>
//             )}

//             <CardContent className="p-0 h-full flex flex-col">
//                 {/* Event Image Container - Adaptive to image dimensions */}
//                 <div
//                     ref={imageContainerRef}
//                     className="w-full overflow-hidden relative bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
//                     style={{
//                         height: imageLoading ? '0' : 'auto',
//                         minHeight: imageLoading ? '200px' : 'auto',
//                         maxHeight: '16rem', // Maximum height constraint
//                     }}
//                 >
//                     {imageLoading && (
//                         <div className="absolute inset-0 flex items-center justify-center">
//                             <Skeleton className="w-full h-full" />
//                         </div>
//                     )}
//                     <img
//                         src={!imageError ? imagePath : DEFAULT_EVENT_IMAGE}
//                         alt={event.name}
//                         className={cn(
//                             "w-full h-auto", // Allow image to determine its own height based on aspect ratio
//                             imageLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300",
//                             "transform transition-transform duration-300 ease-out group-hover:scale-[1.03]"
//                         )}
//                         style={{
//                             transform: "translateZ(0)", // Force GPU acceleration
//                             transformOrigin: "center center",
//                             display: "block", // Remove any default spacing
//                         }}
//                         onError={handleImageError}
//                         onLoad={handleImageLoad}
//                         loading="lazy" // Add lazy loading for better performance
//                     />
//                 </div>

//                 <div className="p-3 sm:p-4 flex flex-col flex-grow bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/80 transition-colors duration-200">
//                                     {/* Event Day - Added here */}
//                     <div className="flex items-center mb-2">
//                         <div className="bg-primary/10 text-primary rounded-full p-1 sm:p-1.5 mr-2">
//                             <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
//                         </div>
//                         <div className="flex items-center">
//                             <span className="font-medium text-xs sm:text-sm">{eventDay}</span>
//                         </div>
//                     </div>
//                     {/* Date */}
//                     <div className="flex items-center mb-2">
//                         <div className="bg-primary/10 text-primary rounded-full p-1 sm:p-1.5 mr-2">
//                             <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
//                         </div>
//                         <div className="flex flex-col">
//                             <span className="font-medium text-xs sm:text-sm">{formattedDate}</span>
//                             <div className="flex items-center gap-1">
//                                 <span className="text-xs text-muted-foreground">{dayOfWeek}</span>
//                                 {formattedTime && (
//                                     <>
//                                         <span className="text-xs text-muted-foreground">•</span>
//                                         <span className="text-xs text-muted-foreground">{formattedTime}</span>
//                                     </>
//                                 )}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Event Title */}
//                     <h3 className="text-sm sm:text-base md:text-lg font-bold mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">{event.name}</h3>

//                     {/* Venue */}
//                     <div className="inline-flex items-center text-xs text-muted-foreground mb-2 bg-muted/50 py-1 px-2 rounded-md">
//                         <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 flex-shrink-0" />
//                         <span className="truncate">{event.venue}</span>
//                     </div>

//                     {/* Description */}
//                     <p className="text-muted-foreground text-xs mb-3 flex-grow line-clamp-2">
//                         {event.shortDescription}
//                     </p>

//                     {/* Speaker and contact info */}
//                     {event.speaker && (
//                         <div className="mb-2 text-xs">
//                             <div className="inline-flex items-center bg-primary/5 py-1 px-2 rounded-md">
//                                 <User className="h-3 w-3 mr-1.5 text-primary flex-shrink-0" />
//                                 <span className="font-medium text-primary">Speaker:</span>
//                                 <span className="ml-1 truncate text-muted-foreground">{event.speaker}</span>
//                             </div>
//                         </div>
//                     )}

//                     {event.coordinators && event.coordinators.length > 0 && (
//                         <div className="mb-3 text-xs">
//                             <div className="inline-flex items-center bg-primary/5 py-1 px-2 rounded-md">
//                                 <User className="h-3 w-3 mr-1.5 text-primary flex-shrink-0" />
//                                 <span className="font-medium text-primary">Contact:</span>
//                                 <span className="ml-1 truncate text-muted-foreground">{event.coordinators[0].name}</span>
//                             </div>
//                         </div>
//                     )}

//                     {/* Prize Pool Information */}
//                     {event.prizes && event.prizes.length > 0 && (
//                         <div className="mb-3 text-xs">
//                             <div className="inline-flex items-center bg-amber-50 dark:bg-amber-950/30 py-1 px-2 rounded-md">
//                                 <Trophy className="h-3 w-3 mr-1.5 text-amber-500 flex-shrink-0" />
//                                 <span className="font-medium text-amber-600 dark:text-amber-400">Prize Pool:</span>
//                                 <span className="ml-1 truncate text-muted-foreground">
//                                     {event.prizes.some(prize => prize.reward && typeof prize.reward === 'string' && prize.reward.includes('₹')) ? 
//                                         (() => {
//                                             // Extract and sum up all monetary prizes
//                                             const totalPrize = event.prizes.reduce((total, prize) => {
//                                                 if (prize.reward && typeof prize.reward === 'string') {
//                                                     const match = prize.reward.match(/₹([\d,]+)/);
//                                                     if (match && match[1]) {
//                                                         // Convert string like "5,000" to number 5000
//                                                         const amount = parseInt(match[1].replace(/,/g, ''), 10);
//                                                         return isNaN(amount) ? total : total + amount;
//                                                     }
//                                                 }
//                                                 return total;
//                                             }, 0);
                                            
//                                             // Format the total with commas
//                                             return `₹${totalPrize.toLocaleString('en-IN')} + Certificate`;
//                                         })() 
//                                         : 'Certificates'
//                                     }
//                                 </span>
//                             </div>
//                         </div>
//                     )}

//                     <div className="mt-auto pt-1">
//                         <Button
//                             onClick={() => openEventModal(event)}
//                             className="w-full transition-all duration-200 hover:shadow-md relative overflow-hidden group/button text-xs sm:text-sm"
//                             variant="default"
//                         >
//                             <span className="flex items-center justify-center w-full relative z-10">
//                                 View Details
//                                 <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300 ease-in-out group-hover/button:translate-x-1" />
//                             </span>
//                             <span className="absolute inset-0 bg-primary-foreground opacity-0 group-hover/button:opacity-10 transition-opacity duration-200"></span>
//                         </Button>
//                     </div>
//                 </div>
//             </CardContent>
//         </Card>
//     )
// })

// /**
//  * Filter component for filtering events
//  */
// const EventFilter = memo(
//     ({ categories, activeFilter, setActiveFilter, searchTerm, setSearchTerm }) => (
//         <div className="bg-white dark:bg-gray-900 rounded-xl border p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
//             <div className="w-full">
//                 <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input
//                         placeholder="Search events..."
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="pl-9"
//                         aria-label="Search events"
//                     />
//                     {searchTerm && (
//                         <button
//                             onClick={() => setSearchTerm("")}
//                             className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                             aria-label="Clear search"
//                         >
//                             <X className="h-4 w-4" />
//                         </button>
//                     )}
//                 </div>
//             </div>

//             <div className="mt-3 sm:mt-4">
//                 <h3 className="text-sm font-medium mb-2 flex items-center">
//                     <Filter className="h-4 w-4 mr-2 text-primary" />
//                     Filter by Category:
//                 </h3>
//                 <div className="flex flex-wrap gap-2 mt-2">
//                     <Badge
//                         onClick={() => setActiveFilter("all")}
//                         className={cn(
//                             "cursor-pointer px-2 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200 hover:shadow-md",
//                             activeFilter === "all"
//                                 ? "bg-primary text-primary-foreground font-medium transform scale-105"
//                                 : "bg-background hover:bg-muted text-foreground border hover:border-primary/30 hover:scale-105",
//                         )}
//                     >
//                         All Events
//                     </Badge>

//                     {categories.map((category) => {
//                         const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.default;
//                         return (
//                             <Badge
//                                 key={category}
//                                 onClick={() => setActiveFilter(category)}
//                                 className={cn(
//                                     "cursor-pointer px-2 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200 hover:shadow-md",
//                                     activeFilter === category
//                                         ? `${style.color} transform scale-105`
//                                         : "bg-background hover:bg-muted text-foreground border hover:border-primary/30 hover:scale-105",
//                                 )}
//                             >
//                                 {category}
//                             </Badge>
//                         );
//                     })}
//                 </div>
//             </div>
//         </div>
//     ),
// )

// /**
//  * Error Fallback Component for error boundary
//  */
// const ErrorFallback = memo(({ error, resetErrorBoundary }) => (
//     <div className="text-center py-8 sm:py-12 max-w-md mx-auto px-4">
//         <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-5">
//             <Info className="h-7 w-7 sm:h-9 sm:w-9 text-primary" />
//         </div>
//         <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Something went wrong</h3>
//         <p className="text-muted-foreground text-sm sm:text-base bg-muted/50 p-3 sm:p-4 rounded-lg border shadow-sm mb-4">
//             {error.message}
//         </p>
//         <Button onClick={resetErrorBoundary} variant="outline" className="text-sm sm:text-base">
//             Try again
//         </Button>
//     </div>
// ))

// // PropTypes
// EventCard.propTypes = {
//     event: PropTypes.shape({
//         id: PropTypes.string.isRequired,
//         name: PropTypes.string.isRequired,
//         category: PropTypes.string,
//         image: PropTypes.string,
//         startTime: PropTypes.string.isRequired,
//         venue: PropTypes.string.isRequired,
//         description: PropTypes.string,
//         shortDescription: PropTypes.string,
//         speaker: PropTypes.string,
//         coordinators: PropTypes.arrayOf(PropTypes.shape({
//             name: PropTypes.string.isRequired,
//             email: PropTypes.string,
//             phone: PropTypes.string
//         })),
//         featured: PropTypes.bool
//     }).isRequired,
//     openEventModal: PropTypes.func.isRequired,
//     index: PropTypes.number.isRequired
// }

// EventFilter.propTypes = {
//     categories: PropTypes.arrayOf(PropTypes.string).isRequired,
//     activeFilter: PropTypes.string.isRequired,
//     setActiveFilter: PropTypes.func.isRequired,
//     searchTerm: PropTypes.string.isRequired,
//     setSearchTerm: PropTypes.func.isRequired
// }

// ErrorFallback.propTypes = {
//     error: PropTypes.shape({
//         message: PropTypes.string.isRequired
//     }).isRequired,
//     resetErrorBoundary: PropTypes.func.isRequired
// }

// /**
//  * Main EventSchedule component
//  */
// const EventSchedule = () => {
//     const [isLoading, setIsLoading] = useState(true)
//     const eventsRef = useRef(null)

//     // Get schedule data
//     const scheduleData = useMemo(
//         () => [
//             {
//                 day: "Day 1",
//                 date: FEST_DATES.DAY_1,
//                 value: FEST_DAYS.DAY_1,
//                 events: getEventsByFestDay(FEST_DAYS.DAY_1),
//             },
//             {
//                 day: "Day 2",
//                 date: FEST_DATES.DAY_2,
//                 value: FEST_DAYS.DAY_2,
//                 events: getEventsByFestDay(FEST_DAYS.DAY_2),
//             },
//         ],
//         []
//     )

//     // Custom hooks
//     const {
//         activeDay,
//         setActiveDay,
//         activeFilter,
//         setActiveFilter,
//         searchTerm,
//         setSearchTerm,
//         allCategories,
//         filteredEvents,
//         resetFilters
//     } = useEventFiltering(scheduleData)

//     const {
//         selectedEvent,
//         isModalOpen,
//         openEventModal,
//         closeEventModal
//     } = useEventModal()

//     // Simulate loading with a shorter timeout
//     useEffect(() => {
//         const timer = setTimeout(() => {
//             setIsLoading(false)
//         }, LOADING_TIMEOUT)
//         return () => clearTimeout(timer)
//     }, [])

//     return (
//         <ErrorBoundary FallbackComponent={ErrorFallback}>
//             <>
//                 <GlobalStyle />
//                 <section
//                     ref={eventsRef}
//                     className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8"
//                 >
//                     <h2 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-4 sm:mb-6 text-center">Event Schedule</h2>
//                     <Tabs defaultValue={activeDay} onValueChange={setActiveDay} className="w-full">
//                         <div className="flex flex-col gap-6 mb-6">
//                             <TabsList className="bg-gradient-to-r gap-10 from-slate-50/80 to-slate-100/80 dark:from-slate-900/80 dark:to-slate-800/80 p-1.5 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm transition-all duration-500 ease-in-out w-full sm:w-auto mx-auto">
//                                 {scheduleData.map((day) => (
//                                     <TabsTrigger
//                                         key={day.value}
//                                         value={day.value}
//                                         className="px-3 sm:px-4 py-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md data-[state=active]:shadow-primary/10 data-[state=active]:text-primary data-[state=active]:font-medium data-[state=active]:scale-105 data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-400 ease-out hover:text-primary relative overflow-hidden group"
//                                     >
//                                         <span className="relative z-10 font-bold transition-transform duration-400 ease-out group-hover:translate-y-[-1px]">{day.day}</span>
//                                         <span className="relative z-10 ml-2 text-xs text-muted-foreground hidden sm:inline-block group-hover:text-primary/70 transition-all duration-400 ease-out">({day.date})</span>
//                                         <span className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-400 ease-out rounded-md"></span>
//                                     </TabsTrigger>
//                                 ))}
//                             </TabsList>

//                             <EventFilter
//                                 categories={allCategories}
//                                 activeFilter={activeFilter}
//                                 setActiveFilter={setActiveFilter}
//                                 searchTerm={searchTerm}
//                                 setSearchTerm={setSearchTerm}
//                             />
//                         </div>

//                         {scheduleData.map((day) => (
//                             <TabsContent key={day.value} value={day.value} className="mt-0">
//                                 {isLoading ? (
//                                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
//                                         {[...Array(6)].map((_, index) => (
//                                             <EventCardSkeleton key={index} />
//                                         ))}
//                                     </div>
//                                 ) : filteredEvents.length > 0 ? (
//                                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
//                                         {filteredEvents.map((event, index) => (
//                                             <EventCard
//                                                 key={event.id}
//                                                 event={event}
//                                                 openEventModal={openEventModal}
//                                                 index={index}
//                                             />
//                                         ))}
//                                     </div>
//                                 ) : (
//                                     <div className="text-center py-8 sm:py-12 bg-muted/30 rounded-lg border border-border">
//                                         <div className="mb-4 text-muted-foreground">
//                                             <Search className="h-10 w-10 sm:h-12 sm:w-12 mx-auto opacity-20" />
//                                         </div>
//                                         <h3 className="text-lg sm:text-xl font-semibold mb-2">No events found</h3>
//                                         <p className="text-muted-foreground text-sm sm:text-base px-4">
//                                             Try adjusting your filters or search term to find what you're looking for.
//                                         </p>
//                                         <Button
//                                             variant="outline"
//                                             className="mt-4"
//                                             onClick={resetFilters}
//                                         >
//                                             Reset filters
//                                         </Button>
//                                     </div>
//                                 )}
//                             </TabsContent>
//                         ))}
//                     </Tabs>

//                     {selectedEvent && (
//                         <EventModal event={selectedEvent} isOpen={isModalOpen} onClose={closeEventModal} />
//                     )}
//                 </section>
//             </>
//         </ErrorBoundary>
//     )
// }

// export default EventSchedule


{ /* Coming Soon Page */ }

import React, { useEffect, useState } from 'react';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';

const EventSchedule = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    createParticles();
    
    return () => {
      const container = document.getElementById('particles');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  const createParticles = () => {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 15;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 6 + 2;

      particle.style.position = 'absolute';
      particle.style.backgroundColor = '#88888815';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.borderRadius = '50%';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;

      const duration = Math.random() * 4 + 3;
      const delay = Math.random() * 3;
      particle.style.animation = `float ${duration}s infinite ease-in-out ${delay}s`;

      container.appendChild(particle);
    }
  };

  if (!mounted) return null;

  return (
    <section id="events" className="py-8 md:py-8 relative flex items-center justify-center">
      {/* Particle effect container */}
      <div id="particles" className="absolute inset-0 z-0"></div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-tr-full z-0"></div>
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-gradient-to-bl from-purple-500/10 to-indigo-500/10 rounded-bl-full z-0"></div>

      {/* Main content */}
      <div className="z-10 text-center w-full max-w-4xl px-4">
        <div className="mb-8 inline-block">
          <h1 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-wider bg-gradient-to-r from-black to-gray-700 bg-clip-text text-transparent" 
            style={{ 
              fontWeight: 900, 
              WebkitTextStroke: '1px rgba(0,0,0,0.1)', 
              letterSpacing: '0.05em' 
            }}
          >
            Events
          </h1>
          <div className="h-1.5 w-20 sm:w-24 md:w-28 lg:w-32 bg-gradient-to-r from-purple-500 to-indigo-600 mx-auto mt-2 md:mt-3 rounded-full"></div>
        </div>

        <h2 
          className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-5 md:mb-6 animate-fadeIn" 
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
        >
          Coming Soon!
        </h2>

        <p 
          className="text-base sm:text-lg md:text-xl max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 text-gray-600 animate-fadeIn" 
          style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
        >
          We're crafting something extraordinary at the intersection of innovation and possibility.
          Join us on this exciting journey into the future of technology.
        </p>

        <p 
          className="text-base sm:text-lg md:text-xl max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 text-gray-600 animate-fadeIn" 
          style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
        >
          Follow us to stay updated!
        </p>

        {/* Social links */}
        <div 
          className="flex justify-center gap-4 sm:gap-5 md:gap-6 animate-fadeIn" 
          style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}
        >
          <a
            href="https://www.instagram.com/websters.shivaji?igsh=MTRxaWFhMGUwMGR2eQ=="
            target="_blank"
            rel="noopener noreferrer"
            className="group relative"
            aria-label="Instagram"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 blur-md transition-all duration-300 -z-10 scale-0 group-hover:scale-125"></div>
            <FaInstagram size={28} className="sm:text-4xl text-gray-800 hover:scale-110 transition-transform duration-300 group-hover:text-white" />
          </a>

          <a
            href="https://www.linkedin.com/company/websters-shivaji-college/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative"
            aria-label="LinkedIn"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 blur-md transition-all duration-300 -z-10 scale-0 group-hover:scale-125"></div>
            <FaLinkedin size={28} className="sm:text-4xl text-gray-800 hover:scale-110 transition-transform duration-300 group-hover:text-white" />
          </a>
        </div>

        {/* Back to home button */}
        <div 
          className="mt-10 sm:mt-12 md:mt-16 flex justify-center animate-fadeIn" 
          style={{ animationDelay: '1200ms', animationFillMode: 'forwards' }}
        >
          <button
            className="group relative overflow-hidden py-2 sm:py-3 px-6 sm:px-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base md:text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            onClick={() => window.location.href = '/'}
          >
            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
            <span className="relative flex items-center justify-center gap-2">
              Back to Home page
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="w-3 h-3 sm:w-4 sm:h-4">
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          opacity: 0;
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        h1 {
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </section>
  );
};

export default EventSchedule;