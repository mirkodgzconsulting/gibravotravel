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

interface TourBusUserSalesChartProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  userId?: string;
}

export default function TourBusUserSalesChart({ dateRange, userId }: TourBusUserSalesChartProps) {
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
        const response = await fetch(`/api/tour-bus${userIdParam}`);

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
            if (tour.ventasTourBus && tour.ventasTourBus.length > 0) {
              tour.ventasTourBus.forEach((venta: any) => {
                const userName = venta.creator?.firstName 
                  ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                  : venta.creator?.email || 'Usuario';
                
                if (userSalesMap.has(userName)) {
                  const current = userSalesMap.get(userName)!;
                  userSalesMap.set(userName, {
                    count: current.count + 1,
                    revenue: current.revenue + (venta.acconto || 0)
                  });
                } else {
                  userSalesMap.set(userName, {
                    count: 1,
                    revenue: venta.acconto || 0
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
      series: [
        {
          name: "Ventas",
          data: salesData
        }
      ]
    };
  }, [userSalesData]);

  // Chart options
  const chartOptions: ApexOptions = useMemo(() => ({
    colors: ["#ea580c"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 250,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        columnWidth: "70%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { 
      enabled: true,
      formatter: (val: number) => `${val} ventas`,
      style: {
        fontSize: '12px',
        fontWeight: 500,
        colors: ['#fff']
      },
      offsetX: 10,
    },
    stroke: {
      show: false,
    },
    xaxis: {
      categories: chartData.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    yaxis: {
      title: { text: undefined },
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    legend: { 
      show: false,
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
    },
    fill: { opacity: 1 },
    tooltip: {
      enabled: false,
    },
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
          TOUR BUS PAX
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
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[400px]">
            <ReactApexChart
              options={chartOptions}
              series={chartData.series}
              type="bar"
              height={250}
            />
          </div>
        </div>
      )}
    </div>
  );
}
