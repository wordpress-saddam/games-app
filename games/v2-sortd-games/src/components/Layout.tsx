import { useState, useRef, useEffect, useMemo } from "react";
import { LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useClickOutside } from "../hooks/useClickOutside";
import { SunIcon, MoonIcon } from "lucide-react";
import { Link, useLocation, useSearchParams, useNavigate, To } from "react-router-dom";
import { asharqLogoConfig } from "../config/site";
import UserRegistrationDialog from "./UserRegistrationDialog";
import KeycloakLoginButton from "./KeycloakLoginButton";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import AsharqLogo from "../assets/asharq-logo.svg";
import { useUser } from "../context/UserContext";


interface LayoutProps {
  children: React.ReactNode;
}

const NAV_MENUS = [
  {
    to: "/politics/",
    en: "Politics",
    ar: "سياسة",
    hidden: false,
  },
  {
    to: "/defense/",
    en: "Defense",
    ar: "دفاع",
    hidden: false,
  },
  {
    to: "/technology/",
    en: "Technology",
    ar: "تكنولوجيا",
    hidden: false,
  },
  {
    to: "/health/",
    en: "Health",
    ar: "صحة",
    hidden: false,
  },
  {
    to: "/science/",
    en: "Science",
    ar: "علوم",
    hidden: "md", // hidden on md, visible on lg
  },
  {
    to: "/art/",
    en: "Art",
    ar: "فن",
    hidden: "md",
  },
  {
    to: "/culture/",
    en: "Culture",
    ar: "ثقافة",
    hidden: "md",
  },
  {
    to: "/videos/",
    en: "Video",
    ar: "فيديو",
    hidden: "md",
  },
  {
    to: "/variety/",
    en: "Last Page",
    ar: "الصفحة الأخيرة",
    hidden: "md",
  },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
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
    { id: "xox", name: t("games.xox.name") },
    { id: "5-letter", name: t("games.fiveLetter.name") },
    { id: "sky-hopper", name: t("games.skyHopper.name") },
    { id: "block-drop", name: t("games.blockDrop.name") },
    { id: "mine-hunt", name: t("games.mineHunt.name") },
  ];

  const newGames = [
    { id: "hungry-trail", name: t("games.hungryTrail.name") },
    { id: "card-pair-challenge", name: t("games.cardPairChallenge.name") },
    { id: "sudoku", name: t("games.sudoku.name") },
    { id: "tile-merge", name: t("games.tileMerge.name") },
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
      <div className="relative z-[100]" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:opacity-80 transition-opacity group"
        >
          <span className="text-foreground font-semibold w-8 h-8 rounded-md dark:bg-gray-600 bg-gray-300 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
            {user?.username && user.username.charAt(0).toUpperCase()}
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"} ${isArabic ? 'ml-1' : 'mr-1'}`}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={`absolute top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-[9999] ${isArabic ? "left-0" : "right-0"}`}
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
        )}
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
      {!isArticleView && (
        <>
          {/* Top Dark Header */}
          <nav className="sticky top-0 z-20 w-full bg-black border-gray-300">
            <div className="w-full">
              <div className={`h-9 md:h-10 w-full flex items-center justify-start overflow-x-auto md:justify-center scrollbar-hide ${isArabic ? 'pr-3' : 'pl-3'}`}>
                {/* Navigation Links with Dotted Borders */}
                <Link 
                  to="https://now.asharq.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex-shrink-0 ${isArabic ? 'border-l pl-3 md:pl-6 lg:pl-[34px]' : 'border-r pr-3 md:pr-6 lg:pr-[34px]'} border-dotted border-white/40`}
                >
                  <span className="text-white text-xs md:text-sm font-medium whitespace-nowrap">الشرق NOW</span>
                </Link>
                <Link 
                  to="https://asharqbusiness.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex-shrink-0 ${isArabic ? 'border-l px-3 md:px-6 lg:pl-[34px]' : 'border-r px-3 md:px-6 lg:pr-[34px]'} border-dotted border-white/40`}
                >
                  <span className="text-white text-xs md:text-sm font-medium whitespace-nowrap">اقتصاد الشرق مع Bloomberg</span>
                </Link>
                <Link 
                  to="https://sports.asharq.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex-shrink-0 ${isArabic ? 'border-l px-3 md:px-6 lg:pl-[34px]' : 'border-r px-3 md:px-6 lg:pr-[34px]'} border-dotted border-white/40`}
                >
                  <span className="text-white text-xs md:text-sm font-medium whitespace-nowrap">الشرق رياضة</span>
                </Link>
                <Link 
                  to="https://asharqbusiness.com/radio/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex-shrink-0 ${isArabic ? 'px-3 md:px-6 lg:pr-[34px]' : 'px-3 md:px-6 lg:pl-[34px]'} border-dotted border-white/40`}
                >
                  <span className="text-white text-xs md:text-sm font-medium whitespace-nowrap">راديو الشرق</span>
                </Link>
              </div>
            </div>
          </nav>

          {/* Main Navigation Bar */}
          <div className="hidden md:flex border-b-2 border-t-4 md:border-t-8 lg:border-t-[8px] md:border-b-8 lg:border-b-[8px] bg-white dark:bg-gray-900 sticky top-[36px] md:top-[40px] z-10">
            <div className="container mx-auto w-full">
              <div className="flex w-full flex-col pt-1">
                <div className="flex w-full flex-row pt-1.5">
                  {/* Left: Hamburger Menu + Logo */}
                  <div className="flex flex-shrink-0 flex-row">
                    <Link to={getLinkWithParams("/")} className="mr-6 self-end pb-2 md:mr-3 md:pb-[6px] lg:mr-3">
                      {logoComponent}
                    </Link>
                  </div>

                  {/* Right Section */}
                  <div className="flex w-full flex-col">
                    {/* Main Navigation Row */}
                    <div className="mr-0 flex h-full flex-row items-end justify-end pt-[2px] md:mr-7 md:justify-start md:pt-0 lg:mr-10">
                      {/* Navigation Links */}
                      <div className="hidden w-full md:mr-4 md:flex">
                      <ul className="nav-bar-ul flex cursor-pointer flex-row">
                        {NAV_MENUS.map((item) => (
                          <li
                            key={item.to}
                            className={`relative flex cursor-pointer items-center pb-3 pt-2 mr-4 lg:mr-8 bg-transparent border-b-4 border-transparent
                              ${item.hidden === "md" ? "md:hidden lg:flex" : ""}
                            `}
                          >
                            <Link
                              to={item.to}
                              className="cursor-pointer text-sm font-bold leading-5 lg:text-base lg:leading-6 text-gray-700 dark:text-gray-300"
                            >
                              {isArabic ? item.ar : item.en}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      </div>

                      <div className="mx-auto px-4 lg:px-8 py-2">
                        <div className="flex items-center justify-end gap-4">

                          <LanguageSwitcher />

                          <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Bar */}
          <div className="flex md:hidden border-b-2 border-t-4 md:border-t-8 lg:border-t-[8px] md:border-b-8 lg:border-b-[8px] bg-white dark:bg-gray-900 sticky top-[36px] md:top-[40px] z-10">
            <div className="mx-auto w-full">
              <div className="flex w-full flex-col pt-1">
                <div className="flex w-full flex-row pt-1.5">
                  {/* Left: Hamburger Menu + Logo */}
                  <div className="flex flex-shrink-0 flex-row">
                    <div className="relative flex w-12 items-center self-end">
                      <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className={`relative mb-3 h-6 w-6 cursor-pointer md:mb-[18px] ${isArabic ? 'mr-[15px] md:mr-0' : 'ml-[15px] md:ml-0'}`}
                        aria-label="Menu"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          className="hover-menu text-black dark:text-white"
                          fill="currentColor"
                        >
                          <path d="M0 0h24v24H0z" fill="none" />
                          <path d="M1.5 3h21v3h-21V3zm0 7.5h21v3h-21v-3zm0 7.5h21v3h-21v-3z" />
                        </svg>
                      </button>
                    </div>
                    <Link to={getLinkWithParams("/")} className={`self-end pb-2 md:pb-[6px] ${isArabic ? 'mr-1 ml-2 md:mr-3 lg:mr-3' : 'ml-1 mr-2 md:ml-3 lg:ml-3 lg:mr-3'}`}>
                      {logoComponent}
                    </Link>
                  </div>

                  {/* Right Section */}
                  <div className="flex w-full flex-col">
                    {/* Main Navigation Row */}
                    <div className="mr-0 flex h-full flex-row justify-end md:mr-7 md:justify-start md:pt-0 lg:mr-10">
                      <div className="flex lg:hidden items-center gap-2">
                        <LanguageSwitcher />
                        <button
                          onClick={toggleTheme}
                          className="p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          aria-label="Toggle theme"
                        >
                          {theme === "dark" ? (
                            <SunIcon size={16} />
                          ) : (
                            <MoonIcon size={16} />
                          )}
                        </button>
                        {user?.username ? (
                          <ProfileDropdown user={user} />
                        ) : (
                          <KeycloakLoginButton variant="outline" size="sm" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
              <div 
                className="absolute right-0 top-0 h-full w-64 bg-background border-l border-border shadow-lg overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                ref={mobileMenuRef}
              >
                <div className="p-4">
                  <div className="mb-4">
                      <ul className="nav-bar-ul flex cursor-pointer flex-col">
                        {NAV_MENUS.map((item) => (
                          <li
                            key={item.to}
                            className={`relative flex cursor-pointer items-center pb-3 pt-2 mr-4 lg:mr-8 bg-transparent border-b-4 border-transparent
                              ${item.hidden === "md" ? "md:hidden lg:flex" : ""}
                            `}
                          >
                            <Link
                              to={item.to}
                              className="cursor-pointer text-sm font-bold leading-5 lg:text-base lg:leading-6 text-gray-700 dark:text-gray-300"
                            >
                              {isArabic ? item.ar : item.en}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    {/* <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                      {t("common.trendingGames")}
                    </h3> */}
                    
                    {/* <div className="space-y-2">
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
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* {!isArticleView && location.pathname !== "/" && (
        <div className="container mx-auto px-4 pt-2">
          <Link
            to="/" 
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
      )} */}

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
            <a href="https://gameshub.asharq.site/"><img src={AsharqLogo} alt="Sortd" className="h-5" /></a>
          </p>
        </div>
      </footer>}
    </div>
  );
};

export default Layout;
