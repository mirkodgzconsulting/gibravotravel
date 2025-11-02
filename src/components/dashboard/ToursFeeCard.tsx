"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ToursFeeCardProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  userId?: string;
}

interface ToursFeeData {
  toursBus: number;
  tourAereo: number;
  total: number;
}

export default function ToursFeeCard({ dateRange, userId }: ToursFeeCardProps) {
  const [feeData, setFeeData] = useState<ToursFeeData>({ toursBus: 0, tourAereo: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToursFeeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = dateRange.startDate;
        const endDate = dateRange.endDate;

        // Fetch TOUR BUS data
        const userIdParam = userId ? `?userId=${userId}` : '';
        const tourBusResponse = await fetch(`/api/tour-bus${userIdParam}`);
        const tourBusData = await tourBusResponse.json();
        const tourBusTours = tourBusData.tours || [];

        // Fetch TOUR AEREO data
        const tourAereoResponse = await fetch(`/api/tour-aereo${userIdParam}`);
        const tourAereoData = await tourAereoResponse.json();
        const tourAereoTours = tourAereoData.tours || [];

        let toursBusFee = 0;
        let tourAereoFee = 0;

        // Calculate TOUR BUS fees - EXACT same logic as FEE/AGV Statistics chart
        tourBusTours.forEach((tour: any) => {
          const tourFechaViaje = new Date(tour.fechaViaje);
          if (tourFechaViaje >= startDate && tourFechaViaje <= endDate) {
            // Calcular costos totales del tour (una sola vez por tour)
            const spesaTotale = (tour.bus || 0) + (tour.pasti || 0) + (tour.parking || 0) + 
                               (tour.coordinatore1 || 0) + (tour.coordinatore2 || 0) + 
                               (tour.ztl || 0) + (tour.hotel || 0) + (tour.polizza || 0) + (tour.tkt || 0);
            
            // Calcular ingresos totales de todas las ventas del tour
            const ricavoTotale = tour.ventasTourBus?.reduce((ventaSum: number, venta: any) => {
              return ventaSum + (venta.acconto || 0);
            }, 0) || 0;
            
            // FEE/AGV = Ingresos totales - Costos totales (por tour)
            toursBusFee += (ricavoTotale - spesaTotale);
          }
        });

        // Calculate TOUR AEREO fees
        tourAereoTours.forEach((tour: any) => {
          const tourFechaViaje = new Date(tour.fechaViaje);
          if (tourFechaViaje >= startDate && tourFechaViaje <= endDate) {
            // If userId is provided, calculate fee from user's ventas only
            if (userId && tour.ventas && tour.ventas.length > 0) {
              // Sum fees from user's filtered ventas (API already filtered them)
              const userVentasFee = tour.ventas.reduce((sum: number, venta: any) => {
                const costosTotales = (venta.transfer || 0) + (venta.hotel || 0) + 
                                      (tour.guidaLocale || 0) + (tour.coordinatore || 0) + (tour.transporte || 0);
                const fee = (venta.venduto || 0) - costosTotales;
                return sum + fee;
              }, 0);
              
              tourAereoFee += userVentasFee;
            } else {
              // For ADMIN/TI, use total tour fee
              tourAereoFee += tour.feeAgv || 0;
            }
          }
        });

        const total = toursBusFee + tourAereoFee;

        setFeeData({ toursBus: toursBusFee, tourAereo: tourAereoFee, total });
      } catch (error) {
        console.error('Error fetching tours fee data:', error);
        setError('Error al cargar datos de fees');
      } finally {
        setLoading(false);
      }
    };

    fetchToursFeeData();
  }, [dateRange, userId]);

  const chartOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: 'donut',
      height: 200,
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#2a31d8", "#465fff"], // Azul progresivo
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          background: 'transparent',
        }
      }
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    tooltip: {
      enabled: false,
    },
    stroke: {
      show: false,
    },
    series: [feeData.toursBus, feeData.tourAereo],
    labels: ['TOURS BUS', 'TOUR AEREO'],
  }), [feeData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>
        
        {/* Legend skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
        
        {/* Chart skeleton */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        </div>
        
        {/* Total skeleton */}
        <div className="flex items-center justify-center">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          VIAGGIO DI GRUPPO
        </h3>
        <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#2a31d8'}}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">BUS: {feeData.toursBus.toLocaleString()}€</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#465fff'}}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">AEREO: {feeData.tourAereo.toLocaleString()}€</span>
        </div>
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className="w-32 h-32">
          <ReactApexChart
            options={chartOptions}
            series={chartOptions.series}
            type="donut"
            height={200}
          />
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <span className="text-2xl font-bold text-gray-800 dark:text-white">
            {feeData.total.toLocaleString()}€
          </span>
        </div>
      </div>
    </div>
  );
}
