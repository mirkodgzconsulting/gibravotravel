"use client";
import React, { useMemo, useEffect, useState } from 'react';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useDashboardData } from '@/contexts/DashboardDataContext';

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface TotalFeeCardProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

interface TotalFeeData {
  biglietteria: number;
  toursBus: number;
  tourAereo: number;
  total: number;
}

export default function TotalFeeCard({ dateRange }: TotalFeeCardProps) {
  const dashboardData = useDashboardData();
  const [feeData, setFeeData] = useState<TotalFeeData>({ biglietteria: 0, toursBus: 0, tourAereo: 0, total: 0 });

  // Calcular fees usando datos del Context
  useEffect(() => {
    if (dashboardData.loading) return;

    const startDate = dateRange.startDate;
    const endDate = dateRange.endDate;

    const { biglietteria, tourBus, tourAereo } = dashboardData;

    // Calculate BIGLIETTERIA fees
    const biglietteriaFee = biglietteria
      .filter((record: any) => {
        const recordDate = new Date(record.data);
        return recordDate >= startDate && recordDate <= endDate;
      })
      .reduce((sum: number, record: any) => sum + (record.feeAgv || 0), 0);

    // Calculate TOUR BUS fees
    const toursBusFee = tourBus
      .filter((tour: any) => {
        const tourFechaViaje = new Date(tour.fechaViaje);
        return tourFechaViaje >= startDate && tourFechaViaje <= endDate;
      })
      .reduce((sum: number, tour: any) => {
        const spesaTotale = (tour.bus || 0) + (tour.pasti || 0) + (tour.parking || 0) +
          (tour.coordinatore1 || 0) + (tour.coordinatore2 || 0) +
          (tour.ztl || 0) + (tour.hotel || 0) + (tour.polizza || 0) + (tour.tkt || 0);
        const ricavoTotale = tour.ventasTourBus?.reduce((ventaSum: number, venta: any) => {
          return ventaSum + (venta.acconto || 0);
        }, 0) || 0;
        return sum + (ricavoTotale - spesaTotale);
      }, 0);

    // Calculate TOUR AEREO fees - SIMPLIFIED: Using feeAgv column
    const tourAereoFee = tourAereo
      .filter((tour: any) => {
        const tourFechaViaje = new Date(tour.fechaViaje);
        return tourFechaViaje >= startDate && tourFechaViaje <= endDate;
      })
      .reduce((sum: number, tour: any) => sum + (tour.feeAgv || 0), 0);

    const total = biglietteriaFee + toursBusFee + tourAereoFee;

    setFeeData({
      biglietteria: biglietteriaFee,
      toursBus: toursBusFee,
      tourAereo: tourAereoFee,
      total
    });
  }, [dateRange, dashboardData]);

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

  if (dashboardData.loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
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

  if (dashboardData.error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="text-center text-red-500">
          <p>{dashboardData.error}</p>
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
