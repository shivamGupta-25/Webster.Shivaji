"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "react-hot-toast";
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from "@/components/ui/alert";
import workshopData from "@/app/_data/workshopData";

// Email validation schema
const emailSchema = z.string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .regex(
        /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|du\.ac\.in|ipu\.ac\.in|ignou\.ac\.in|jnu\.ac\.in|iitd\.ac\.in|nsut\.ac\.in|dtu\.ac\.in|igdtuw\.ac\.in|aud\.ac\.in|jamiahamdard\.edu|bhu\.ac\.in|bvpindia\.com|mait\.ac\.in|ip\.edu|msit\.in|gbpuat\.ac\.in)$/,
        "Please use valid EMail ID"
    )
    .refine(
        (email) => {
            const localPart = email.split('@')[0].toLowerCase();
            const invalidPrefixes = new Set([
                'test', 'example', 'sample', 'demo', 'user', 
                'admin', 'info', 'mail', 'email', 'no-reply', 
                'noreply', 'nobody', 'fake', 'xyz'
            ]);
            
            return !invalidPrefixes.has(localPart) && 
                   !localPart.startsWith('test') && 
                   !localPart.startsWith('example');
        },
        "Please use your official institutional email address"
    );

const formSchema = z.object({
    email: emailSchema,
    name: z.string().min(2, "Name is required"),
    rollNo: z.string().min(2, "Roll No. is required"),
    course: z.string().min(2, "Course is required"),
    year: z.enum(["1st Year", "2nd Year", "3rd Year"], {
        required_error: "Please select your year",
    }),
    phone: z.string()
        .min(1, "Phone number is required")
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^[6-9]\d{9}$/, "Please enter a valid Indian mobile number"),
    query: z.string().optional(),
});

// Form field configuration - memoized to prevent unnecessary re-renders
const formFields = [
    { name: "email", placeholder: "Email", type: "email" },
    { name: "name", placeholder: "Full Name", type: "text" },
    { name: "rollNo", placeholder: "Roll No.", type: "text" },
    { name: "course", placeholder: "Course", type: "text" },
];

// Error messages
const ERROR_MESSAGES = {
    CONNECTION_ERROR: "Connection error. Please check your internet connection and try again.",
    DUPLICATE_EMAIL: "You have already registered with this email address.",
    DUPLICATE_PHONE: "This phone number is already registered.",
    DEFAULT: "Registration failed. Please try again or contact support."
};

// Toast configuration
const TOAST_OPTIONS = {
    duration: 3000,
    success: { style: { background: '#10B981', color: 'white' } },
    error: { duration: 4000, style: { background: '#EF4444', color: 'white' } },
    loading: { duration: Infinity, style: { background: '#3B82F6', color: 'white' } }
};

export default function RegistrationPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    
    // Memoize workshop title to prevent unnecessary re-renders
    const workshopTitle = useMemo(() => workshopData.title, []);

    // Redirect if registration is closed
    useEffect(() => {
        if (!workshopData.isRegistrationOpen) {
            router.push('/registrationclosed');
        }
    }, [router]);

    // Handle online status with useEffect to avoid hydration mismatch
    useEffect(() => {
        // Update online status after component mounts
        setIsOnline(navigator.onLine);
        
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isValid, isDirty }
    } = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { query: "" },
        mode: "onChange"
    });

    // Handle form submission with optimized fetch
    const handleRegistration = useCallback(async (data) => {
        if (isSubmitting || !isOnline) {
            if (!isOnline) toast.error(ERROR_MESSAGES.CONNECTION_ERROR);
            return;
        }
        
        setServerError(null);
        setIsSubmitting(true);
        
        // Show loading toast
        const toastId = toast.loading("Submitting your registration...");
        
        try {
            // Implement retry logic with exponential backoff
            const maxRetries = 3;
            let retryCount = 0;
            let success = false;
            
            while (retryCount < maxRetries && !success) {
                try {
                    // Increase timeout for each retry attempt
                    const timeout = 8000 + (retryCount * 4000);
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeout);
                    
                    // Optimize payload size by removing unnecessary whitespace
                    const payload = {
                        ...data,
                        college: "Shivaji College",
                        email: data.email.trim(),
                        name: data.name.trim(),
                        rollNo: data.rollNo.trim(),
                        course: data.course.trim(),
                        phone: data.phone.trim(),
                        query: data.query?.trim() || ""
                    };
                    
                    // Add retry attempt to headers for server-side logging
                    const response = await fetch('/api/workshopregistration', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'X-Retry-Count': retryCount.toString()
                        },
                        body: JSON.stringify(payload),
                        signal: controller.signal,
                        // Add cache control to prevent caching of POST requests
                        cache: 'no-store'
                    });

                    clearTimeout(timeoutId);
                    const result = await response.json();
                    
                    if (!response.ok) {
                        let errorMessage = result.error || ERROR_MESSAGES.DEFAULT;
                        
                        if (errorMessage.includes("already registered with this email")) {
                            errorMessage = ERROR_MESSAGES.DUPLICATE_EMAIL;
                        } else if (errorMessage.includes("phone number is already registered")) {
                            errorMessage = ERROR_MESSAGES.DUPLICATE_PHONE;
                        }
                        
                        setServerError(errorMessage);
                        toast.error(errorMessage, { id: toastId });
                        return;
                    }

                    // Check if user is already registered
                    if (result.alreadyRegistered) {
                        toast.success("You are already registered! Redirecting...", { id: toastId });
                        
                        // Redirect to the form submission page
                        setTimeout(() => {
                            const redirectUrl = `${workshopData.formSubmittedLink}?token=${encodeURIComponent(result.registrationToken)}&alreadyRegistered=true`;
                            window.location.href = redirectUrl;
                        }, 500);
                        return;
                    }

                    // Handle success for new registrations
                    toast.success("Registration successful! Redirecting...", { id: toastId });
                    reset();
                    
                    // Ensure redirection happens with a slight delay and proper URL
                    setTimeout(() => {
                        const redirectUrl = `${workshopData.formSubmittedLink}?token=${encodeURIComponent(result.registrationToken)}`;
                        window.location.href = redirectUrl;
                    }, 500);
                    
                    success = true;
                    break;
                } catch (fetchError) {
                    if (fetchError.name === 'AbortError') {
                        // Only retry on timeout errors
                        retryCount++;
                        
                        if (retryCount < maxRetries) {
                            // Update toast to show retry attempt
                            toast.loading(`Request timed out. Retrying (${retryCount}/${maxRetries})...`, { id: toastId });
                            // Add a small delay before retrying
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        } else {
                            const errorMessage = "Request timed out after multiple attempts. Please try again later.";
                            setServerError(errorMessage);
                            toast.error(errorMessage, { id: toastId });
                        }
                    } else {
                        // For non-timeout errors, don't retry
                        const errorMessage = ERROR_MESSAGES.CONNECTION_ERROR;
                        setServerError(errorMessage);
                        toast.error(errorMessage, { id: toastId });
                        break;
                    }
                }
            }
        } catch (error) {
            console.error("Registration error:", error);
            toast.error(ERROR_MESSAGES.DEFAULT, { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }, [isSubmitting, isOnline, reset]);

    return (
        <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <Toaster position="top-center" toastOptions={TOAST_OPTIONS} />
            
            <div className="max-w-lg mx-auto">
                {!isOnline && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>
                            You appear to be offline. Please check your internet connection and try again.
                        </AlertDescription>
                    </Alert>
                )}
                
                <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
                    <h1 className="text-3xl font-bold text-center mb-8">Workshop Registration</h1>
                    
                    {serverError && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{serverError}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit(handleRegistration)} className="space-y-6">
                        <div className="flex item-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm font-bold text-gray-700 text-lg">
                            {workshopTitle}
                        </div>

                        {formFields.map(field => (
                            <div key={field.name}>
                                <Input
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    {...register(field.name)}
                                    className={`block w-full ${errors[field.name] ? 'border-red-500' : ''}`}
                                    disabled={isSubmitting}
                                    aria-invalid={errors[field.name] ? "true" : "false"}
                                />
                                {errors[field.name] && (
                                    <p className="mt-1 text-sm text-red-600" role="alert">{errors[field.name].message}</p>
                                )}
                            </div>
                        ))}

                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-700">
                            Shivaji College
                        </div>

                        <div>
                            <Select 
                                onValueChange={(value) => setValue("year", value)}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger className={errors.year ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["1st Year", "2nd Year", "3rd Year"].map(year => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.year && (
                                <p className="mt-1 text-sm text-red-600" role="alert">{errors.year.message}</p>
                            )}
                        </div>

                        <div>
                            <Input
                                type="tel"
                                placeholder="Phone Number"
                                {...register("phone")}
                                className={`block w-full ${errors.phone ? 'border-red-500' : ''}`}
                                disabled={isSubmitting}
                                aria-invalid={errors.phone ? "true" : "false"}
                            />
                            {errors.phone && (
                                <p className="mt-1 text-sm text-red-600" role="alert">{errors.phone.message}</p>
                            )}
                        </div>

                        <div>
                            <Textarea
                                placeholder="Your Query (Optional)"
                                {...register("query")}
                                className="block w-full"
                                disabled={isSubmitting}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || (!isDirty && !isValid) || !isOnline}
                        >
                            {isSubmitting ? 'Processing...' : 'Register'}
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}