import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import GamesServices from "../../v2-services/games-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
import { User, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
// import Location from "./Location";
// import MobileBottomDialog from "./MobileBottomDialog";
import { LocationData } from "../../v2-services/location-service";
import KeycloakLoginButton from "./KeycloakLoginButton";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { sendCustomEvent } from "../analytics/ga"; // Import sendCustomEvent
// import { set } from "date-fns";
interface UserData {
  username: string;
  user_id?: string;
  token?: string;
  country?: string;
  city?: string;
  region?: string;
  image?: string;
  emoji?: string;
  email?: string;
  isAnonymous?: boolean;
}

interface UserRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserData) => void;
  title?: string;
  description?: string;
}

const UserRegistrationDialog: React.FC<UserRegistrationDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  description,
}) => {
  const { t } = useTranslation();
  const { setUser } = useUser();
  // const isMobile = useIsMobile();
  
  const dialogTitle = title || t('auth.welcomeToTheGame');
  const dialogDescription = description || t('auth.thisWillBeUsedToIdentifyYou');

  const handleContinueAsGuest = () => {
    // Create anonymous user
    const anonymousUser: UserData = {
      // username: `Guest_${Date.now()}`,
      username: 'Guest User',
      isAnonymous: true,
    };

    setUser(anonymousUser);
    
    sendCustomEvent('anonymous_user_start', {
      method: 'guest_mode',
      user: 'anonymous',
      domain: window.location.hostname,
    });

    resetForm();
    onClose();
    onSuccess?.(anonymousUser);
  };

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState<boolean | null>(
    null
  );
  const [customLocation, setCustomLocation] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();

const trimmedUsername = username.trim();
const trimmedEmail = email.trim();

if (!trimmedUsername) {
  setError(t("auth.usernameRequired"));
  return;
}

if (trimmedUsername.length < 3 || trimmedUsername.length > 12) {
  setError(t("auth.usernameLength"));
  return;
}

// Check: Must contain at least one alphanumeric character (no only special characters)
if (!/[a-zA-Z0-9]/.test(trimmedUsername)) {
  setError(t("auth.usernameMustContainLettersOrNumbers"));
  return;
}

// Optional: if you want to allow only certain characters (alphanumeric + underscore, etc.)
if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
  setError(t("auth.usernameCanOnlyContainLettersNumbersAndUnderscores"));
  return;
}

// Email required + validation (simple regex)
if (!trimmedEmail) {
  setError(t("auth.emailRequired"));
  return;
}
const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;
if (!emailRegex.test(trimmedEmail)) {
  setError(t("auth.pleaseEnterValidEmail"));
  return;
}

    setIsSubmitting(true);
    setError("");

    try {
      let userData: UserData = {
        username: username.trim(),
        email: trimmedEmail,
      };

      if (locationConfirmed === true && locationData?.success) {
        userData = {
          ...userData,
          country: locationData.country,
          region: locationData.region,
          city: locationData.city,
          image: locationData.flag?.img,
          emoji: locationData.flag?.emoji,
        };
      } else if (locationConfirmed === false && customLocation.trim()) {
        userData = {
          ...userData,
          country: customLocation.trim(),
          region: customLocation.trim(),
          city: customLocation.trim(),
        };
      }

      const addUserResponse = await GamesServices.addUser(userData);
      console.log(addUserResponse);
      if (addUserResponse?.status) {
        const data = addUserResponse.data;
        const token = data?.token;
        const user_id = data?.user_id;

        if (!token || !user_id) throw new Error("Token or user_id missing");

        const finalUser: UserData = {
          ...userData,
          token,
          user_id,
        };

        setUser(finalUser);
        sendCustomEvent('sign_up', {
          method: 'local_form', // Standard GA4 parameter for sign_up event
          user: finalUser.user_id,
          domain: window.location.hostname,
          location_confirmed: locationConfirmed,
          location_source: locationData?.source || 'manual', // 'auto', 'gps', 'ip', 'manual'
          country: finalUser.country,
          city: finalUser.city,
        });
        resetForm();
        onClose();
        onSuccess?.(finalUser);
        } else {
          const errorMsg =
          addUserResponse?.error?.message || t("auth.failedToCreateUser");
          setError(errorMsg);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.log(error);
          setError(t("auth.usernameAndEmailAlreadyExist"));
        } else {
          setError(t("auth.unknownErrorOccurred"));
        }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    setEmail("");
    setError("");
    setLocationConfirmed(null);
    setCustomLocation("");
    setLocationData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setUsername(e.target.value);
  //   if (error) setError("");
  // };

  // const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setEmail(e.target.value);
  //   if (error) setError("");
  // };

  // const handleLocationUpdate = (data: LocationData | null) => {
  //   setLocationData(data);
  // };

  // const handleLocationConfirmed = (confirmed: boolean) => {
  //   setLocationConfirmed(confirmed);
  //   if (confirmed) {
  //     setCustomLocation("");
  //   }
  //   if (error) setError("");
  // };

  // const handleCustomLocationChange = (location: string) => {
  //   setCustomLocation(location);
  //   if (error) setError("");
  // };

  // const isFormValid = () => {
  //   if (!username.trim() || isSubmitting) return false;
  //   if (!email.trim()) return false;
  //   {
  //     const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;
  //     if (!emailRegex.test(email.trim())) return false;
  //   }

  //   if (locationData?.success) {
  //     if (locationConfirmed === null) return false;
  //     if (locationConfirmed === false && !customLocation.trim()) return false;
  //   }

  //   return true;
  // };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <KeycloakLoginButton className="w-full" />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('games.hungryTrail.or')}
              </span>
            </div>
          </div>
          <Button
            onClick={handleContinueAsGuest}
            variant="outline"
            className="w-full"
          >
            {t('auth.continueAsGuest')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Render mobile version if on mobile
  // if (isMobile) {
  //   return (
  //     <MobileBottomDialog
  //       isOpen={isOpen}
  //       onClose={handleClose}
  //       username={username}
  //       setUsername={handleUsernameChange}
  //       email={email}
  //       setEmail={handleEmailChange}
  //       onSubmit={handleSubmit}
  //       isSubmitting={isSubmitting}
  //       error={error}
  //       locationData={locationData}
  //       locationConfirmed={locationConfirmed}
  //       onLocationChoice={handleLocationConfirmed}
  //       customLocation={customLocation}
  //       onCustomLocationChange={handleCustomLocationChange}
  //       onLocationUpdate={handleLocationUpdate}
  //       isLoadingLocation={false}
  //     />
  //   );
  // }

  // return (
  //   <Dialog open={isOpen} onOpenChange={handleClose}>
  //     <DialogContent className="sm:max-w-md">
  //       <DialogHeader>
  //         <DialogTitle className="flex items-center gap-2">
  //           <User className="h-5 w-5" />
  //           {title}
  //         </DialogTitle>
  //       </DialogHeader>

  //       <form onSubmit={handleSubmit} className="space-y-4">
  //         <div className="space-y-2">
  //           <Label htmlFor="username">Enter your username</Label>
  //           <Input
  //             id="username"
  //             type="text"
  //             placeholder="Your username..."
  //             value={username}
  //             onChange={handleUsernameChange}
  //             maxLength={20}
  //             required
  //             autoFocus
  //             disabled={isSubmitting}
  //             autoComplete="off"
  //             className={error ? "border-red-500 focus:border-red-500" : ""}
  //           />
  //           {description && (
  //             <p className="text-xs text-muted-foreground">{description}</p>
  //           )}
  //         </div>

  //         <div className="space-y-2">
  //           <Label htmlFor="email">Email</Label>
  //           <Input
  //             id="email"
  //             type="email"
  //             placeholder="you@example.com"
  //             value={email}
  //             onChange={handleEmailChange}
  //             disabled={isSubmitting}
  //             autoComplete="email"
  //             required
  //           />
  //           <p className="text-xs text-muted-foreground">We'll use this to personalize your experience.</p>
  //         </div>

  //         <Location
  //           isOpen={isOpen}
  //           onLocationUpdate={handleLocationUpdate}
  //           onLocationConfirmed={handleLocationConfirmed}
  //           onCustomLocationChange={handleCustomLocationChange}
  //           locationConfirmed={locationConfirmed}
  //           customLocation={customLocation}
  //           disabled={isSubmitting}
  //         />

  //         {error && (
  //           <div className="flex items-center gap-2 text-red-500 text-sm  p-3 rounded">
  //             <AlertCircle className="h-4 w-4" />
  //             <span>{error}</span>
  //           </div>
  //         )}

  //         <Button type="submit" className="w-full" disabled={!isFormValid()}>
  //           {isSubmitting ? "Creating..." : "Start Playing"}
  //         </Button>
  //       </form>
  //     </DialogContent>
  //   </Dialog>
  // );
};

export default UserRegistrationDialog;
