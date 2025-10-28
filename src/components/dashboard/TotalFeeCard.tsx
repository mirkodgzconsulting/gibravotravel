"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface TotalFeeCardProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  userId?: string;
}

interface TotalFeeData {
  biglietteria: number;
  toursBus: number;
  tourAereo: number;
  total: number;
}

export default function TotalFeeCard({ dateRange, userId }: TotalFeeCardProps) {
  const [feeData, setFeeData] = useState<TotalFeeData>({ biglietteria: 0, toursBus: 0, tourAereo: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotalFeeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = dateRange.startDate;
        const endDate = dateRange.endDate;

        // Fetch BIGLIETTERIA data
        const userIdParam = userId ? `?userId=${userId}` : '';
        const biglietteriaResponse = await fetch(`/api/biglietteria${userIdParam}`);
        const biglietteriaData = await biglietteriaResponse.json();
        const biglietteriaRecords = biglietteriaData.records || [];

        // Fetch TOUR BUS data
        const tourBusResponse = await fetch(`/api/tour-bus${userIdParam}`);
        const tourBusData = await tourBusResponse.json();
        const tourBusTours = tourBusData.tours || [];

        // Fetch TOUR AEREO data
        const tourAereoResponse = await fetch(`/api/tour-aereo${userIdParam}`);
        const tourAereoData = await tourAereoResponse.json();
        const tourAereoTours = tourAereoData.tours || [];

        let biglietteriaFee = 0;
        let toursBusFee = 0;
        let tourAereoFee = 0;

        // Calculate BIGLIETTERIA fees
        const filteredBiglietteriaRecords = biglietteriaRecords.filter((record: any) => {
          const recordDate = new Date(record.data);
          return recordDate >= startDate && recordDate <= endDate;
        });

        filteredBiglietteriaRecords.forEach((record: any) => {
          biglietteriaFee += record.feeAgv || 0;
        });

        // Calculate TOUR BUS fees
        tourBusTours.forEach((tour: any) => {
          const tourFechaViaje = new Date(tour.fechaViaje);
          if (tourFechaViaje >= startDate && tourFechaViaje <= endDate) {
            toursBusFee += tour.feeAgv || 0;
          }
        });

        // Calculate TOUR AEREO fees
        tourAereoTours.forEach((tour: any) => {
          const tourFechaViaje = new Date(tour.fechaViaje);
          if (tourFechaViaje >= startDate && tourFechaViaje <= endDate) {
            tourAereoFee += tour.feeAgv || 0;
          }
        });

        const total = biglietteriaFee + toursBusFee + tourAereoFee;

        setFeeData({ 
          biglietteria: biglietteriaFee, 
          toursBus: toursBusFee, 
          tourAereo: tourAereoFee, 
          total 
        });
      } catch (error) {
        console.error('Error fetching total fee data:', error);
        setError('Error al cargar datos de fees');
      } finally {
        setLoading(false);
      }
    };

    fetchTotalFeeData();
  }, [dateRange, userId]);

  const chartOptions: ApexOptions = useMemo(() => ({
    chart: {
      type: 'donut',
      height: 200,
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#2a31d8", "#465fff", "#7592ff"], // Azul progresivo
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
    series: [feeData.biglietteria, feeData.toursBus, feeData.tourAereo],
    labels: ['BIGLIETTERIA', 'TOURS BUS', 'TOUR AEREO'],
  }), [feeData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
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
      <div className="flex items-center justify-center mb-6">
        <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xl font-bold">€</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
          TOTALE VENDITE
        </h3>
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
