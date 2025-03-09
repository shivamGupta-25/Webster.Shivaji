"use client"
import Link from "next/link"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Instagram, Linkedin, Home, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import workshopData from "@/app/_data/workshopData"
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
        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 sm:mb-6"
    >
        <Check className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-green-600" />
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
        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 sm:mb-6"
    >
        <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-red-600" />
    </motion.div>
);

const SocialButton = ({ href, icon, color, hoverColor, label }) => (
    <Link href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
        <Button
            variant="outline"
            size="icon"
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-${hoverColor}-100 hover:border-${hoverColor}-300 transition-all duration-300`}
        >
            {icon}
        </Button>
    </Link>
);

// Create a client component that uses useSearchParams
const RegistrationContent = () => {
    const [isExiting, setIsExiting] = useState(false)
    const [isValid, setIsValid] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [alreadyRegistered, setAlreadyRegistered] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const [whatsappLink, setWhatsappLink] = useState("")
    const { socialMedia } = workshopData;

    // Set WhatsApp link after component mounts to avoid hydration mismatch
    useEffect(() => {
        const token = searchParams.get('token')
        const alreadyRegisteredParam = searchParams.get('alreadyRegistered')
        console.log('Token received:', token ? 'Token present' : 'No token');
        console.log('Already registered:', alreadyRegisteredParam);
        
        if (alreadyRegisteredParam === 'true') {
            setAlreadyRegistered(true)
        }
        
        if (!token) {
            setIsLoading(false)
            setIsValid(false)
            return
        }
        
        try {
            // Validate token
            const decodedToken = atob(token)
            console.log('Token decoded successfully');
            
            const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|du\.ac\.in|ipu\.ac\.in|ignou\.ac\.in|jnu\.ac\.in|iitd\.ac\.in|nsut\.ac\.in|dtu\.ac\.in|igdtuw\.ac\.in|aud\.ac\.in|jamiahamdard\.edu|bhu\.ac\.in|bvpindia\.com|mait\.ac\.in|ip\.edu|msit\.in|gbpuat\.ac\.in)$/
            
            // Extract email from token (handle both formats)
            let email = decodedToken;
            
            // If token has the old format (email|timestamp), extract just the email
            if (decodedToken.includes('|')) {
                console.log('Legacy token format: email|timestamp');
                email = decodedToken.split('|')[0];
            }
            
            // Validate the email
            if (emailRegex.test(email)) {
                console.log('Email validation passed');
                setIsValid(true)
                setWhatsappLink(workshopData.whatsappGroupLink)
                triggerConfetti()
            } else {
                console.log('Email validation failed');
                setIsValid(false)
            }
        } catch (error) {
            console.error('Token validation error:', error)
            setIsValid(false)
        } finally {
            setIsLoading(false)
        }
    }, [searchParams])

    const triggerConfetti = () => {
        // Trigger confetti effect
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            // Since particles fall down, start a bit higher than random
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    }

    const handleExit = () => {
        setIsExiting(true)
        setTimeout(() => {
            router.push("/")
        }, 700) // Match animation duration
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence>
                {!isExiting && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white p-5 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl shadow-xl max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg w-full text-center border border-gray-100"
                    >
                        {isValid ? (
                            <>
                                <SuccessIcon />

                                <motion.h1
                                    variants={itemVariants}
                                    className="text-2xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 md:mb-4 text-gray bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-teal-600"
                                >
                                    {alreadyRegistered ? "Already Registered!" : "Registration Successful!"}
                                </motion.h1>

                                <motion.p
                                    variants={itemVariants}
                                    className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8"
                                >
                                    {alreadyRegistered 
                                        ? "You have already registered for this workshop. Please check your email for the confirmation details and make sure to join our WhatsApp group for updates."
                                        : "Thank you for registering for the workshop. We've sent a confirmation email to your inbox with all the details."}
                                </motion.p>

                                <motion.div variants={itemVariants}>
                                    <a
                                        href={whatsappLink}
                                        className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-medium text-sm sm:text-base py-2 px-4 sm:py-2.5 sm:px-5 md:py-3 md:px-6 rounded-full transition-all duration-300 mb-4 sm:mb-5 md:mb-6 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        Join WhatsApp Group
                                    </a>
                                </motion.div>

                                <motion.div
                                    variants={itemVariants}
                                    className="relative py-3 sm:py-4 md:py-5 my-3 sm:my-4 md:my-6"
                                >
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white px-3 sm:px-4 text-xs sm:text-sm text-gray-500">Workshop Details</span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    variants={itemVariants}
                                    className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-5 md:mb-6 text-left"
                                >
                                    <div className="grid grid-cols-1 gap-1 sm:gap-2">
                                        {workshopData.details.slice(0, 3).map((detail) => (
                                            <div key={detail.id} className="flex items-start">
                                                <span className="text-xs sm:text-sm md:text-base text-gray-800 font-medium mr-1 sm:mr-2">{detail.label}</span>
                                                <span className="text-xs sm:text-sm md:text-base text-gray-600 flex-1">{detail.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants} className="mb-4 sm:mb-5 md:mb-6">
                                    <p className="text-xs sm:text-sm md:text-base text-gray-700 mb-2 sm:mb-3 font-medium">Connect with us</p>
                                    <div className="flex justify-center space-x-4 sm:space-x-6">
                                        <SocialButton
                                            href={socialMedia.instagram}
                                            icon={<Instagram className="h-4 w-4 sm:h-5 sm:w-5" />}
                                            color="pink"
                                            hoverColor="pink"
                                            label="Instagram"
                                        />
                                        <SocialButton
                                            href={socialMedia.linkedin}
                                            icon={<Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />}
                                            color="blue"
                                            hoverColor="blue"
                                            label="LinkedIn"
                                        />
                                    </div>
                                </motion.div>
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
                                    This confirmation page is only accessible after successful registration. Please register for the workshop first.
                                </motion.p>
                            </>
                        )}

                        <motion.div variants={itemVariants}>
                            <Button
                                className="w-full font-medium text-sm sm:text-base py-2 sm:py-3 md:py-4 lg:py-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-lg sm:rounded-xl"
                                onClick={handleExit}
                            >
                                <Home className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                Back to Home
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// Loading fallback component
const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

// Main component that wraps the client component with Suspense
const Registration = () => {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <RegistrationContent />
        </Suspense>
    );
};

export default Registration
