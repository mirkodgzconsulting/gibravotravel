"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type SearchContextType = {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchPlaceholder: string;
  isSearchActive: boolean;
  searchResults: TravelNoteTemplate[];
  setSearchResults: (results: TravelNoteTemplate[]) => void;
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

interface TravelNoteTemplate {
  id: string;
  title: string;
  textContent: string;
  coverImage: string | null;
  coverImageName: string | null;
  pdfFile: string | null;
  pdfFileName: string | null;
  tourDate: string;
  travelCost: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<TravelNoteTemplate[]>([]);
  const pathname = usePathname();

  // Determinar placeholder y comportamiento según la ruta actual
  const getSearchConfig = () => {
    if (pathname.includes('/partenze-note')) {
      return {
        placeholder: "Cerca nei modelli di viaggio...",
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

  const performSearch = async (term: string) => {
    if (!isSearchActive || !term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      if (pathname.includes('/partenze-note')) {
        // Búsqueda en plantillas de viaje
        const response = await fetch('/api/travel-templates');
        if (response.ok) {
          const data = await response.json();
          const filtered = data.templates.filter((template: TravelNoteTemplate) =>
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
  };

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
