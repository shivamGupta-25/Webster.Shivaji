"use client"
import Link from "next/link"
import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Instagram, Linkedin, Home, Check, Calendar, Clock, MapPin, Users, Award, Info, ArrowLeft, Share2, Download, Mail, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { getEventById, getWhatsAppGroupLink, formatEventDateTime, FEST_DATES } from "@/app/_data/techelonsEventsData"
import confetti from 'canvas-confetti'

const SuccessIcon = () => (
    <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
        }}
        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-md"
    >
        <Check className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-green-600" strokeWidth={2.5} />
    </motion.div>
);

const ErrorIcon = () => (
    <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
        }}
        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-md"
    >
        <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-red-600" strokeWidth={2.5} />
    </motion.div>
);

const SocialButton = ({ href, icon, label, className = "" }) => (
    <Link href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
        <Button
            variant="outline"
            size="icon"
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 ${className}`}
        >
            {icon}
        </Button>
    </Link>
);

const EventInfoItem = ({ icon, label, value }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 }
        }}
        className="flex items-start gap-3"
    >
        <div className="text-primary mt-0.5 bg-primary-50 p-2 rounded-full">{icon}</div>
        <div>
            <span className="text-sm sm:text-base text-gray-800 font-medium block">{label}</span>
            <span className="text-sm sm:text-base text-gray-600">{value}</span>
        </div>
    </motion.div>
);

// Loading fallback component
const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-pulse flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-80 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-72"></div>
        </div>
    </div>
);

// Main component that uses useSearchParams
const TechelonsRegistrationContent = () => {
    const [isExiting, setIsExiting] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const [whatsappLink, setWhatsappLink] = useState("")
    const [alreadyRegistered, setAlreadyRegistered] = useState(false)
    const [eventDetails, setEventDetails] = useState(null)
    const [loading, setLoading] = useState(true)
    const [shareUrl, setShareUrl] = useState("")
    const [emailSent, setEmailSent] = useState(true)
    const [isValid, setIsValid] = useState(false)
    const [shareData, setShareData] = useState(null)
    const [canShare, setCanShare] = useState(false)
    const [showShareSuccess, setShowShareSuccess] = useState(false)
    const hasTriggeredConfetti = useRef(false)

    const socialMedia = {
        instagram: "https://www.instagram.com/websters.shivaji/",
        linkedin: "https://www.linkedin.com/company/websters-shivaji-college/"
    }

    // Set event details and WhatsApp link after component mounts
    useEffect(() => {
        const token = searchParams.get('token')
        const eventId = searchParams.get('event')
        const alreadyRegisteredParam = searchParams.get('alreadyRegistered')
        console.log('Token received:', token ? 'Token present' : 'No token');
        console.log('Event ID received:', eventId);
        console.log('Already registered:', alreadyRegisteredParam);

        if (alreadyRegisteredParam === 'true') {
            setAlreadyRegistered(true)
        }

        if (!token || !eventId) {
            setLoading(false)
            setIsValid(false)
            return
        }

        try {
            // Get event details first
            const eventDetails = getEventById(eventId);
            console.log('Event details:', eventDetails ? 'Found' : 'Not found');

            if (!eventDetails) {
                console.error('Event not found for ID:', eventId);
                setIsValid(false);
                setLoading(false);
                return;
            }

            // Get WhatsApp link
            let whatsappGroupLink;
            try {
                whatsappGroupLink = getWhatsAppGroupLink(eventId);
                console.log('WhatsApp link:', whatsappGroupLink ? 'Found' : 'Not found');

                // If no specific link found, use default
                if (!whatsappGroupLink) {
                    console.log('Using default WhatsApp link');
                    whatsappGroupLink = "https://chat.whatsapp.com/techelons-general-group";
                }
            } catch (whatsappError) {
                console.error('Error getting WhatsApp link:', whatsappError);
                // Fallback to default link
                whatsappGroupLink = "https://chat.whatsapp.com/techelons-general-group";
            }

            // Validate token
            const decodedToken = atob(token)
            console.log('Token decoded successfully');

            const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|du\.ac\.in|ipu\.ac\.in|ignou\.ac\.in|jnu\.ac\.in|iitd\.ac\.in|nsut\.ac\.in|dtu\.ac\.in|igdtuw\.ac\.in|aud\.ac\.in|jamiahamdard\.edu|bhu\.ac\.in|bvpindia\.com|mait\.ac\.in|ip\.edu|msit\.in|gbpuat\.ac\.in)$/

            // Extract email from token (handle both formats)
            let email = decodedToken;
            let isTokenValid = false;

            // If token has the old format (email|timestamp), extract just the email
            if (decodedToken.includes('|')) {
                email = decodedToken.split('|')[0];
            }

            // Validate the email
            isTokenValid = emailRegex.test(email);

            if (isTokenValid) {
                setIsValid(true)
                setEventDetails(eventDetails)
                setWhatsappLink(whatsappGroupLink)

                // Set the share URL for the event
                const baseUrl = window.location.origin
                const shareEventUrl = `${baseUrl}/techelonsregistration?preselect=${eventId}`
                setShareUrl(shareEventUrl)

                // Only trigger confetti if this is a fresh submission (not a page reload)
                if (!hasTriggeredConfetti.current) {
                    triggerConfetti()
                    hasTriggeredConfetti.current = true
                }
            } else {
                setIsValid(false)
            }
        } catch (error) {
            console.error('Token validation error:', error)
            setIsValid(false)
        } finally {
            setLoading(false)
        }
    }, [searchParams])

    const triggerConfetti = () => {
        // Trigger confetti effect
        const duration = 3 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)

            // Since particles fall down, start a bit higher than random
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            })
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            })
        }, 250)
    }

    const handleExit = () => {
        setIsExiting(true)
        setTimeout(() => {
            router.push("/")
        }, 700) // Match animation duration
    }

    const handleShare = async () => {
        try {
            // Make sure we have a valid shareUrl
            if (!shareUrl) {
                console.error('Share URL is not set')

                // Create a toast notification for error
                const errorToast = document.createElement('div')
                errorToast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300'
                errorToast.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-red-500">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span class="text-sm font-medium">Unable to share: Invalid URL</span>
                `
                document.body.appendChild(errorToast)

                // Remove the toast after 3 seconds
                setTimeout(() => {
                    errorToast.classList.add('animate-out')
                    errorToast.classList.add('fade-out')
                    errorToast.classList.add('slide-out-to-bottom-5')
                    errorToast.style.opacity = '0'
                    setTimeout(() => {
                        document.body.removeChild(errorToast)
                    }, 300)
                }, 3000)
                return
            }

            // Check if Web Share API is supported
            if (navigator.share) {
                await navigator.share({
                    title: `Join ${eventDetails?.name || 'Techelons Event'}`,
                    text: `Join me at ${eventDetails?.name || 'Techelons Event'} - ${eventDetails?.shortDescription || 'A Techelons event'}`,
                    url: shareUrl,
                })
                console.log('Content shared successfully')
            } else {
                // Fallback for browsers that don't support Web Share API
                // Copy to clipboard and show a toast
                await navigator.clipboard.writeText(shareUrl)

                // Create a toast notification
                const toast = document.createElement('div')
                toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background border border-border text-foreground px-4 py-3 rounded-md shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300'
                toast.innerHTML = `
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary">
                        <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm font-medium">Link copied to clipboard</span>
                `
                document.body.appendChild(toast)

                // Remove the toast after 3 seconds
                setTimeout(() => {
                    toast.classList.add('animate-out')
                    toast.classList.add('fade-out')
                    toast.classList.add('slide-out-to-bottom-5')
                    toast.style.opacity = '0'
                    setTimeout(() => {
                        document.body.removeChild(toast)
                    }, 300)
                }, 3000)
            }
        } catch (error) {
            console.error('Error sharing content:', error)

            // Create a toast notification for error
            const errorToast = document.createElement('div')
            errorToast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300'
            errorToast.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 text-red-500">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span class="text-sm font-medium">Unable to share: ${error.message || 'Unknown error'}</span>
            `
            document.body.appendChild(errorToast)

            // Remove the toast after 3 seconds
            setTimeout(() => {
                errorToast.classList.add('animate-out')
                errorToast.classList.add('fade-out')
                errorToast.classList.add('slide-out-to-bottom-5')
                errorToast.style.opacity = '0'
                setTimeout(() => {
                    document.body.removeChild(errorToast)
                }, 300)
            }, 3000)
        }
    }

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: { duration: 0.7 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    const buttonVariants = {
        hover: {
            scale: 1.05,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 10
            }
        },
        tap: {
            scale: 0.95
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Format event date and time
    const { formattedDate, formattedTime, dayOfWeek } = eventDetails ? formatEventDateTime(eventDetails) : {};

    // Get registration deadline
    const registrationDeadline = FEST_DATES.REGISTRATION_DEADLINE;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence>
                {!isExiting && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white p-5 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl shadow-xl max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl w-full text-center border border-gray-100"
                    >
                        {isValid && eventDetails ? (
                            <>
                                <SuccessIcon />

                                <motion.h1
                                    variants={itemVariants}
                                    className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-teal-600"
                                >
                                    {alreadyRegistered ? "Already Registered!" : "Registration Successful!"}
                                </motion.h1>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-2"
                                >
                                    {alreadyRegistered
                                        ? "You have already registered for Techelons. Please check your email for the confirmation details and make sure to join our WhatsApp group for updates."
                                        : "Thank you for registering for Techelons. We've sent a confirmation email to your inbox with all the details."
                                    }
                                </motion.p>

                                <motion.div variants={itemVariants} className="mb-8">
                                    <motion.a
                                        href={whatsappLink}
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-medium text-sm sm:text-base py-3 px-6 rounded-full transition-all duration-300 shadow-md"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        Join WhatsApp Group
                                    </motion.a>
                                </motion.div>

                                {eventDetails && (
                                    <>
                                        <motion.div
                                            variants={itemVariants}
                                            className="relative py-4 my-6"
                                        >
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-200"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="bg-white px-4 text-sm text-gray-500 font-medium">Event Details</span>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            variants={itemVariants}
                                            className="bg-gradient-to-br from-gray-50 to-white p-5 sm:p-6 rounded-xl mb-6 sm:mb-8 text-left shadow-sm border border-gray-100"
                                        >
                                            <div className="mb-4">
                                                <h3 className="text-lg font-semibold text-gray-800 mb-1">{eventDetails.name}</h3>
                                                <p className="text-sm text-gray-500">{eventDetails.shortDescription}</p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 sm:gap-5">
                                                {formattedDate !== "To be announced" && (
                                                    <EventInfoItem
                                                        icon={<Calendar size={18} />}
                                                        label="Date"
                                                        value={`${dayOfWeek ? `${dayOfWeek}, ` : ''}${formattedDate}`}
                                                    />
                                                )}

                                                {formattedTime !== "To be announced" && (
                                                    <EventInfoItem
                                                        icon={<Clock size={18} />}
                                                        label="Time"
                                                        value={formattedTime}
                                                    />
                                                )}

                                                {eventDetails.venue && eventDetails.venue !== "TBA" && (
                                                    <EventInfoItem
                                                        icon={<MapPin size={18} />}
                                                        label="Venue"
                                                        value={eventDetails.venue}
                                                    />
                                                )}

                                                {eventDetails.teamSize && (
                                                    <EventInfoItem
                                                        icon={<Users size={18} />}
                                                        label="Team Size"
                                                        value={eventDetails.teamSize.min === eventDetails.teamSize.max
                                                            ? `${eventDetails.teamSize.min} ${eventDetails.teamSize.min === 1 ? 'person' : 'people'}`
                                                            : `${eventDetails.teamSize.min}-${eventDetails.teamSize.max} people`}
                                                    />
                                                )}

                                                {eventDetails.category && (
                                                    <EventInfoItem
                                                        icon={<Award size={18} />}
                                                        label="Category"
                                                        value={eventDetails.category.charAt(0).toUpperCase() + eventDetails.category.slice(1)}
                                                    />
                                                )}
                                            </div>

                                            {registrationDeadline && (
                                                <div className="mt-5 pt-4 border-t border-gray-100">
                                                    <p className="text-xs text-gray-500">
                                                        <span className="font-medium">Registration Deadline:</span> {registrationDeadline}
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    </>
                                )}

                                <motion.div variants={itemVariants} className="flex justify-center mb-4">
                                    <motion.button
                                        onClick={() => router.push('/techelons#events')}
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-all duration-300"
                                    >
                                        <Calendar size={16} className="mr-1.5" />
                                        Register for another event
                                    </motion.button>
                                </motion.div>

                                <motion.div variants={itemVariants} className="flex justify-center space-x-3 mt-2">
                                    <SocialButton
                                        href={socialMedia.instagram}
                                        icon={<Instagram size={18} />}
                                        label="Instagram"
                                        className="bg-gradient-to-br from-purple-50 to-pink-50 text-pink-600 border-pink-100"
                                    />
                                    <SocialButton
                                        href={socialMedia.linkedin}
                                        icon={<Linkedin size={18} />}
                                        label="LinkedIn"
                                        className="bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 border-blue-100"
                                    />
                                </motion.div>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-xs text-gray-400 mt-6"
                                >
                                    © {new Date().getFullYear()} Websters, Shivaji College
                                </motion.p>
                            </>
                        ) : (
                            <>
                                <ErrorIcon />

                                <motion.h1
                                    variants={itemVariants}
                                    className="text-2xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 md:mb-4 text-gray bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-600"
                                >
                                    Invalid Access
                                </motion.h1>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-1"
                                >
                                    This confirmation page is only accessible after successful registration. Please register for an event first.
                                </motion.p>
                            </>
                        )}

                        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-3 m-6">
                            <motion.button
                                onClick={handleExit}
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm py-2.5 px-4 rounded-lg transition-all duration-300"
                            >
                                <ArrowLeft size={16} className="mr-1.5" />
                                Back to Home
                            </motion.button>

                            {eventDetails && (
                                <motion.button
                                    onClick={handleShare}
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    className="inline-flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm py-2.5 px-4 rounded-lg transition-all duration-300"
                                    aria-label="Share this event"
                                >
                                    <Share2 size={16} className="mr-1.5" />
                                    Share Event
                                </motion.button>
                            )}
                        </motion.div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Wrapper component with Suspense boundary
const TechelonsRegistration = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <TechelonsRegistrationContent />
        </Suspense>
    );
};

export default TechelonsRegistration;
