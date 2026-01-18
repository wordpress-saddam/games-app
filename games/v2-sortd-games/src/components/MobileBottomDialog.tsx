import React, { useEffect, useState, useRef } from "react";
import { User, AlertCircle, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Location from "./Location";
import { LocationData } from "../../v2-services/location-service";

interface MobileBottomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  setUsername: (e: React.ChangeEvent<HTMLInputElement>) => void;
  email?: string;
  setEmail?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCustomLocationChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  error: string;
  locationData?: LocationData | null;
  locationConfirmed: boolean | null;
  onLocationChoice: (confirmed: boolean) => void;
  customLocation: string;
  onLocationUpdate: (data: LocationData | null) => void;
  isLoadingLocation: boolean;
}

const MobileBottomDialog: React.FC<MobileBottomDialogProps> = ({
  isOpen,
  onClose,
  username,
  setUsername,
  email,
  setEmail,
  onSubmit,
  isSubmitting,
  error,
  locationData,
  locationConfirmed,
  onLocationChoice,
  customLocation,
  onCustomLocationChange,
  onLocationUpdate,
  isLoadingLocation,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragVelocity, setDragVelocity] = useState(0);
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [lastMoveY, setLastMoveY] = useState(0);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const velocityRef = useRef(0);

  // Handle keyboard visibility
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      const viewport = window.visualViewport;
      if (viewport) {
        const keyboardHeight = window.innerHeight - viewport.height;
        setKeyboardHeight(Math.max(0, keyboardHeight));
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      return () =>
        window.visualViewport?.removeEventListener("resize", handleResize);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = "0";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
    };
  }, [isOpen]);

  const calculateVelocity = (currentY: number, currentTime: number) => {
    if (lastMoveTime && lastMoveY) {
      const timeDiff = currentTime - lastMoveTime;
      const yDiff = currentY - lastMoveY;
      if (timeDiff > 0) {
        velocityRef.current = yDiff / timeDiff;
      }
    }
    setLastMoveTime(currentTime);
    setLastMoveY(currentY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "BUTTON" ||
      target.closest("button")
    ) {
      return;
    }

    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setDragOffset(0);
    velocityRef.current = 0;
    setLastMoveTime(Date.now());
    setLastMoveY(e.touches[0].clientY);

    if (target.closest(".drag-handle")) {
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touchY = e.touches[0].clientY;
    const diff = touchY - startY;
    const currentTime = Date.now();

    calculateVelocity(touchY, currentTime);

    if (diff > 0) {
      setDragOffset(diff);
    } else {
      const resistance = Math.abs(diff) * 0.3;
      setDragOffset(-resistance);
    }

    const target = e.target as HTMLElement;
    if (target.closest(".drag-handle") || Math.abs(diff) > 5) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;

    setIsDragging(false);
    setIsAnimating(true);

    const finalVelocity = velocityRef.current;
    const shouldClose =
      dragOffset > 100 || (dragOffset > 50 && finalVelocity > 0.5);

    if (shouldClose) {
      const finalOffset = Math.max(dragOffset + finalVelocity * 200, 300);
      setDragOffset(finalOffset);

      setTimeout(() => {
        onClose();
        setDragOffset(0);
        setIsAnimating(false);
      }, 250);
    } else {
      setDragOffset(0);
      setTimeout(() => setIsAnimating(false), 400);
    }

    setStartY(0);
    velocityRef.current = 0;
    setLastMoveTime(0);
    setLastMoveY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "BUTTON" ||
      target.closest("button")
    ) {
      return;
    }

    setIsDragging(true);
    setStartY(e.clientY);
    setDragOffset(0);
    velocityRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const diff = e.clientY - startY;
    if (diff > 0) {
      setDragOffset(diff);
    } else {
      setDragOffset(diff * 0.3);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);
    setIsAnimating(true);

    if (dragOffset > 100) {
      onClose();
    }

    setDragOffset(0);
    setStartY(0);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const isFormValid = () => {
    if (!username.trim() || isSubmitting) return false;

    if (locationData?.success) {
      if (locationConfirmed === null) return false;
      if (locationConfirmed === false && !customLocation.trim()) return false;
    }

    return true;
  };

  if (!isOpen) return null;

  const getTransform = () => {
    if (isDragging) {
      return `translateY(${dragOffset}px)`;
    }
    return "translateY(0)";
  };

  const getTransition = () => {
    if (isDragging) {
      return "none";
    }
    if (isAnimating) {
      return "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    }
    return "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  };

  const isAndroid = /Android/i.test(navigator.userAgent);
const isIPad = /iPad/.test(navigator.userAgent) || 
               (navigator.userAgent.includes("Macintosh") && 'ontouchend' in document);
               const marginBottom = isAndroid && !isIPad && keyboardHeight > 0 ? `${keyboardHeight}px` : "0px";
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-all duration-500 ease-out"
        style={{
          opacity: isOpen ? 1 : 0,
        }}
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        className="fixed inset-x-0 bottom-0 z-[101] max-h-[90vh]"
        style={{
          transform: getTransform(),
          transition: getTransition(),
          marginBottom: marginBottom,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="bg-background rounded-t-[32px] shadow-2xl border-t border-border/20 h-full flex flex-col overflow-hidden">
          <div className="drag-handle flex justify-center pt-4 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full transition-all duration-200 hover:bg-muted-foreground/50" />
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 flex-shrink-0">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-9 w-9 p-0 hover:bg-muted/50 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-1">
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Welcome to the Game!
                </h2>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="px-6 py-4 space-y-6">
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-4">
                  <Label
                    htmlFor="username"
                    className="text-lg font-semibold text-foreground"
                  >
                    Enter your username
                  </Label>
                  <Input
                    ref={inputRef}
                    id="username"
                    type="text"
                    placeholder="Your username..."
                    value={username}
                    onChange={setUsername}
                    maxLength={20}
                    required
                    disabled={isSubmitting}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    autoFocus
                    className={
                      error
                        ? "border-red-500 focus:border-red-500 h-10 text-lg rounded-2xl border-2 border-border/20 bg-background/50 backdrop-blur-sm transition-all duration-300"
                        : "h-10 text-lg rounded-2xl border-2 border-border/20 bg-background/50 backdrop-blur-sm transition-all duration-300"
                    }
                  />
                </div>

                <Location
                  isOpen={isOpen}
                  onLocationUpdate={onLocationUpdate}
                  onLocationConfirmed={onLocationChoice}
                  onCustomLocationChange={onCustomLocationChange}
                  locationConfirmed={locationConfirmed}
                  customLocation={customLocation}
                  disabled={isSubmitting}
                />

                <div className="space-y-4">
                  <Label
                    htmlFor="email"
                    className="text-lg font-semibold text-foreground"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={setEmail}
                    disabled={isSubmitting}
                    autoComplete="email"
                    required
                    className="h-10 text-lg rounded-2xl border-2 border-border/20 bg-background/50 backdrop-blur-sm transition-all duration-300"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm  p-3 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 text-lg font-semibold rounded-2xl bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg"
                  disabled={!isFormValid()}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    "Start Playing"
                  )}
                </Button>
              </form>
            </div>

            <div className="h-8 bg-gradient-to-t from-background/50 to-transparent flex-shrink-0" />
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileBottomDialog;
