"use client"

import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react"
import PropTypes from 'prop-types'
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
  ArrowRight,
  Ticket,
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
  FEST_DAYS,
} from "@/app/_data/techelonsEventsData"

// Constants
const SHARE_SUCCESS_TIMEOUT = 2000;
const ICON_SIZE = "h-4 w-4";

// Icon map - defined outside component to prevent recreation
const ICON_MAP = {
  Code: <Code className="h-3 w-3 mr-1" />,
  Wrench: <Wrench className="h-3 w-3 mr-1" />,
  Gamepad2: <Gamepad2 className="h-3 w-3 mr-1" />,
  Palette: <Palette className="h-3 w-3 mr-1" />,
  Presentation: <Presentation className="h-3 w-3 mr-1" />,
  Calendar: <Calendar className="h-3 w-3 mr-1" />,
};

// Status configuration - defined outside component to prevent recreation
const STATUS_CONFIG = {
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
};

// Helper function to get icon component based on icon name
const getCategoryIcon = (category) => {
  const categoryStyle = getCategoryStyle(category);
  const iconName = categoryStyle.icon;
  return ICON_MAP[iconName] || ICON_MAP.Calendar;
};

// UI Components
const SectionHeading = memo(({ icon, children }) => (
  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center">
    {icon && <span className="bg-primary/20 text-primary p-1 sm:p-1.5 rounded-md mr-2">{icon}</span>}
    {children}
  </h3>
));
SectionHeading.displayName = "SectionHeading";

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
));
TimelineItem.displayName = "TimelineItem";

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
));
InfoCard.displayName = "InfoCard";

// Registration status component
const RegistrationStatus = memo(({ status }) => {
  const effectiveStatus = getEffectiveRegistrationStatus(status);
  const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.closed;

  return (
    <>
      <span className={`inline-block w-2 h-2 rounded-full ${config.color} mr-2 animate-pulse`}></span>
      {config.text}
      {config.icon}
    </>
  );
});
RegistrationStatus.displayName = "RegistrationStatus";

// Custom hooks
const useShareEvent = (event) => {
  const [shareSuccess, setShareSuccess] = useState(false);

  const copyToClipboard = useCallback((title, url) => {
    const shareText = `${title} - ${url}`;
    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), SHARE_SUCCESS_TIMEOUT);
      })
      .catch((err) => console.error("Could not copy text:", err));
  }, []);

  const handleShare = useCallback(() => {
    if (!event) return;

    const shareUrl = `${window.location.origin}/techelonsregistration?preselect=${event.id || event.category || "event"}`;
    const shareTitle = `Check out this event: ${event.name} at Techelons 2025`;

    if (navigator.share) {
      navigator
        .share({
          title: event.name,
          text: shareTitle,
          url: shareUrl,
        })
        .then(() => {
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), SHARE_SUCCESS_TIMEOUT);
        })
        .catch(() => {
          copyToClipboard(shareTitle, shareUrl);
        });
    } else {
      copyToClipboard(shareTitle, shareUrl);
    }
  }, [event, copyToClipboard]);

  return { handleShare, shareSuccess };
};

// Custom hook for responsive image handling
const useImageHandling = () => {
  const [imageState, setImageState] = useState({
    error: false,
    loading: true,
    height: "auto",
  });

  // Use a ref for window width to avoid unnecessary re-renders
  const windowWidthRef = useRef(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [isMobile, setIsMobile] = useState(windowWidthRef.current < 640);
  const [isTablet, setIsTablet] = useState(windowWidthRef.current >= 640 && windowWidthRef.current < 1024);
  const resizeTimerRef = useRef(null);

  useEffect(() => {
    // Debounced resize handler for better performance
    const handleResize = () => {
      clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        windowWidthRef.current = window.innerWidth;
        setIsMobile(windowWidthRef.current < 640);
        setIsTablet(windowWidthRef.current >= 640 && windowWidthRef.current < 1024);
      }, 100);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize, { passive: true });
      return () => {
        window.removeEventListener("resize", handleResize);
        clearTimeout(resizeTimerRef.current);
      };
    }
  }, []);

  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    const { naturalWidth, naturalHeight } = img;
    const aspectRatio = naturalWidth / naturalHeight;
    const windowWidth = windowWidthRef.current;

    const isMobileView = windowWidth < 640;
    const isTabletView = windowWidth >= 640 && windowWidth < 1024;
    const isLargeScreen = windowWidth >= 1280;

    // Adjust height based on device and aspect ratio
    const maxHeight = isMobileView
      ? aspectRatio > 1.5 ? "10rem" : "12rem"
      : isTabletView
        ? aspectRatio > 1.5 ? "14rem" : "16rem"
        : isLargeScreen
          ? aspectRatio > 1.5 ? "20rem" : "24rem"
          : aspectRatio > 1.5 ? "16rem" : "20rem";

    setImageState({
      error: false,
      loading: false,
      height: maxHeight,
    });
  }, []);

  const handleImageError = useCallback(() => {
    setImageState((prev) => ({
      ...prev,
      error: true,
      loading: false,
    }));
  }, []);

  const resetImage = useCallback(() => {
    setImageState({
      error: false,
      loading: true,
      height: "auto",
    });
  }, []);

  return {
    imageError: imageState.error,
    imageLoading: imageState.loading,
    imageHeight: imageState.height,
    handleImageLoad,
    handleImageError,
    resetImage,
    isMobile,
    isTablet,
  };
};

// Main component
const EventModal = memo(({ event, isOpen, onClose }) => {
  // Custom hooks
  const { handleShare, shareSuccess } = useShareEvent(event || {});
  const {
    imageError,
    imageLoading,
    imageHeight,
    handleImageLoad,
    handleImageError,
    resetImage,
    isMobile,
    isTablet
  } = useImageHandling();

  // Memoized values
  const imagePath = useMemo(() => (event ? getImagePath(event.image) : null), [event?.image]);
  const categoryStyle = useMemo(() => (event ? getCategoryStyle(event.category) : null), [event?.category]);
  const formattedEventDateTime = useMemo(() => (event ? formatEventDateTime(event) : null), [event]);

  const { formattedDate, formattedTime, dayOfWeek } = formattedEventDateTime || {
    formattedDate: null,
    formattedTime: null,
    dayOfWeek: null,
  };

  // Reset image state when event changes
  useEffect(() => {
    if (isOpen) {
      resetImage();
    }
  }, [event?.id, isOpen, resetImage]);

  // Handle registration button click
  const handleRegister = useCallback(() => {
    if (!event) return;

    if (event.registrationLink) {
      window.open(event.registrationLink, "_blank", "noopener,noreferrer");
    } else {
      window.open(`/techelonsregistration?preselect=${event.id || event.category || "event"}`, "_blank");
    }
  }, [event]);

  // Memoized UI sections
  const renderRules = useMemo(() => {
    if (!event?.rules?.length) return null;

    return (
      <div>
        <SectionHeading icon={<Info className={ICON_SIZE} />}>Rules</SectionHeading>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm sm:text-base bg-gradient-to-br from-red-50/90 via-rose-50/90 to-pink-50/90 dark:from-red-950/40 dark:via-rose-950/40 dark:to-pink-950/40 p-3 rounded-lg border border-red-200/80 dark:border-red-800/80 shadow-sm hover:shadow-md transition-all duration-300">
          {event.rules.map((rule, index) => (
            <li key={index} className="hover:text-foreground transition-colors duration-200">
              {rule}
            </li>
          ))}
        </ul>
      </div>
    );
  }, [event?.rules]);

  const renderInstructions = useMemo(() => {
    if (!event?.instructions) return null;

    return (
      <div>
        <SectionHeading icon={<Info className={ICON_SIZE} />}>Instructions</SectionHeading>
        <Card className="border-amber-200/80 dark:border-amber-800/80 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] bg-gradient-to-br from-amber-50/90 via-yellow-50/90 to-orange-50/90 dark:from-amber-950/40 dark:via-yellow-950/40 dark:to-orange-950/40">
          <CardContent className="p-3 sm:p-4">
            <p className="whitespace-pre-line text-sm sm:text-base">{event.instructions}</p>
          </CardContent>
        </Card>
      </div>
    );
  }, [event?.instructions]);

  const renderTeamSize = useMemo(() => {
    if (!event?.teamSize) return null;

    return (
      <div>
        <SectionHeading icon={<Users className={ICON_SIZE} />}>Team Requirements</SectionHeading>
        <Card className="border-emerald-200/80 dark:border-emerald-800/80 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] bg-gradient-to-br from-emerald-50/90 via-green-50/90 to-teal-50/90 dark:from-emerald-950/40 dark:via-green-950/40 dark:to-teal-950/40">
          <CardContent className="p-3 sm:p-4">
            <p className="text-sm sm:text-base">
              {typeof event.teamSize === "object" ? (
                <>
                  <span className="font-medium">Team Size:</span> {event.teamSize.min} - {event.teamSize.max} members
                </>
              ) : (
                <>
                  <span className="font-medium">Team Size:</span> {event.teamSize} {event.teamSize === 1 ? "member" : "members"}
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }, [event?.teamSize]);

  // If no event, don't render anything
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[800px] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{event.name}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[85vh] overflow-y-auto overscroll-contain">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-50 rounded-full bg-background/80 p-1.5 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Event image */}
          <div
            className="relative w-full overflow-hidden bg-gradient-to-b from-gray-900 to-gray-800"
            style={{ height: imageHeight }}
          >
            {!imageError && (
              <img
                src={imagePath}
                alt={event.name}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
                loading="eager"
                fetchPriority="high"
              />
            )}

            {/* Loading state */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="w-full h-full absolute inset-0" />
                <div className="text-white text-opacity-80 text-sm animate-pulse">Loading image...</div>
              </div>
            )}

            {/* Fallback for error */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center p-4">
                  <div className="text-4xl mb-2">{event.emoji || "🎮"}</div>
                  <div className="text-white text-opacity-80 text-sm">Event image unavailable</div>
                </div>
              </div>
            )}

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>

            {/* Event category badge */}
            <div className="absolute top-4 left-4">
              <Badge
                className={cn(
                  "text-xs px-2 py-1 font-medium",
                  categoryStyle?.color || "bg-primary text-primary-foreground"
                )}
              >
                {getCategoryIcon(event.category)}
                {event.category}
              </Badge>
            </div>

            {/* Event title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 drop-shadow-md line-clamp-2">
                {event.name}
              </h2>
              {event.tagline && (
                <p className="text-white text-opacity-90 text-sm sm:text-base mb-2 drop-shadow-sm line-clamp-2">
                  {event.tagline}
                </p>
              )}
            </div>
          </div>

          {/* Event details */}
          <div className="p-4 sm:p-6">
            <div className="space-y-6">
              {/* Basic info cards */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {/* Consolidated Event Details */}
                <InfoCard
                  icon={<Info className={ICON_SIZE} />}
                  title="Event Details"
                  className="overflow-hidden"
                >
                  <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date and Time */}
                    <div className="flex items-start">
                      <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-primary">
                          {event.festDay === FEST_DAYS.DAY_1 ? "Day 1" : "Day 2"}
                        </div>
                        <div>{formattedDate} ({dayOfWeek})</div>
                        <div>{formattedTime}</div>
                        {event.duration && (
                          <div className="flex items-center mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>Duration: {event.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {event.venue && (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium">Location</div>
                          <div className="break-words">{event.venue}</div>
                        </div>
                      </div>
                    )}

                    {/* Speaker */}
                    {event.speaker && (
                      <div className="flex items-start">
                        <User className="h-4 w-4 mr-2 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium">Speaker</div>
                          <div className="break-words">{event.speaker}</div>
                        </div>
                      </div>
                    )}

                    {/* Registration status */}
                    <div className="flex items-start">
                      <Ticket className="h-4 w-4 mr-2 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">Registration</div>
                        <div className="flex items-center">
                          <RegistrationStatus status={event.registrationStatus} />
                        </div>
                      </div>
                    </div>
                  </div>
                </InfoCard>
              </div>

              {/* Description */}
              {event.description && (
                <div>
                  <SectionHeading icon={<BookOpen className={ICON_SIZE} />}>Description</SectionHeading>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <p className="whitespace-pre-line">{event.description}</p>
                  </div>
                </div>
              )}

              {/* Rules */}
              {renderRules}

              {/* Instructions */}
              {renderInstructions}

              {/* Team size */}
              {renderTeamSize}

              {/* Prizes */}
              {event.prizes && (
                <div>
                  <SectionHeading icon={<Trophy className={ICON_SIZE} />}>Prizes</SectionHeading>
                  <Card className="border-blue-200/80 dark:border-blue-800/80 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-violet-50/90 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-violet-950/40">
                    <CardContent className="p-3 sm:p-4">
                      {Array.isArray(event.prizes) ? (
                        <ul className="space-y-2">
                          {event.prizes.map((prize, index) => (
                            <li key={index} className="text-sm sm:text-base">
                              <span className="font-medium">{prize.position}: </span>
                              {prize.reward}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="whitespace-pre-line text-sm sm:text-base">{event.prizes}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Coordinators */}
              {event.coordinators && event.coordinators.length > 0 && (
                <div>
                  <SectionHeading icon={<MessageCircle className={ICON_SIZE} />}>Contact Coordinators</SectionHeading>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {event.coordinators.map((coordinator, index) => (
                      <Card key={index} className="border-cyan-200/80 dark:border-cyan-800/80 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] bg-gradient-to-br from-cyan-50/90 via-sky-50/90 to-blue-50/90 dark:from-cyan-950/40 dark:via-sky-950/40 dark:to-blue-950/40">
                        <CardContent className="p-3 sm:p-4">
                          <h4 className="font-medium text-sm sm:text-base mb-1 break-words">{coordinator.name}</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {coordinator.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                                <a 
                                  href={`mailto:${coordinator.email}`} 
                                  className="hover:text-primary transition-colors break-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {coordinator.email}
                                </a>
                              </div>
                            )}
                            {coordinator.phone && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                                <a 
                                  href={`tel:${coordinator.phone}`} 
                                  className="hover:text-primary transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {coordinator.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources */}
              {event.resources && (
                <div>
                  <SectionHeading icon={<BookOpen className={ICON_SIZE} />}>Resources</SectionHeading>
                  <Card className="border-lime-200/80 dark:border-lime-800/80 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] bg-gradient-to-br from-lime-50/90 via-green-50/90 to-emerald-50/90 dark:from-lime-950/40 dark:via-green-950/40 dark:to-emerald-950/40">
                    <CardContent className="p-3 sm:p-4">
                      <p className="whitespace-pre-line text-sm sm:text-base">{event.resources}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 sticky bottom-0 bg-background/95 backdrop-blur-sm py-3 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 sm:px-6 border-t">
                {event.registrationStatus !== "closed" && (
                  <Button
                    onClick={handleRegister}
                    className="flex-1 bg-primary hover:bg-primary/90 h-10 sm:h-11 touch-manipulation"
                  >
                    {event.registrationStatus === "open" ? "Register Now" : "Notify Me"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="flex-1 h-10 sm:h-11 touch-manipulation"
                >
                  {shareSuccess ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Event
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

EventModal.displayName = "EventModal";

EventModal.propTypes = {
  event: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default EventModal;