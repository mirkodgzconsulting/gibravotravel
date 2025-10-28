"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface UserSalesData {
  userName: string;
  salesCount: number;
  totalRevenue: number;
}

interface TourAereoUserSalesChartProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  userId?: string;
}

export default function TourAereoUserSalesChart({ dateRange, userId }: TourAereoUserSalesChartProps) {
  const [userSalesData, setUserSalesData] = useState<UserSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data when month/year changes
  useEffect(() => {
    const fetchUserSalesData = async () => {
      try {
        setLoading(true);
        setError(null);

        const startDate = dateRange.startDate;
        const endDate = dateRange.endDate;

        const userIdParam = userId ? `?userId=${userId}` : '';
        const response = await fetch(`/api/tour-aereo${userIdParam}`);

        if (!response.ok) {
          throw new Error('Error al cargar datos');
        }

        const data = await response.json();
        const tours = data.tours || [];


        // Group by user and count sales
        const userSalesMap = new Map<string, { count: number; revenue: number }>();
        
        tours.forEach((tour: any) => {
          // Filtrar tours por fecha de viaje
          const tourFechaViaje = new Date(tour.fechaViaje);
          
          if (tourFechaViaje >= startDate && tourFechaViaje <= endDate) {
            if (tour.ventas && tour.ventas.length > 0) {
              tour.ventas.forEach((venta: any) => {
                const userName = venta.creator?.firstName 
                  ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                  : venta.creator?.email || 'Usuario';
                
                if (userSalesMap.has(userName)) {
                  const current = userSalesMap.get(userName)!;
                  userSalesMap.set(userName, {
                    count: current.count + 1,
                    revenue: current.revenue + (venta.venduto || 0)
                  });
                } else {
                  userSalesMap.set(userName, {
                    count: 1,
                    revenue: venta.venduto || 0
                  });
                }
              });
            }
          }
        });

        const userSalesArray: UserSalesData[] = Array.from(userSalesMap.entries()).map(([userName, data]) => ({
          userName,
          salesCount: data.count,
          totalRevenue: data.revenue
        }));

        // Sort by sales count descending
        userSalesArray.sort((a, b) => b.salesCount - a.salesCount);


        setUserSalesData(userSalesArray);
      } catch (error) {
        console.error('Error fetching user sales data:', error);
        setError('Error al cargar datos de ventas por usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUserSalesData();
  }, [dateRange, userId]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const categories = userSalesData.map(user => user.userName);
    const salesData = userSalesData.map(user => user.salesCount);
    
    
    return {
      categories,
      series: salesData // Para donut chart, necesitamos un array directo
    };
  }, [userSalesData]);

  // Chart options
  const chartOptions: ApexOptions = useMemo(() => ({
    colors: ["#3B82F6"],
    labels: chartData.categories,
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      width: 445,
      height: 250,
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          background: "transparent",
          labels: {
            show: false,
          },
        },
      },
    },
    states: {
      hover: {
        filter: {
          type: "none",
        },
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: "darken",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontFamily: 'Outfit, sans-serif',
      },
      fillSeriesColor: false,
      theme: 'light',
      y: {
        formatter: (val: number) => `${val} ventas`,
      },
    },
    stroke: {
      show: false,
      width: 4,
    },
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontFamily: "Outfit",
      fontSize: "14px",
      fontWeight: 400,
      markers: {
        size: 4,
        shape: "circle",
        strokeWidth: 0,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 0,
      },
      labels: {
        useSeriesColors: true,
      },
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 370,
            height: 250,
          },
        },
      },
    ],
  }), [chartData.categories]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-1">
          TOUR AEREO
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ventas por usuario
        </p>
      </div>

      {userSalesData.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No hay datos de ventas para este mes</p>
        </div>
      ) : (
        <div className="flex justify-center mx-auto" id="chartDarkStyle">
          <ReactApexChart
            options={chartOptions}
            series={chartData.series}
            type="donut"
            height={250}
          />
        </div>
      )}
    </div>
  );
}
