"use client";
import React, { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useUserRole } from "../hooks/useUserRole";
import {
  AiIcon,
  ArrowUpIcon,
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
  TruckDelivery,
  UserIcon,
  PaperPlaneIcon,
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
      // { name: "E-commerce", path: "/" },
      // { name: "Analytics", path: "/analytics" },
      // { name: "Marketing", path: "/marketing" },
      // { name: "CRM", path: "/crm" },
      // { name: "Magazzino", path: "/stocks" },
      // { name: "SaaS", path: "/saas", new: true },
      // { name: "Logistica", path: "/logistics", new: true },
      { name: "Dashboard Viajes", path: "/dashboard-viajes" },
    ],
  },
  // {
  //   name: "Assistente AI",
  //   icon: <AiIcon />,
  //   new: true,
  //   subItems: [
  //     {
  //       name: "Generatore Testi",
  //       path: "/text-generator",
  //     },
  //     {
  //       name: "Generatore Immagini",
  //       path: "/image-generator",
  //     },
  //     {
  //       name: "Generatore Codice",
  //       path: "/code-generator",
  //     },
  //     {
  //       name: "Generatore Video",
  //       path: "/video-generator",
  //     },
  //   ],
  // },
  // {
  //   name: "E-commerce",
  //   icon: <CartIcon />,
  //   new: true,
  //   subItems: [
  //     { name: "Prodotti", path: "/products-list" },
  //     { name: "Aggiungi Prodotto", path: "/add-product" },
  //     { name: "Fatturazione", path: "/billing" },
  //     { name: "Fatture", path: "/invoices" },
  //     { name: "Fattura Singola", path: "/single-invoice" },
  //     { name: "Crea Fattura", path: "/create-invoice" },
  //     { name: "Transazioni", path: "/transactions" },
  //     { name: "Transazione Singola", path: "/single-transaction" },
  //   ],
  // },
  // {
  //   icon: <CalenderIcon />,
  //   name: "Calendario",
  //   path: "/calendar",
  // },
  // {
  //   name: "Attività",
  //   icon: <TaskIcon />,
  //   subItems: [
  //     { name: "Lista", path: "/task-list", pro: false },
  //     { name: "Kanban", path: "/task-kanban", pro: false },
  //   ],
  // },
  // {
  //   name: "Moduli",
  //   icon: <ListIcon />,
  //   subItems: [
  //     { name: "Elementi Modulo", path: "/form-elements", pro: false },
  //     { name: "Layout Modulo", path: "/form-layout", pro: false },
  //   ],
  // },
  // {
  //   name: "Tabelle",
  //   icon: <TableIcon />,
  //   subItems: [
  //     { name: "Tabelle Base", path: "/basic-tables", pro: false },
  //     { name: "Tabelle Dati", path: "/data-tables", pro: false },
  //   ],
  // },
  // {
  //   name: "Pagine",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Gestione File", path: "/file-manager" },
  //     { name: "Tabelle Prezzi", path: "/pricing-tables" },
  //     { name: "FAQ", path: "/faq" },
  //     { name: "Chiavi API", path: "/api-keys", new: true },
  //     { name: "Integrazioni", path: "/integrations", new: true },
  //     { name: "Pagina Vuota", path: "/blank" },
  //     { name: "Errore 404", path: "/error-404" },
  //     { name: "Errore 500", path: "/error-500" },
  //     { name: "Errore 503", path: "/error-503" },
  //     { name: "Prossimamente", path: "/coming-soon" },
  //     { name: "Manutenzione", path: "/maintenance" },
  //     { name: "Successo", path: "/success" },
  //   ],
  // },
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
  {
    icon: <CalenderIcon />,
    name: "CALENDARIO",
    path: "/calendario",
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
  {
    icon: <PaperPlaneIcon />,
    name: "TOUR AEREO",
    path: "/tour-aereo",
  },
  {
    icon: <TruckDelivery />,
    name: "TOURS BUS",
    path: "/tour-bus",
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
    name: "Pagamento",
    path: "/pagamento",
  },
  {
    icon: <TableIcon />,
    name: "IATA",
    path: "/iata",
  },
  {
    icon: <TableIcon />,
    name: "Metodo di Pagamento",
    path: "/metodo-pagamento",
  },
  {
    icon: <TableIcon />,
    name: "Servizio",
    path: "/servizio",
  },
  {
    icon: <TableIcon />,
    name: "Database Admin",
    path: "/database-admin",
  },
];



const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const { canAccessGestione, canManageUsers, canAccessUtenti } = useUserRole();
  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "home" | "modello" | "gestione" | "utenti"
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
              {/* Siempre mostrar texto */}
              <span className={`menu-item-text`}>{nav.name}</span>
              {nav.new && (
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
              <ChevronDownIcon
                className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                  openSubmenu?.type === menuType &&
                  openSubmenu?.index === index
                    ? "rotate-180 text-brand-500"
                    : ""
                }`}
              />
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                {/* Siempre mostrar texto */}
                <span className={`menu-item-text`}>{nav.name}</span>
              </Link>
            )
          )}
          {nav.subItems && (
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
    type: "home" | "modello" | "gestione" | "utenti";
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
    ["home", "modello", "gestione", "utenti"].forEach((menuType) => {
      const items =
        menuType === "home"
          ? homeItems
          : menuType === "modello"
          ? modelloItems
          : menuType === "gestione"
          ? gestioneItems
          : utentiItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "home" | "modello" | "gestione" | "utenti",
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
    menuType: "home" | "modello" | "gestione" | "utenti"
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
    <>
      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[999996] xl:hidden"
          onClick={toggleMobileSidebar}
        />
      )}
      
      <aside
        className={`fixed flex flex-col xl:mt-0 top-0 px-2 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-full z-[999997] border-r border-gray-200 w-[250px] xl:w-[200px] transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
        }`}
      >
      <div className="py-8 flex justify-start">
        <Link href="/">
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
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto  duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* HOME - Solo para ADMIN y TI */}
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
                    "Home"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(homeItems, "home")}
              </div>
            )}
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
            
            {/* Sección UTENTI - Para ADMIN, TI y USER (pero solo TI puede gestionar) */}
            {canAccessUtenti && (
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
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
    </>
  );
};

export default AppSidebar;
