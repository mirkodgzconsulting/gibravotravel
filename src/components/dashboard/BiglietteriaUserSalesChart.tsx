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

interface BiglietteriaUserSalesChartProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  userId?: string;
}

export default function BiglietteriaUserSalesChart({ dateRange, userId }: BiglietteriaUserSalesChartProps) {
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

        const userIdParam = userId ? `&userId=${userId}` : '';
        const response = await fetch(
          `/api/biglietteria?fechaDesde=${startDate.toISOString()}&fechaHasta=${endDate.toISOString()}${userIdParam}`
        );

        if (!response.ok) {
          throw new Error('Error al cargar datos');
        }

        const data = await response.json();
        const records = data.records || [];

        // Group by user and count sales
        const userSalesMap = new Map<string, { count: number; revenue: number }>();
        
        records.forEach((record: any) => {
          const userName = record.creator?.firstName 
            ? `${record.creator.firstName}${record.creator.lastName ? ` ${record.creator.lastName}` : ''}`.trim()
            : record.creator?.email || 'Usuario';
          
          if (userSalesMap.has(userName)) {
            const current = userSalesMap.get(userName)!;
            userSalesMap.set(userName, {
              count: current.count + 1,
              revenue: current.revenue + (record.totalAPagar || 0)
            });
          } else {
            userSalesMap.set(userName, {
              count: 1,
              revenue: record.totalAPagar || 0
            });
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
    colors: ["#16a34a"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: chartData.categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: undefined },
    },
    legend: { 
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    grid: {
      yaxis: { lines: { show: true } },
    },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  }), [chartData.categories]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Title skeleton */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4 animate-pulse"></div>
        {/* Chart skeleton */}
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
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
          BIGLIETTERIA
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
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
            <ReactApexChart
              options={chartOptions}
              series={chartData.series}
              type="bar"
              height={180}
            />
          </div>
        </div>
      )}
    </div>
  );
}
