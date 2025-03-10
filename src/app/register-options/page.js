"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { isRegistrationOpen } from "@/app/_data/techelonsEventsData";
import workshopData from "@/app/_data/workshopData";
import { FEST_DATES } from "@/app/_data/techelonsEventsData";

export default function RegisterOptions() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Check if both registrations are open, if not redirect to the appropriate page
  useEffect(() => {
    const techelonsRegistrationOpen = isRegistrationOpen();
    const workshopRegistrationOpen = workshopData.isRegistrationOpen;

    if (!techelonsRegistrationOpen && !workshopRegistrationOpen) {
      router.push("/registrationclosed");
    } else if (techelonsRegistrationOpen && !workshopRegistrationOpen) {
      router.push("/techelonsregistration");
    } else if (!techelonsRegistrationOpen && workshopRegistrationOpen) {
      router.push("/workshopregistration");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-6 md:mb-8">Choose Registration Type</h1>
      <p className="text-center text-sm sm:text-base text-gray-600 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto">
        We have multiple events open for registration. Please select the event you want to register for.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Workshop Registration Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full p-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Workshop Registration</CardTitle>
            <CardDescription className="text-blue-100 text-sm sm:text-base">
              {workshopData.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 pb-2 sm:pb-4 flex-grow">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">📅</span>
                <div>
                  <p className="font-medium text-sm sm:text-base">Date</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{workshopData.details.find(d => d.id === 'date')?.value || 'To be announced'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">🏛️</span>
                <div>
                  <p className="font-medium text-sm sm:text-base">Venue</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{workshopData.details.find(d => d.id === 'venue')?.value || 'To be announced'}</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-4">
                {workshopData.shortDescription}
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-4 sm:pb-6">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base py-2 sm:py-2.5"
              onClick={() => router.push("/workshopregistration")}
            >
              Register for Workshop
            </Button>
          </CardFooter>
        </Card>

        {/* Techelons Registration Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full p-0">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Techelons Registration</CardTitle>
            <CardDescription className="text-purple-100 text-sm sm:text-base">
              Techelons 2025 - Annual Tech Fest
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 pb-2 sm:pb-4 flex-grow">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start">
                <span className="text-purple-500 mr-2 mt-0.5">📅</span>
                <div>
                  <p className="font-medium text-sm sm:text-base">Date</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{FEST_DATES.DAY_1} - {FEST_DATES.DAY_2}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-purple-500 mr-2 mt-0.5">🏆</span>
                <div>
                  <p className="font-medium text-sm sm:text-base">Events</p>
                  <p className="text-gray-600 text-xs sm:text-sm">Multiple technical and non-technical events</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-4">
                Join us for Techelons 2025, the annual technical festival featuring competitions, workshops, and exciting events.
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-4 sm:pb-6">
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2 sm:py-2.5"
              onClick={() => router.push("/techelonsregistration")}
            >
              Register for Techelons
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 