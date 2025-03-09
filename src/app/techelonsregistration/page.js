"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from "react-hot-toast";
import { z } from "zod";
import { TECHELONS_EVENTS } from "@/app/_data/techelonsEventsData";
import { validateFile, MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from "@/app/_utils/fileUtils";

// Constants
// const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
// const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

// Reusable schemas
const fileSchema = z.any()
    .refine((file) => file && file?.length > 0, "College ID is required")
    .refine((file) => file?.[0]?.size <= MAX_FILE_SIZE, "Max file size is 5MB")
    .refine(
        (file) => ACCEPTED_FILE_TYPES.includes(file?.[0]?.type),
        "Only .jpg, .jpeg, .png and .pdf files are accepted"
    );

const nameSchema = z.string().min(2, "Name is required").max(50);
const emailSchema = z.string().email("Invalid email address");
const phoneSchema = z.string()
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^[6-9]\d{9}$/, "Please enter a valid Indian mobile number");
const rollNoSchema = z.string().min(2, "Roll No. is required").max(20);
const collegeSelectSchema = z.enum(["Shivaji College", "Other"]);
const otherCollegeSchema = z.string()
    .min(2, "College name is required")
    .max(100)
    .optional()
    .nullable();

// Person schema (common fields between main registrant and team members)
const personSchema = z.object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    rollNo: rollNoSchema,
    college: collegeSelectSchema,
    otherCollege: otherCollegeSchema,
    collegeId: fileSchema
});

// Team member schema (reusing person schema)
const teamMemberSchema = personSchema;

// Main form schema
const baseFormSchema = personSchema.extend({
    event: z.string().min(1, "Event selection is required"),
    course: z.string().min(2, "Course is required").max(50),
    year: z.enum(["1st Year", "2nd Year", "3rd Year"]),
    query: z.string().max(500).optional().nullable(),
    teamMembers: z.array(teamMemberSchema).optional()
});

export default function RegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [teamSize, setTeamSize] = useState(1);
  const [requiredTeamSize, setRequiredTeamSize] = useState({ min: 1, max: 1 });
  
  // Get preselected event ID from URL if available
  const preselectedEventId = searchParams.get('preselect');
  const preselectedEvent = preselectedEventId ? 
    TECHELONS_EVENTS.find(e => e.id === preselectedEventId) : null;

  // Memoize the form schema to prevent unnecessary recalculations
  const getFormSchema = useCallback(() => {
    const schema = { ...baseFormSchema };
    if (selectedEvent?.teamSize.max > 1) {
      schema.teamMembers = teamMemberSchema.array()
        .min(selectedEvent.teamSize.min - 1, `At least ${selectedEvent.teamSize.min - 1} team members are required`)
        .max(selectedEvent.teamSize.max - 1, `Maximum ${selectedEvent.teamSize.max - 1} team members allowed`);
    }
    return schema;
  }, [selectedEvent]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors }, unregister } = useForm({
    resolver: zodResolver(getFormSchema()),
    defaultValues: {
      event: preselectedEventId || ""
    },
    mode: 'onBlur' // Validate on blur for better UX
  });

  const selectedCollege = watch("college");
  const watchedEvent = watch("event");

  // Initialize selected event state if preselected event is available
  useEffect(() => {
    if (preselectedEvent && !selectedEvent) {
      setSelectedEvent(preselectedEvent);
      setRequiredTeamSize(preselectedEvent.teamSize);
      setTeamSize(Math.max(1, preselectedEvent.teamSize.min - 1));
    }
  }, [preselectedEvent, selectedEvent]);

  // Handle preselection from URL parameter - combined with the above effect
  useEffect(() => {
    const preselectedEventId = searchParams.get('preselect');
    if (preselectedEventId) {
      // Check if the event exists
      const event = TECHELONS_EVENTS.find(e => e.id === preselectedEventId);
      if (event) {
        // Set the form value with all necessary options to trigger validation and updates
        setValue("event", preselectedEventId, { 
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
        
        // Manually update all related state
        setSelectedEvent(event);
        setRequiredTeamSize(event.teamSize);
        setTeamSize(Math.max(1, event.teamSize.min - 1));
        
        // Show a toast notification about the preselected event
        toast.success(
          `Event preselected: ${event.name}`,
          { 
            icon: '🎯',
            duration: 4000,
            style: {
              borderLeft: '4px solid #3B82F6',
              padding: '16px',
              fontWeight: 'bold'
            }
          }
        );
      }
    }
  }, [searchParams, setValue]);

  // Optimize event selection effect
  useEffect(() => {
    if (watchedEvent && watchedEvent !== preselectedEventId) {
      const event = TECHELONS_EVENTS.find(e => e.id === watchedEvent);
      if (event) {
        setSelectedEvent(event);
        setRequiredTeamSize(event.teamSize);
        setTeamSize(Math.max(1, event.teamSize.min - 1));

        toast.success(
          `You've selected: ${event.name}`,
          { 
            icon: '🎯',
            duration: 3000,
            style: {
              borderLeft: '4px solid #10B981',
              padding: '16px'
            }
          }
        );
      }
    }
  }, [watchedEvent, preselectedEventId]);

  const handleRemoveMember = useCallback(() => {
    const newSize = Math.max(requiredTeamSize.min - 1, teamSize - 1);
    setTeamSize(newSize);

    // Unregister the removed team member's fields
    const removedIndex = teamSize - 1;
    unregister(`teamMembers.${removedIndex}`);

    // Reset the form values for the remaining fields
    const currentValues = watch();
    const updatedTeamMembers = currentValues.teamMembers?.slice(0, newSize) || [];
    setValue('teamMembers', updatedTeamMembers);

    toast.success(`Team member removed. Total members: ${newSize}`, { 
      duration: 2000,
      icon: '👤'
    });
  }, [teamSize, requiredTeamSize.min, unregister, watch, setValue]);

  const handleAddMember = useCallback(() => {
    const newSize = Math.min(requiredTeamSize.max - 1, teamSize + 1);
    setTeamSize(newSize);
    
    toast.success(`Team member added. Total members: ${newSize}`, { 
      duration: 2000,
      icon: '➕'
    });
  }, [teamSize, requiredTeamSize.max]);

  // Optimize file validation before submission
  const validateFiles = useCallback((data) => {
    // Check main participant's college ID
    if (data.collegeId?.[0]) {
      const validation = validateFile(data.collegeId[0]);
      if (!validation.success) {
        throw new Error(validation.error);
      }
    }
    
    // Check team members' college IDs
    if (data.teamMembers) {
      for (let i = 0; i < data.teamMembers.length; i++) {
        const member = data.teamMembers[i];
        if (member.collegeId?.[0]) {
          const validation = validateFile(member.collegeId[0]);
          if (!validation.success) {
            throw new Error(`Team member ${i + 1}: ${validation.error}`);
          }
        }
      }
    }
    
    return true;
  }, []);

  // Optimize form data preparation
  const prepareFormData = useCallback((data) => {
    const formData = new FormData();

    // Append main form data
    Object.keys(data).forEach(key => {
      if (key === 'collegeId' && data[key]?.[0]) {
        formData.append('collegeId', data[key][0]);
      } else if (key === 'teamMembers' && data[key]) {
        data[key].slice(0, teamSize).forEach((member, index) => {
          formData.append(`teamMember_${index}`, JSON.stringify({
            name: member.name,
            email: member.email,
            phone: member.phone,
            rollNo: member.rollNo,
            college: member.college,
            otherCollege: member.otherCollege
          }));

          if (member.collegeId?.[0]) {
            formData.append(`teamMember_${index}_collegeId`, member.collegeId[0]);
          }
        });
      } else {
        formData.append(key, data[key]);
      }
    });
    
    return formData;
  }, [teamSize]);

  const onSubmit = useCallback(async (data) => {
    try {
      setIsSubmitting(true);
      
      // Validate files before submission
      validateFiles(data);
      
      // Show loading toast
      const loadingToast = toast.loading(
        `Submitting your registration for ${selectedEvent?.name || 'Techelons-25'}...`
      );
      
      // Prepare form data
      const formData = prepareFormData(data);

      // Submit form data
      const response = await fetch('/api/techelonsregistration', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      toast.success(
        `Registration Successful! Welcome to ${selectedEvent?.name || 'Techelons-25'}`, 
        { 
          duration: 3000,
          icon: '🎉'
        }
      );
      
      // Show email notification toast based on email sending status
      if (result.emailSent) {
        toast.success(
          'A confirmation email has been sent to your email address', 
          { 
            duration: 3000,
            icon: '📧'
          }
        );
      } else {
        // Show detailed error message if available
        const errorMessage = result.emailDetails || result.emailError || 'Email could not be sent';
        
        toast(
          'Registration successful, but we could not send a confirmation email. Please check with the organizers.', 
          { 
            duration: 3000,
            icon: '⚠️'
          }
        );
        
        // Log the email error for debugging
        console.error('Email sending failed:', errorMessage);
      }
      
      // Reset form
      reset();
      
      // Redirect with registration token
      router.push(`/formsubmitted/techelons?event=${encodeURIComponent(data.event)}&token=${result.registrationToken}&emailSent=${result.emailSent ? 'true' : 'false'}`);
    } catch (error) {
      // Show specific error message
      const errorMessage = error.message || 'Registration failed. Please try again.';
      
      toast.error(errorMessage, { 
        duration: 4000,
        icon: '❌'
      });
      
      // If the error is related to a specific field, highlight it
      if (errorMessage.toLowerCase().includes('email')) {
        toast('Check your email address and try again', { icon: '📧' });
      } else if (errorMessage.toLowerCase().includes('file') || errorMessage.toLowerCase().includes('id')) {
        toast('There may be an issue with your uploaded ID', { icon: '📁' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedEvent, validateFiles, prepareFormData, reset, router]);

  // Field validation feedback notifications - memoized
  const showFieldErrorToasts = useCallback(() => {
    if (Object.keys(errors).length > 0) {
      // Get the first error for notification
      const firstErrorField = Object.keys(errors)[0];
      const firstErrorMessage = errors[firstErrorField]?.message || 'Please check form fields';
      
      toast.error(firstErrorMessage, {
        duration: 3000,
        icon: '⚠️'
      });
    }
  }, [errors]);

  // File input change handler
  const handleFileChange = useCallback((e, isTeamMember = false, memberIndex = null) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const validation = validateFile(file);
      
      if (!validation.success) {
        toast.error(isTeamMember 
          ? `Team member ${memberIndex + 1}: ${validation.error}` 
          : validation.error, 
          { 
            duration: 3000,
            icon: '📁'
          }
        );
        // Clear the file input
        e.target.value = '';
      } else {
        toast.success(isTeamMember 
          ? `Team member ${memberIndex + 1}: ID uploaded successfully` 
          : 'ID uploaded successfully', 
          { 
            duration: 2000,
            icon: '✅'
          }
        );
      }
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 py-6 sm:py-8 md:py-10 lg:py-12 px-4 sm:px-6 lg:px-8">
      <Toaster 
        position="top-center"
        toastOptions={{
          // Custom styling for all toasts
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
          // Custom success styling
          success: {
            style: {
              background: '#10B981',
            },
          },
          // Custom error styling
          error: {
            style: {
              background: '#EF4444',
            },
          },
          // Custom info styling
          info: {
            style: {
              background: '#3B82F6',
            },
          },
        }}
      />
      <div className="w-full max-w-2xl mx-auto">
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-2 px-4 sm:px-6">
            <CardTitle className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center">Techelons-25</CardTitle>
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">Registration</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit(onSubmit, showFieldErrorToasts)} className="space-y-4 sm:space-y-6">
              {/* Event Selection */}
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-sm sm:text-base">Event</Label>
                <Select 
                  onValueChange={(value) => {
                    setValue("event", value);
                  }}
                  value={watchedEvent || ""}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Event" />
                  </SelectTrigger>
                  <SelectContent>
                    {TECHELONS_EVENTS.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.event && (
                  <p className="text-xs sm:text-sm text-red-600">{errors.event.message}</p>
                )}
              </div>

              {selectedEvent && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        You've selected: <span className="font-medium">{selectedEvent.name}</span>
                      </p>
                      {selectedEvent.description && (
                        <p className="mt-1 text-xs text-blue-600">{selectedEvent.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-sm sm:text-base">Full Name</Label>
                  <Input placeholder="Full Name" {...register("name")} className="w-full" />
                  {errors.name && (
                    <p className="text-xs sm:text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-sm sm:text-base">Email</Label>
                  <Input 
                    type="email" 
                    placeholder="Email" 
                    {...register("email")} 
                    className="w-full" 
                    onBlur={(e) => {
                      if (e.target.value && !e.target.value.includes('@')) {
                        toast.error('Please enter a valid email address', { 
                          duration: 2000,
                          icon: '📧'
                        });
                      }
                    }}
                  />
                  {errors.email && (
                    <p className="text-xs sm:text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-sm sm:text-base">Phone Number</Label>
                  <Input 
                    type="tel" 
                    placeholder="Phone Number" 
                    {...register("phone")} 
                    className="w-full"
                    onBlur={(e) => {
                      if (e.target.value && (e.target.value.length < 10 || isNaN(e.target.value))) {
                        toast.error('Please enter a valid phone number', { 
                          duration: 2000,
                          icon: '📱'
                        });
                      }
                    }}
                  />
                  {errors.phone && (
                    <p className="text-xs sm:text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-sm sm:text-base">Roll Number</Label>
                  <Input placeholder="Roll Number" {...register("rollNo")} className="w-full" />
                  {errors.rollNo && (
                    <p className="text-xs sm:text-sm text-red-600">{errors.rollNo.message}</p>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-sm sm:text-base">Course</Label>
                  <Input placeholder="Course" {...register("course")} className="w-full" />
                  {errors.course && (
                    <p className="text-xs sm:text-sm text-red-600">{errors.course.message}</p>
                  )}
                </div>

                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-sm sm:text-base">Year</Label>
                  <Select onValueChange={(value) => setValue("year", value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.year && (
                    <p className="text-xs sm:text-sm text-red-600">{errors.year.message}</p>
                  )}
                </div>
              </div>

              {/* College Information */}
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-sm sm:text-base">College</Label>
                  <Select onValueChange={(value) => {
                    setValue("college", value);
                    if (value === "Shivaji College") {
                      // Clear the otherCollege field when Shivaji College is selected
                      setValue("otherCollege", "");
                      // Unregister the otherCollege field to remove any validation errors
                      unregister("otherCollege");
                      
                      toast('Shivaji College student!', {
                        icon: '🏫',
                        duration: 2000
                      });
                    }
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select College" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Shivaji College">Shivaji College</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.college && (
                    <p className="text-xs sm:text-sm text-red-600">{errors.college.message}</p>
                  )}
                </div>

                {selectedCollege === "Other" && (
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-sm sm:text-base">College Name</Label>
                    <Input
                      placeholder="Enter College Name"
                      {...register("otherCollege")}
                      className="w-full"
                    />
                    {errors.otherCollege && (
                      <p className="text-xs sm:text-sm text-red-600">{errors.otherCollege.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-sm sm:text-base">College ID</Label>
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    {...register("collegeId")}
                    className="w-full"
                    onChange={(e) => handleFileChange(e)}
                  />
                  {errors.collegeId && (
                    <p className="text-xs sm:text-sm text-red-600">{errors.collegeId.message}</p>
                  )}
                </div>
              </div>

              {/* Team Members Section */}
              {selectedEvent?.teamSize.max > 1 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                    <Label className="text-base sm:text-lg font-medium mb-2 sm:mb-0">Team Members</Label>
                    <div className="space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto flex flex-col sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveMember}
                        disabled={teamSize <= requiredTeamSize.min - 1}
                        className="w-full sm:w-auto text-sm"
                      >
                        Remove Member
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddMember}
                        disabled={teamSize >= requiredTeamSize.max - 1}
                        className="w-full sm:w-auto text-sm"
                      >
                        Add Member
                      </Button>
                    </div>
                  </div>

                  {Array.from({ length: teamSize }).map((_, index) => (
                    <Card key={index} className="p-2 sm:p-4">
                      <CardHeader className="px-2 sm:px-4 py-2 sm:py-3">
                        <CardTitle className="text-base sm:text-lg">Team Member {index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="px-2 sm:px-4 py-2 space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-sm sm:text-base">Name</Label>
                            <Input
                              placeholder="Name"
                              {...register(`teamMembers.${index}.name`)}
                              className="w-full"
                            />
                            {errors.teamMembers?.[index]?.name && (
                              <p className="text-xs sm:text-sm text-red-600">{errors.teamMembers[index].name.message}</p>
                            )}
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-sm sm:text-base">Email</Label>
                            <Input
                              type="email"
                              placeholder="Email"
                              {...register(`teamMembers.${index}.email`)}
                              className="w-full"
                              onBlur={(e) => {
                                if (e.target.value && !e.target.value.includes('@')) {
                                  toast.error(`Team member ${index + 1}: Invalid email`, { 
                                    duration: 2000,
                                    icon: '📧'
                                  });
                                }
                              }}
                            />
                            {errors.teamMembers?.[index]?.email && (
                              <p className="text-xs sm:text-sm text-red-600">{errors.teamMembers[index].email.message}</p>
                            )}
                          </div>

                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-sm sm:text-base">Phone Number</Label>
                            <Input
                              type="tel"
                              placeholder="Phone Number"
                              {...register(`teamMembers.${index}.phone`)}
                              className="w-full"
                            />
                            {errors.teamMembers?.[index]?.phone && (
                              <p className="text-xs sm:text-sm text-red-600">{errors.teamMembers[index].phone.message}</p>
                            )}
                          </div>

                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-sm sm:text-base">Roll Number</Label>
                            <Input
                              placeholder="Roll Number"
                              {...register(`teamMembers.${index}.rollNo`)}
                              className="w-full"
                            />
                            {errors.teamMembers?.[index]?.rollNo && (
                              <p className="text-xs sm:text-sm text-red-600">{errors.teamMembers[index].rollNo.message}</p>
                            )}
                          </div>

                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-sm sm:text-base">College</Label>
                            <Select onValueChange={(value) => setValue(`teamMembers.${index}.college`, value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select College" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Shivaji College">Shivaji College</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.teamMembers?.[index]?.college && (
                              <p className="text-xs sm:text-sm text-red-600">{errors.teamMembers[index].college.message}</p>
                            )}
                          </div>

                          {watch(`teamMembers.${index}.college`) === "Other" && (
                            <div className="space-y-1 sm:space-y-2">
                              <Label className="text-sm sm:text-base">College Name</Label>
                              <Input
                                placeholder="Enter College Name"
                                {...register(`teamMembers.${index}.otherCollege`)}
                                className="w-full"
                              />
                              {errors.teamMembers?.[index]?.otherCollege && (
                                <p className="text-xs sm:text-sm text-red-600">{errors.teamMembers[index].otherCollege.message}</p>
                              )}
                            </div>
                          )}

                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-sm sm:text-base">College ID</Label>
                            <Input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              {...register(`teamMembers.${index}.collegeId`)}
                              className="w-full"
                              onChange={(e) => handleFileChange(e, true, index)}
                            />
                            {errors.teamMembers?.[index]?.collegeId && (
                              <p className="text-xs sm:text-sm text-red-600">{errors.teamMembers[index].collegeId.message}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Query/Comments Section */}
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-sm sm:text-base">Any queries or comments?</Label>
                <Textarea
                  placeholder="Your queries or comments (optional)"
                  {...register("query")}
                  className="w-full min-h-24"
                />
                {errors.query && (
                  <p className="text-xs sm:text-sm text-red-600">{errors.query.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-2 text-sm sm:text-base mt-4"
                disabled={isSubmitting}
                onClick={(e) => {
                  if (!watchedEvent) {
                    e.preventDefault(); // Prevent form submission
                    toast.error('Please select an event', { 
                      duration: 3000,
                      icon: '🎯'
                    });
                    return false;
                  }
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Register'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}