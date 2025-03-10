"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Code,
  ExternalLink,
  Gamepad2,
  Gift,
  Info,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Presentation,
  Share2,
  Trophy,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  formatEventDateTime,
  getImagePath,
  getCategoryStyle,
  EVENT_IMAGES,
  getEffectiveRegistrationStatus,
} from "@/app/_data/techelonsEventsData"

// Helper function to get icon component based on icon name
const getCategoryIcon = (category) => {
  const categoryStyle = getCategoryStyle(category)
  const iconName = categoryStyle.icon

  const iconMap = {
    Code: <Code className="h-3 w-3 mr-1" />,
    Wrench: <Wrench className="h-3 w-3 mr-1" />,
    Gamepad2: <Gamepad2 className="h-3 w-3 mr-1" />,
    Palette: <Palette className="h-3 w-3 mr-1" />,
    Presentation: <Presentation className="h-3 w-3 mr-1" />,
    Calendar: <Calendar className="h-3 w-3 mr-1" />,
  }

  return iconMap[iconName] || iconMap.Calendar
}

// UI Components
const SectionHeading = memo(({ icon, children }) => (
  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center">
    {icon && <span className="bg-primary/20 text-primary p-1 sm:p-1.5 rounded-md mr-2">{icon}</span>}
    {children}
  </h3>
))
SectionHeading.displayName = "SectionHeading"

const TimelineItem = memo(({ icon, time, description }) => (
  <div className="relative">
    <div className="absolute -left-[25px] sm:-left-[29px] w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-background rounded-full"></div>
    </div>
    <div className="bg-gradient-to-r from-violet-50/90 via-purple-50/90 to-fuchsia-50/90 dark:from-violet-950/40 dark:via-purple-950/40 dark:to-fuchsia-950/40 p-3 sm:p-4 rounded-lg border border-purple-200/80 dark:border-purple-800/80 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
      <div className="flex items-center text-primary font-medium mb-1 text-sm sm:text-base">
        {icon}
        {time}
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
))
TimelineItem.displayName = "TimelineItem"

const InfoCard = memo(({ icon, title, children, className }) => (
  <Card className={cn("overflow-hidden hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]", className)}>
    <CardContent className="p-4">
      <div className="flex items-start">
        {icon && (
          <div className="bg-primary/20 rounded-full p-1.5 sm:p-2 mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-medium text-sm sm:text-base">{title}</h4>}
          {children}
        </div>
      </div>
    </CardContent>
  </Card>
))
InfoCard.displayName = "InfoCard"

// Registration status component
const RegistrationStatus = memo(({ status }) => {
  const effectiveStatus = getEffectiveRegistrationStatus(status)

  const statusConfig = {
    open: {
      color: "bg-emerald-500",
      text: "Registration Open",
      icon: <ExternalLink className="ml-2 h-4 w-4" />,
    },
    "coming-soon": {
      color: "bg-amber-500",
      text: "Coming Soon",
      icon: null,
    },
    closed: {
      color: "bg-rose-500",
      text: "Registration Closed",
      icon: null,
    },
  }

  const config = statusConfig[effectiveStatus] || statusConfig.closed

  return (
    <>
      <span className={`inline-block w-2 h-2 rounded-full ${config.color} mr-2 animate-pulse`}></span>
      {config.text}
      {config.icon}
    </>
  )
})
RegistrationStatus.displayName = "RegistrationStatus"

// Custom hooks
const useShareEvent = (event) => {
  const [shareSuccess, setShareSuccess] = useState(false)

  const copyToClipboard = useCallback((title, url) => {
    const shareText = `${title} - ${url}`
    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      })
      .catch((err) => console.error("Could not copy text:", err))
  }, [])

  const handleShare = useCallback(() => {
    if (!event) return

    const shareUrl = `${window.location.origin}/techelonsregistration?preselect=${event.id || event.category || "event"}`
    const shareTitle = `Check out this event: ${event.name} at Techelons 2025`

    if (navigator.share) {
      navigator
        .share({
          title: event.name,
          text: shareTitle,
          url: shareUrl,
        })
        .then(() => {
          setShareSuccess(true)
          setTimeout(() => setShareSuccess(false), 2000)
        })
        .catch(() => {
          copyToClipboard(shareTitle, shareUrl)
        })
    } else {
      copyToClipboard(shareTitle, shareUrl)
    }
  }, [event, copyToClipboard])

  return { handleShare, shareSuccess }
}

const useImageHandling = () => {
  const [imageState, setImageState] = useState({
    error: false,
    loading: true,
    height: "auto",
  })
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  const handleImageLoad = useCallback(
    (e) => {
      const img = e.target
      const { naturalWidth, naturalHeight } = img
      const aspectRatio = naturalWidth / naturalHeight

      const isMobile = windowWidth < 640
      const isTablet = windowWidth >= 640 && windowWidth < 1024
      const isLargeScreen = windowWidth >= 1280

      const maxHeight = isMobile
        ? aspectRatio > 1.5
          ? "10rem"
          : "12rem"
        : isTablet
          ? aspectRatio > 1.5
            ? "14rem"
            : "16rem"
          : isLargeScreen
            ? aspectRatio > 1.5
              ? "20rem"
              : "24rem"
            : aspectRatio > 1.5
              ? "16rem"
              : "20rem"

      setImageState({
        error: false,
        loading: false,
        height: maxHeight,
      })
    },
    [windowWidth],
  )

  const handleImageError = useCallback(() => {
    setImageState((prev) => ({
      ...prev,
      error: true,
      loading: false,
    }))
  }, [])

  const resetImage = useCallback(() => {
    setImageState({
      error: false,
      loading: true,
      height: "auto",
    })
  }, [])

  return {
    imageError: imageState.error,
    imageLoading: imageState.loading,
    imageHeight: imageState.height,
    handleImageLoad,
    handleImageError,
    resetImage,
    isMobile: windowWidth < 640,
  }
}

// Main component
const EventModal = ({ event, isOpen, onClose }) => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
  })

  // Custom hooks
  const { handleShare, shareSuccess } = useShareEvent(event || {})
  const { imageError, imageLoading, imageHeight, handleImageLoad, handleImageError, resetImage } = useImageHandling()

  const imagePath = useMemo(() => (event ? getImagePath(event.image) : null), [event?.image])
  const categoryStyle = useMemo(() => (event ? getCategoryStyle(event.category) : null), [event?.category])
  const formattedEventDateTime = useMemo(() => (event ? formatEventDateTime(event) : null), [event])
  const { formattedDate, formattedTime, dayOfWeek } = formattedEventDateTime || {
    formattedDate: null,
    formattedTime: null,
    dayOfWeek: null,
  }

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const isSmallScreen = windowSize.width < 640

  // Reset image state when event changes
  useEffect(() => {
    if (isOpen) {
      resetImage()
    }
  }, [event?.id, isOpen, resetImage])

  // Handle registration button click
  const handleRegister = useCallback(() => {
    if (event.registrationLink) {
      window.open(event.registrationLink, "_blank", "noopener,noreferrer")
    } else {
      window.open(`/techelonsregistration?preselect=${event.id || event.category || "event"}`, "_blank")
    }
  }, [event?.id, event?.category, event?.registrationLink])

  // Render sections conditionally
  const renderRules = useMemo(() => {
    if (!event?.rules?.length) return null

    return (
      <div>
        <SectionHeading icon={<Info className="h-4 w-4" />}>Rules</SectionHeading>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm sm:text-base bg-gradient-to-br from-red-50/90 via-rose-50/90 to-pink-50/90 dark:from-red-950/40 dark:via-rose-950/40 dark:to-pink-950/40 p-3 rounded-lg border border-red-200/80 dark:border-red-800/80 shadow-sm hover:shadow-md transition-all duration-300">
          {event.rules.map((rule, index) => (
            <li key={index} className="hover:text-foreground transition-colors duration-200">
              {rule}
            </li>
          ))}
        </ul>
      </div>
    )
  }, [event?.rules])

  const renderInstructions = useMemo(() => {
    if (!event?.instructions) return null

    return (
      <div>
        <SectionHeading icon={<Info className="h-4 w-4" />}>Instructions</SectionHeading>
        <Card className="border-amber-200/80 dark:border-amber-800/80 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] bg-gradient-to-br from-amber-50/90 via-yellow-50/90 to-orange-50/90 dark:from-amber-950/40 dark:via-yellow-950/40 dark:to-orange-950/40">
          <CardContent className="p-3 sm:p-4">
            <p className="whitespace-pre-line text-sm sm:text-base">{event.instructions}</p>
          </CardContent>
        </Card>
      </div>
    )
  }, [event?.instructions])

  const renderTeamSize = useMemo(() => {
    if (!event?.teamSize) return null

    return (
      <div>
        <SectionHeading icon={<Users className="h-4 w-4" />}>Team Requirements</SectionHeading>
        <Card className="border-emerald-200/80 dark:border-emerald-800/80 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] bg-gradient-to-br from-emerald-50/90 via-green-50/90 to-teal-50/90 dark:from-emerald-950/40 dark:via-green-950/40 dark:to-teal-950/40">
          <CardContent className="p-3 sm:p-4">
            <p className="font-medium text-sm sm:text-base">
              {event.teamSize.min === event.teamSize.max
                ? `Team of exactly ${event.teamSize.min} ${event.teamSize.min === 1 ? "person" : "people"}`
                : `Team of ${event.teamSize.min} to ${event.teamSize.max} people`}
            </p>
            {event.teamRequirements && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">{event.teamRequirements}</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }, [event?.teamSize, event?.teamRequirements])

  // Get effective registration status
  const effectiveStatus = getEffectiveRegistrationStatus(event?.registrationStatus)

  // Status color mapping
  const statusColorMap = {
    open: "bg-gradient-to-r from-emerald-500 to-teal-600",
    "coming-soon": "bg-gradient-to-r from-amber-500 to-orange-600",
    closed: "bg-gradient-to-r from-rose-500 to-red-600",
  }

  const statusColor = statusColorMap[effectiveStatus] || statusColorMap.closed

  if (!event) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col w-full bg-gradient-to-b from-background to-background/95 border-primary/20">
        {/* Header with close button */}
        <DialogHeader className="p-2 sm:p-4 border-b border-primary/20 sticky top-0 bg-background/95 backdrop-blur-sm z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center overflow-hidden">
              {event.category && (
                <Badge className={cn("mr-2 flex-shrink-0 text-xs shadow-sm", categoryStyle?.color)}>
                  {getCategoryIcon(event.category)}
                  <span className={isSmallScreen ? "inline max-w-[60px] truncate" : "inline"}>{event.category}</span>
                </Badge>
              )}
              <DialogTitle className="text-sm sm:text-lg md:text-xl font-bold truncate bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                {event.name}
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-primary/10 hover:text-primary flex-shrink-0 ml-1 sm:ml-2 h-7 w-7 sm:h-9 sm:w-9 transition-colors duration-200"
            >
              <X className="h-3 w-3 sm:h-5 sm:w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-grow">
          {/* Event image */}
          <div
            className="relative w-full bg-gradient-to-b from-muted/50 to-muted flex items-center justify-center overflow-hidden"
            style={{ height: isSmallScreen ? "10rem" : imageHeight }}
          >
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            )}

            <div className="w-full h-full flex items-center justify-center">
              <img
                src={!imageError ? imagePath : EVENT_IMAGES.FALLBACK_IMAGE}
                alt={event.name}
                className={cn(
                  "max-w-[98%] max-h-[98%] object-contain shadow-lg rounded-md",
                  imageLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300",
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          </div>

          {/* Event details */}
          <div className="p-2 sm:p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
              {/* Left column: Main details */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-6">
                {/* Description */}
                <div>
                  <SectionHeading icon={<Info className="h-3 w-3 sm:h-4 sm:w-4" />}>About This Event</SectionHeading>
                  <p className="text-muted-foreground whitespace-pre-line text-xs sm:text-base bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-sky-50/90 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-sky-950/40 p-3 rounded-lg border border-blue-200/80 dark:border-blue-800/80 shadow-sm hover:shadow-md transition-all duration-300">
                    {event.description || event.shortDescription || "No description available."}
                  </p>
                </div>

                {/* Rules, if available */}
                {renderRules}

                {/* Instructions, if available */}
                {renderInstructions}

                {/* Team Size Requirements, if available */}
                {renderTeamSize}

                {/* Timeline */}
                {event.timeline?.length > 0 && (
                  <div>
                    <SectionHeading icon={<Clock className="h-3 w-3 sm:h-4 sm:w-4" />}>Event Timeline</SectionHeading>
                    <div className="relative pl-4 sm:pl-8 border-l-2 border-primary/30 space-y-2 sm:space-y-4 ml-1 sm:ml-2">
                      {event.timeline.map((item, index) => (
                        <TimelineItem
                          key={index}
                          icon={<Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                          time={item.time}
                          description={item.description}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Schedule, if available */}
                {event.schedule?.length > 0 && (
                  <div>
                    <SectionHeading icon={<Clock className="h-3 w-3 sm:h-4 sm:w-4" />}>Schedule</SectionHeading>
                    <div className="relative pl-4 sm:pl-8 border-l-2 border-primary/30 space-y-2 sm:space-y-4 ml-1 sm:ml-2">
                      {/* Start time */}
                      <TimelineItem
                        icon={<Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                        time={`Start: ${formattedTime}`}
                        description="Event begins"
                      />

                      {/* Schedule breakdown */}
                      {event.schedule.map((item, index) => (
                        <TimelineItem
                          key={index}
                          icon={<Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                          time={item.time}
                          description={item.activity}
                        />
                      ))}

                      {/* End time */}
                      {event.endTime && (
                        <TimelineItem
                          icon={<Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                          time={`End: ${event.endTime}`}
                          description="Event concludes"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Prizes */}
                {event.prizes?.length > 0 && (
                  <div>
                    <SectionHeading icon={<Trophy className="h-3 w-3 sm:h-4 sm:w-4" />}>Prizes</SectionHeading>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {event.prizes.map((prize, index) => (
                        <InfoCard
                          key={index}
                          icon={<Gift className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />}
                          title={prize.title || prize.position || `Prize ${index + 1}`}
                          className="bg-gradient-to-br from-yellow-50/90 via-amber-50/90 to-orange-50/90 dark:from-yellow-950/40 dark:via-amber-950/40 dark:to-orange-950/40 border-yellow-200/80 dark:border-yellow-800/80"
                        >
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {prize.description || prize.reward || ""}
                          </p>
                          {prize.value && (
                            <p className="text-xs sm:text-sm font-medium text-primary mt-1 bg-primary/10 px-2 py-1 rounded-md inline-block">
                              Value: {prize.value}
                            </p>
                          )}
                        </InfoCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources, if available */}
                {event.resources && (
                  <div>
                    <SectionHeading icon={<BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />}>Resources</SectionHeading>
                    <Card className="bg-gradient-to-br from-cyan-50/90 via-sky-50/90 to-blue-50/90 dark:from-cyan-950/40 dark:via-sky-950/40 dark:to-blue-950/40 border-cyan-200/80 dark:border-cyan-800/80 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]">
                      <CardContent className="p-2 sm:p-4">
                        <p className="whitespace-pre-line text-xs sm:text-base">{event.resources}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Eligibility criteria, if available */}
                {event.eligibility && (
                  <div>
                    <SectionHeading icon={<CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />}>
                      Eligibility
                    </SectionHeading>
                    <Card className="border-teal-200/80 dark:border-teal-800/80 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] bg-gradient-to-br from-teal-50/90 via-emerald-50/90 to-green-50/90 dark:from-teal-950/40 dark:via-emerald-950/40 dark:to-green-950/40">
                      <CardContent className="p-2 sm:p-4">
                        <p className="whitespace-pre-line text-xs sm:text-base">{event.eligibility}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Right column: Event details and contacts */}
              <div className="space-y-2 sm:space-y-4">
                {/* For small screens, show a horizontal grid of info cards */}
                {isSmallScreen && (
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mb-2">
                    {/* Date and time */}
                    <InfoCard
                      icon={<Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />}
                      title="Date & Time"
                      className="bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-violet-50/90 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-violet-950/40 border-blue-200/80 dark:border-blue-800/80"
                    >
                      <div className="text-xs space-y-0.5">
                        <p className="font-medium">{formattedDate}</p>
                        <p className="text-muted-foreground">{dayOfWeek}</p>
                        {event.festDay && (
                          <p className="text-primary font-medium">{event.festDay === "day1" ? "Day 1" : "Day 2"}</p>
                        )}
                        <div className="mt-1 bg-blue-100/80 dark:bg-blue-900/40 p-1 rounded-md backdrop-blur-sm">
                          <p className="text-xs font-medium flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-primary" />
                            <span className="text-primary font-semibold">Time: </span>
                            <span className="ml-1">{event.time || formattedTime}</span>
                          </p>
                        </div>
                      </div>
                    </InfoCard>

                    {/* Venue */}
                    <InfoCard
                      icon={<MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />}
                      title="Venue"
                      className="bg-gradient-to-br from-emerald-50/90 via-green-50/90 to-teal-50/90 dark:from-emerald-950/40 dark:via-green-950/40 dark:to-teal-950/40 border-emerald-200/80 dark:border-emerald-800/80"
                    >
                      <p className="text-xs">{event.venue}</p>
                      {event.venueDetails && (
                        <p className="text-xs text-muted-foreground mt-0.5">{event.venueDetails}</p>
                      )}
                    </InfoCard>
                  </div>
                )}

                {/* For medium and large screens, show cards vertically */}
                {!isSmallScreen && (
                  <>
                    {/* Date and time */}
                    <InfoCard
                      icon={<Calendar className="h-4 w-4 text-primary" />}
                      title="Date & Time"
                      className="bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-violet-50/90 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-violet-950/40 border-blue-200/80 dark:border-blue-800/80"
                    >
                      <div className="text-sm space-y-1">
                        <p className="font-medium">{formattedDate}</p>
                        <p className="text-muted-foreground">{dayOfWeek}</p>
                        {event.festDay && (
                          <p className="text-primary font-medium">{event.festDay === "day1" ? "Day 1" : "Day 2"}</p>
                        )}
                        <div className="mt-1.5 bg-blue-100/80 dark:bg-blue-900/40 p-2 rounded-md backdrop-blur-sm">
                          <p className="text-sm font-medium flex items-center">
                            <Clock className="h-4 w-4 mr-1.5 text-primary" />
                            <span className="text-primary font-semibold">Time: </span>
                            <span className="ml-1">{event.time || formattedTime}</span>
                          </p>
                        </div>
                        {event.duration && (
                          <p className="text-muted-foreground text-sm mt-1.5">Duration: {event.duration}</p>
                        )}
                      </div>
                    </InfoCard>

                    {/* Venue */}
                    <InfoCard
                      icon={<MapPin className="h-4 w-4 text-primary" />}
                      title="Venue"
                      className="bg-gradient-to-br from-emerald-50/90 via-green-50/90 to-teal-50/90 dark:from-emerald-950/40 dark:via-green-950/40 dark:to-teal-950/40 border-emerald-200/80 dark:border-emerald-800/80"
                    >
                      <p className="text-sm">{event.venue}</p>
                      {event.venueDetails && <p className="text-sm text-muted-foreground mt-1">{event.venueDetails}</p>}
                      {event.venueDirections && (
                        <p className="text-sm text-muted-foreground mt-1">{event.venueDirections}</p>
                      )}
                    </InfoCard>
                  </>
                )}

                {/* Registration Status */}
                <InfoCard
                  icon={<Info className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />}
                  title="Registration Status"
                  className="bg-gradient-to-br from-purple-50/90 via-violet-50/90 to-fuchsia-50/90 dark:from-purple-950/40 dark:via-violet-950/40 dark:to-fuchsia-950/40 border-purple-200/80 dark:border-purple-800/80"
                >
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        effectiveStatus === "open"
                          ? "bg-emerald-500"
                          : effectiveStatus === "coming-soon"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      } animate-pulse`}
                    ></span>
                    <span className="capitalize text-xs sm:text-sm">
                      {effectiveStatus === "open"
                        ? "Registration Open"
                        : effectiveStatus === "coming-soon"
                          ? "Coming Soon"
                          : "Registration Closed"}
                    </span>
                  </div>
                  {event.registrationDeadline && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                      <span className="font-medium">Deadline:</span> {event.registrationDeadline}
                    </p>
                  )}
                </InfoCard>

                {/* Speaker */}
                {event.speaker && (
                  <InfoCard
                    icon={<User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />}
                    title="Speaker"
                    className="bg-gradient-to-br from-amber-50/90 via-yellow-50/90 to-orange-50/90 dark:from-amber-950/40 dark:via-yellow-950/40 dark:to-orange-950/40 border-amber-200/80 dark:border-amber-800/80"
                  >
                    <p className="text-xs sm:text-sm">{event.speaker}</p>
                    {event.speakerInfo && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{event.speakerInfo}</p>
                    )}
                  </InfoCard>
                )}

                {/* Coordinators */}
                {event.coordinators?.length > 0 && (
                  <InfoCard
                    icon={<Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />}
                    title="Contact Coordinators"
                    className="bg-gradient-to-br from-red-50/90 via-rose-50/90 to-pink-50/90 dark:from-red-950/40 dark:via-rose-950/40 dark:to-pink-950/40 border-red-200/80 dark:border-red-800/80"
                  >
                    <div className="space-y-2 sm:space-y-3 mt-1 sm:mt-2">
                      {event.coordinators.map((coordinator, index) => (
                        <div key={index} className="text-xs sm:text-sm">
                          <p className="font-medium">{coordinator.name}</p>
                          {coordinator.phone && (
                            <a
                              href={`tel:${coordinator.phone}`}
                              className="flex items-center text-muted-foreground hover:text-primary transition-colors mt-0.5 sm:mt-1"
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              {coordinator.phone}
                            </a>
                          )}
                          {coordinator.email && (
                            <a
                              href={`mailto:${coordinator.email}`}
                              className="flex items-center text-muted-foreground hover:text-primary transition-colors mt-0.5 sm:mt-1"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              {coordinator.email}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </InfoCard>
                )}

                {/* WhatsApp Group Link, if available */}
                {event.whatsappGroup && (
                  <InfoCard
                    icon={<MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />}
                    title="WhatsApp Group"
                    className="bg-gradient-to-br from-green-50/90 via-emerald-50/90 to-teal-50/90 dark:from-green-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 border-green-200/80 dark:border-green-800/80"
                  >
                    <a
                      href={event.whatsappGroup}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-xs sm:text-sm text-primary hover:underline mt-1 group"
                    >
                      <ExternalLink className="h-3 w-3 mr-1 group-hover:translate-x-0.5 transition-transform" />
                      Join WhatsApp Group
                    </a>
                  </InfoCard>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with action buttons */}
        <div className="p-2 sm:p-4 border-t border-primary/20 sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <Button
              variant="outline"
              size={isSmallScreen ? "sm" : "default"}
              onClick={handleShare}
              className="w-full sm:w-auto order-2 sm:order-1 flex items-center h-8 sm:h-10 text-xs sm:text-sm border-primary/20 hover:bg-primary/10 hover:text-primary transition-all duration-300"
            >
              {shareSuccess ? (
                <>
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span>Share Event</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleRegister}
              size={isSmallScreen ? "sm" : "default"}
              className={`w-full sm:w-auto order-1 sm:order-2 h-8 sm:h-10 text-xs sm:text-sm ${effectiveStatus === "open" ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-300" : "opacity-80"}`}
              disabled={effectiveStatus !== "open"}
            >
              <RegistrationStatus status={event.registrationStatus} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default memo(EventModal)