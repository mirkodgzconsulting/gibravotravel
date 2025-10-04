"use client";
import React, { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useUserRole } from "../hooks/useUserRole";
import {
  AiIcon,
  BoxCubeIcon,
  CalenderIcon,
  CallIcon,
  CartIcon,
  ChatIcon,
  ChevronDownIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  ListIcon,
  MailIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  TaskIcon,
  UserIcon,
} from "../icons/index";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const homeItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [
      { name: "E-commerce", path: "/" },
      { name: "Analytics", path: "/analytics" },
      { name: "Marketing", path: "/marketing" },
      { name: "CRM", path: "/crm" },
      { name: "Magazzino", path: "/stocks" },
      { name: "SaaS", path: "/saas", new: true },
      { name: "Logistica", path: "/logistics", new: true },
    ],
  },
  {
    name: "Assistente AI",
    icon: <AiIcon />,
    new: true,
    subItems: [
      {
        name: "Generatore Testi",
        path: "/text-generator",
      },
      {
        name: "Generatore Immagini",
        path: "/image-generator",
      },
      {
        name: "Generatore Codice",
        path: "/code-generator",
      },
      {
        name: "Generatore Video",
        path: "/video-generator",
      },
    ],
  },
  {
    name: "E-commerce",
    icon: <CartIcon />,
    new: true,
    subItems: [
      { name: "Prodotti", path: "/products-list" },
      { name: "Aggiungi Prodotto", path: "/add-product" },
      { name: "Fatturazione", path: "/billing" },
      { name: "Fatture", path: "/invoices" },
      { name: "Fattura Singola", path: "/single-invoice" },
      { name: "Crea Fattura", path: "/create-invoice" },
      { name: "Transazioni", path: "/transactions" },
      { name: "Transazione Singola", path: "/single-transaction" },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Calendario",
    path: "/calendar",
  },
  {
    name: "Attività",
    icon: <TaskIcon />,
    subItems: [
      { name: "Lista", path: "/task-list", pro: false },
      { name: "Kanban", path: "/task-kanban", pro: false },
    ],
  },
  {
    name: "Moduli",
    icon: <ListIcon />,
    subItems: [
      { name: "Elementi Modulo", path: "/form-elements", pro: false },
      { name: "Layout Modulo", path: "/form-layout", pro: false },
    ],
  },
  {
    name: "Tabelle",
    icon: <TableIcon />,
    subItems: [
      { name: "Tabelle Base", path: "/basic-tables", pro: false },
      { name: "Tabelle Dati", path: "/data-tables", pro: false },
    ],
  },
  {
    name: "Pagine",
    icon: <PageIcon />,
    subItems: [
      { name: "Gestione File", path: "/file-manager" },
      { name: "Tabelle Prezzi", path: "/pricing-tables" },
      { name: "FAQ", path: "/faq" },
      { name: "Chiavi API", path: "/api-keys", new: true },
      { name: "Integrazioni", path: "/integrations", new: true },
      { name: "Pagina Vuota", path: "/blank" },
      { name: "Errore 404", path: "/error-404" },
      { name: "Errore 500", path: "/error-500" },
      { name: "Errore 503", path: "/error-503" },
      { name: "Prossimamente", path: "/coming-soon" },
      { name: "Manutenzione", path: "/maintenance" },
      { name: "Successo", path: "/success" },
    ],
  },
];

const modelloItems: NavItem[] = [
  {
    icon: <BoxCubeIcon />,
    name: "PARTENZE/NOTE",
    path: "/partenze-note",
  },
  {
    icon: <PageIcon />,
    name: "INFO",
    path: "/info",
  },
  {
    icon: <GridIcon />,
    name: "PERCORSI",
    path: "/percorsi",
  },
  {
    icon: <TableIcon />,
    name: "FERMATE",
    path: "/fermate",
  },
];

const gestioneItems: NavItem[] = [
  {
    icon: <GroupIcon />,
    name: "CLIENTI",
    path: "/clienti",
  },
  {
    icon: <BoxCubeIcon />,
    name: "BIGLIETTERIA",
    path: "/biglietteria",
  },
];

const utentiItems: NavItem[] = [
  {
    icon: <UserIcon />,
    name: "Crea Utenti",
    path: "/crea-utenti",
  },
  {
    icon: <TableIcon />,
    name: "Database Admin",
    path: "/database-admin",
  },
];


const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Grafici",
    subItems: [
      { name: "Grafico a Linee", path: "/line-chart", pro: false },
      { name: "Grafico a Barre", path: "/bar-chart", pro: false },
      { name: "Grafico a Torta", path: "/pie-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Elementi UI",
    subItems: [
      { name: "Avvisi", path: "/alerts" },
      { name: "Avatar", path: "/avatars" },
      { name: "Badge", path: "/badge" },
      { name: "Breadcrumb", path: "/breadcrumb" },
      { name: "Pulsanti", path: "/buttons" },
      { name: "Gruppo Pulsanti", path: "/buttons-group" },
      { name: "Card", path: "/cards" },
      { name: "Carosello", path: "/carousel" },
      { name: "Menu a Tendina", path: "/dropdowns" },
      { name: "Immagini", path: "/images" },
      { name: "Link", path: "/links" },
      { name: "Lista", path: "/list" },
      { name: "Modali", path: "/modals" },
      { name: "Notifiche", path: "/notifications" },
      { name: "Paginazione", path: "/pagination" },
      { name: "Popover", path: "/popovers" },
      { name: "Barra Progresso", path: "/progress-bar" },
      { name: "Nastri", path: "/ribbons" },
      { name: "Spinner", path: "/spinners" },
      { name: "Tab", path: "/tabs" },
      { name: "Tooltip", path: "/tooltips" },
      { name: "Video", path: "/videos" },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Autenticazione",
    subItems: [
      { name: "Accedi", path: "/signin", pro: false },
      { name: "Registrati", path: "/signup", pro: false },
      { name: "Reimposta Password", path: "/reset-password" },
      {
        name: "Verifica a Due Fattori",
        path: "/two-step-verification",
      },
    ],
  },
];

const supportItems: NavItem[] = [
  {
    icon: <ChatIcon />,
    name: "Chat",
    path: "/chat",
  },
  {
    icon: <CallIcon />,
    name: "Supporto",
    new: true,
    subItems: [
      { name: "Lista Supporto", path: "/support-tickets" },
      { name: "Risposta Supporto", path: "/support-ticket-reply" },
    ],
  },
  {
    icon: <MailIcon />,
    name: "Email",
    subItems: [
      { name: "Posta in Arrivo", path: "/inbox" },
      { name: "Dettagli", path: "/inbox-details" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { canAccessGestione, canManageUsers } = useUserRole();
  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "home" | "modello" | "gestione" | "utenti" | "support" | "others"
  ) => (
    <ul className="flex flex-col gap-1">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {nav.new && (isExpanded || isHovered || isMobileOpen) && (
                <span
                  className={`ml-auto absolute right-10 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "menu-dropdown-badge-active"
                      : "menu-dropdown-badge-inactive"
                  } menu-dropdown-badge`}
                >
                  new
                </span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-pro-active"
                                : "menu-dropdown-badge-pro-inactive"
                            } menu-dropdown-badge-pro `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "home" | "modello" | "gestione" | "utenti" | "support" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;

  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["home", "modello", "gestione", "utenti", "support", "others"].forEach((menuType) => {
      const items =
        menuType === "home"
          ? homeItems
          : menuType === "modello"
          ? modelloItems
          : menuType === "gestione"
          ? gestioneItems
          : menuType === "utenti"
          ? utentiItems
          : menuType === "support"
          ? supportItems
          : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "home" | "gestione" | "utenti" | "support" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (
    index: number,
    menuType: "home" | "modello" | "gestione" | "utenti" | "support" | "others"
  ) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed  flex flex-col xl:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-full transition-all duration-300 ease-in-out z-[999999] border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        xl:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "xl:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/Logo_gibravo.svg"
                alt="GiBravo Travel Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/Logo_gibravo.svg"
                alt="GiBravo Travel Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/Logo_gibravo.svg"
              alt="GiBravo Travel"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto  duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* HOME - Comentado para presentación */}
            {/* <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Home"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(homeItems, "home")}
            </div> */}
            {/* Sección MODELLO - Solo para ADMIN y TI */}
            {canAccessGestione && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "xl:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "MODELLO"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(modelloItems, "modello")}
              </div>
            )}
            
            {/* Sección GESTIONE - Solo para ADMIN y TI */}
            {canAccessGestione && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "xl:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "GESTIONE"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(gestioneItems, "gestione")}
              </div>
            )}
            
            {/* Sección UTENTI - Solo para TI */}
            {canManageUsers && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "xl:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "UTENTI"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(utentiItems, "utenti")}
              </div>
            )}
            {/* SUPPORTO - Comentado para presentación */}
            {/* <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Supporto"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(supportItems, "support")}
            </div> */}
            {/* ALTRI - Comentado para presentación */}
            {/* <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-5 text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "xl:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Altri"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div> */}
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
