"use client"

import {
  Plane,
  Map,
  Bed,
  FileText,
  Utensils,
  AlertTriangle,
  Info,
  Users,
  Camera,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useState } from 'react'

interface InfoItem {
  icon: string
  title: string
  description: string
}

interface TourInfoProps {
  items: InfoItem[]
}

export function TourInfo({ items }: TourInfoProps) {
  const [showAll, setShowAll] = useState(false)


  if (!items || items.length === 0) return null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-[#004BA5] tracking-tight mb-8">Cose da Sapere</h2>
      
      <div className="space-y-6">
        {items.slice(0, showAll ? items.length : 3).map((item, index) => {
           // Helper to get Lucide Icon component
           const IconComponent = (() => {
               switch (item.icon) {
                 case 'plane': return Plane;
                 case 'transport': return Map;
                 case 'bed': return Bed;
                 case 'doc': return FileText;
                 case 'food': return Utensils;
                 case 'important': return AlertTriangle;
                 case 'info': return Info; 
                 case 'group': return Users;
                 case 'photo': return Camera;
                 default: return Info;
               }
           })();

           return (
            <div key={index} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-600 mt-0.5">
                   <IconComponent className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div>
                   <h3 className="font-bold text-gray-900 mb-1 text-[15px]">{item.title}</h3>
                   <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
            </div>
           );
        })}
      </div>

      {items.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-6 flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          {showAll ? (
            <>
              Mostra meno <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Mostra tutto <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}
