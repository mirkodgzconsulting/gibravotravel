"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

// Interfaces para los diferentes tipos de templates
interface TourBus {
  id: string;
  titulo: string;
  descripcion: string | null;
  creator: {
    firstName: string | null;
    lastName: string | null;
  };
}

interface InfoTemplate {
  id: string;
  title: string;
  textContent: string;
  creator: {
    firstName: string | null;
    lastName: string | null;
  };
}

interface RouteTemplate {
  id: string;
  title: string;
  textContent: string;
  creator: {
    firstName: string | null;
    lastName: string | null;
  };
}

interface StopTemplate {
  id: string;
  title: string;
  textContent: string;
  creator: {
    firstName: string | null;
    lastName: string | null;
  };
}

type SearchContextType = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchPlaceholder: string;
  isSearchActive: boolean;
  searchResults: TourBus[] | InfoTemplate[] | RouteTemplate[] | StopTemplate[];
  setSearchResults: (results: TourBus[] | InfoTemplate[] | RouteTemplate[] | StopTemplate[]) => void;
  performSearch: (term: string) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<TourBus[]>([]);
  const pathname = usePathname();

  // Determinar placeholder y comportamiento según la ruta actual
  const getSearchConfig = () => {
    if (pathname.includes('/partenze-note')) {
      return {
        placeholder: "Cerca nei modelli di viaggio...",
        isActive: true,
      };
    }
    if (pathname.includes('/info')) {
      return {
        placeholder: "Cerca nelle informazioni...",
        isActive: true,
      };
    }
    if (pathname.includes('/percorsi')) {
      return {
        placeholder: "Cerca nei percorsi...",
        isActive: true,
      };
    }
    if (pathname.includes('/fermate')) {
      return {
        placeholder: "Cerca nelle fermate...",
        isActive: true,
      };
    }
    // Agregar más secciones aquí en el futuro
    return {
      placeholder: "Cerca o digita comando...",
      isActive: false,
    };
  };

  const config = getSearchConfig();
  const isSearchActive = config.isActive;

  const performSearch = useCallback(async (term: string) => {
    if (!isSearchActive || !term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      if (pathname.includes('/partenze-note')) {
        // Búsqueda en tours de bus
        const response = await fetch('/api/tour-bus');
        if (response.ok) {
          const data = await response.json();
          const filtered = data.tours.filter((tour: TourBus) =>
            tour.titulo.toLowerCase().includes(term.toLowerCase()) ||
            (tour.descripcion && tour.descripcion.toLowerCase().includes(term.toLowerCase())) ||
            `${tour.creator.firstName} ${tour.creator.lastName}`.toLowerCase().includes(term.toLowerCase())
          );
          setSearchResults(filtered);
        }
      } else if (pathname.includes('/info')) {
        // Búsqueda en plantillas de información
        const response = await fetch('/api/info');
        if (response.ok) {
          const data = await response.json();
          const filtered = data.templates.filter((template: InfoTemplate) =>
            template.title.toLowerCase().includes(term.toLowerCase()) ||
            template.textContent.toLowerCase().includes(term.toLowerCase()) ||
            `${template.creator.firstName} ${template.creator.lastName}`.toLowerCase().includes(term.toLowerCase())
          );
          setSearchResults(filtered);
        }
      } else if (pathname.includes('/percorsi')) {
        // Búsqueda en plantillas de rutas
        const response = await fetch('/api/percorsi');
        if (response.ok) {
          const data = await response.json();
          const filtered = data.templates.filter((template: RouteTemplate) =>
            template.title.toLowerCase().includes(term.toLowerCase()) ||
            template.textContent.toLowerCase().includes(term.toLowerCase()) ||
            `${template.creator.firstName} ${template.creator.lastName}`.toLowerCase().includes(term.toLowerCase())
          );
          setSearchResults(filtered);
        }
      } else if (pathname.includes('/fermate')) {
        // Búsqueda en plantillas de fermate
        const response = await fetch('/api/stop');
        if (response.ok) {
          const data = await response.json();
          const filtered = data.templates.filter((template: StopTemplate) =>
            template.title.toLowerCase().includes(term.toLowerCase()) ||
            template.textContent.toLowerCase().includes(term.toLowerCase()) ||
            `${template.creator.firstName} ${template.creator.lastName}`.toLowerCase().includes(term.toLowerCase())
          );
          setSearchResults(filtered);
        }
      }
      // Agregar más tipos de búsqueda aquí
    } catch (error) {
      console.error('Error performing search:', error);
      setSearchResults([]);
    }
  }, [isSearchActive, pathname]);

  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        performSearch(searchTerm);
      }, 300); // Debounce de 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, pathname, performSearch]);

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        searchPlaceholder: config.placeholder,
        isSearchActive,
        searchResults,
        setSearchResults,
        performSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
