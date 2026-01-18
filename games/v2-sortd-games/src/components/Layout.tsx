import { useState, useRef, useEffect, useMemo } from "react";
import { Trash2, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useClickOutside } from "../hooks/useClickOutside";
import { SunIcon, MoonIcon, GamepadIcon, ChevronDownIcon } from "lucide-react";
import { Link, useLocation, useSearchParams, useNavigate, To } from "react-router-dom";
import GamesServices from "../../v2-services/games-service";
import { configUrl, defaultConfig, asharqLogoConfig } from "../config/site";
import UserRegistrationDialog from "./UserRegistrationDialog";
// Google SSO - kept for future use, currently disabled
// import GoogleLoginButton from "./GoogleLoginButton";
import KeycloakLoginButton from "./KeycloakLoginButton";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";




import SortdLogo from "../assets/sortd.png";
import AsharqLogo from "../assets/asharq-logo.svg";
import { useUser } from "../context/UserContext";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isArticleView = searchParams.get("src") === "article";

  const { user, logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);

  //console.log(user)
  // Use the click outside hook to close the mobile menu
  const mobileMenuRef = useClickOutside<HTMLDivElement>(() => {
    setMobileMenuOpen(false);
  }, mobileMenuOpen);

  const originalGames = [
    { id: "xox", name: "XOX Grid" },
    { id: "5-letter", name: "5-Letter Guess" },
    { id: "sky-hopper", name: "Sky Hopper" },
    { id: "block-drop", name: "Block Drop Puzzle" },
    { id: "mine-hunt", name: "Mine Hunt Logic" },
  ];

  const newGames = [
    { id: "hungry-trail", name: "Hungry Trail" },
    { id: "card-pair-challenge", name: "Card Pair Challenge" },
    { id: "sudoku", name: "Sudoku" },
    { id: "tile-merge", name: "Tile Merge Puzzle" },
  ];

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return t("greetings.goodMorning");
    } else if (hour >= 12 && hour < 17) {
      return t("greetings.goodAfternoon");
    } else if (hour >= 17 && hour < 21) {
      return t("greetings.goodEvening");
    } else {
      return t("greetings.goodNight");
    }
  }

  const greet = getGreeting();


  const { logoComponent, config } = useMemo(() => {
    const currentDomain =
      typeof window !== "undefined" ? window.location.hostname : "";
    //const matchedConfig = configUrl[currentDomain] || defaultConfig;
    const matchedConfig = asharqLogoConfig;
    const logoComponent =
      theme === "dark" ? (
        <img
          src={matchedConfig.darklogo || matchedConfig.logo}
          alt={`${matchedConfig.title} Logo`}
          className="h-10"
        />
      ) : (
        <img
          src={matchedConfig.lightlogo || matchedConfig.logo}
          alt={`${matchedConfig.title} Logo`}
          className="h-10"
        />
      );

    return {
      logoComponent,
      config: matchedConfig,
    };
  }, [searchParams, theme]);

  const ProfileDropdown = ({ user }) => {

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
      try {
        // Close dropdown
        setIsOpen(false);

        // Clear local storage first
        const username = user?.username;
        logout();

        // Clear continueGames from localStorage if username exists
        if (username) {
          localStorage.removeItem(`continueGames_${username}`);
        }

        // Clear all continueGames_* keys
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('continueGames_')) {
            localStorage.removeItem(key);
          }
        });

        // Clear authToken and userDetails
        localStorage.removeItem('authToken');
        localStorage.removeItem('userDetails');

        // Redirect to backend logout endpoint (which will redirect to Keycloak and then frontend)
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';
        window.location.href = `${BACKEND_URL}/v1/auth/logout`;
      } catch (e) {
        console.log("Error during logout:", e);
        // Still attempt to logout locally even if there's an error
        setIsOpen(false);
        logout();
        // Fallback: redirect to home
        window.location.href = '/';
      }
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:opacity-80 transition-opacity group"
        >
          <span className="text-foreground font-semibold w-8 h-8 rounded-md dark:bg-gray-600 bg-gray-300 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
            {user?.username && user.username.charAt(0).toUpperCase()}
          </span>
          <ChevronDown
            size={16}
            className={`ml-1 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown Menu */}
        <div
          className={`absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-50 transition-all duration-200 origin-top-right ${isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}
        >
          <div className="py-2">
            {/* User Info */}
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">
                {user.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.city || user?.region || user?.country}
              </p>
            </div>


            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut size={16} />
              <span>{t("common.logout")}</span>
            </button>


          </div>
        </div>
      </div>
    );
  };

  const handleTrendingClick = (e: React.MouseEvent, gameId: string, closeMobile?: boolean) => {
    if (!user?.username) {
      e.preventDefault();
      if (closeMobile) setMobileMenuOpen(false);
      setPendingGameId(gameId);
      setIsRegistrationOpen(true);
      return;
    }
    // user exists; allow navigation
    if (closeMobile) setMobileMenuOpen(false);
  };

  const handleRegistrationSuccess = () => {
    if (pendingGameId) {
      navigate(`/games/${pendingGameId}`);
    }
    setIsRegistrationOpen(false);
    setPendingGameId(null);
  };

  const getLinkWithParams = (path: To): To => {
    const searchString = searchParams.toString();
    if (typeof path === 'string') return `${path}${searchString ? `?${searchString}` : ''}`;
    return { ...path, search: searchString };
  };

  return (
    <div className="min-h-screen flex flex-col">
      {!isArticleView && <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-8 py-4 flex items-center justify-between">
          <Link to={getLinkWithParams("/")} className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text ">
              {logoComponent}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <NavigationMenu className={cn(user?.username ? "" : "md:mr-10")}>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>{t("common.trendingGames")}</NavigationMenuTrigger>
                  <NavigationMenuContent className="right-0 left-auto">
                    <div className="w-[280px] p-4">
                      <div className="grid gap-2">
                        {newGames.map((game) => (
                          <NavigationMenuLink key={game.id} asChild>
                            <Link to={getLinkWithParams(`/games/${game.id}`)}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-md leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                location.pathname === `/games/${game.id}`
                                  ? "bg-muted"
                                  : ""
                              )}
                              onClick={(e) => handleTrendingClick(e, game.id)}
                            >
                              <span className="text-sm font-medium">
                                {game.name}
                              </span>
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                {t("common.new")}
                              </span>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            <LanguageSwitcher />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <SunIcon size={20} />
              ) : (
                <MoonIcon size={20} />
              )}
            </button>

            {user?.username ? (
              <ProfileDropdown user={user} />
            ) : (
              <KeycloakLoginButton variant="default" size="sm" />
            )}
          </div>
          {/* Mobile menu */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <SunIcon size={20} />
              ) : (
                <MoonIcon size={20} />
              )}
            </button>

            <div className="relative" ref={mobileMenuRef}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md hover:bg-muted transition-colors"
              >
                <GamepadIcon size={20} />
                <span className="sr-only">Menu</span>
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-background border border-border rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                        {t("common.trendingGames")}
                      </h3>
                      <div className="space-y-2">
                        {newGames.map((game) => (
                          <Link
                            key={game.id} to={getLinkWithParams(`/games/${game.id}`)}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                              location.pathname === `/games/${game.id}`
                                ? "bg-muted"
                                : ""
                            )}
                            onClick={(e) => handleTrendingClick(e, game.id, true)}
                          >
                            <span className="font-medium">{game.name}</span>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                              {t("common.new")}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* {user?.username && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center gap-3 p-2 rounded-md bg-muted">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">
                            {user.username}
                          </span>
                        </div>
                      </div>
                    )} */}
                  </div>
                </div>
              )}

            </div>
            <div>
              {user?.username ? (
                <ProfileDropdown user={user} />
              ) : (
                <KeycloakLoginButton variant="outline" size="sm" />
              )}
            </div>
          </div>
        </div>
      </header>}

      {!isArticleView && location.pathname !== "/" && (
        <div className="container mx-auto px-4 pt-2">
          <Link
            to={getLinkWithParams("/")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t("common.backToHome")}
          </Link>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <UserRegistrationDialog
        isOpen={isRegistrationOpen}
        onClose={() => {
          setIsRegistrationOpen(false);
          setPendingGameId(null);
        }}
        onSuccess={handleRegistrationSuccess}
      />

      {!isArticleView && <footer className="mt-auto py-6 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="flex justify-center items-center gap-x-2">
            © {new Date().getFullYear()} {t("footer.poweredBy")}
            <a href="https://sortd.mobi"><img src={AsharqLogo} alt="Sortd" className="h-5" /></a>
          </p>
        </div>
      </footer>}
    </div>
  );
};

export default Layout;
