"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface AgentRankingChartProps {
  selectedYear: number;
}

interface AgentData {
  agentName: string;
  monthlyData: number[];
}

export default function AgentRankingChart({ selectedYear }: AgentRankingChartProps) {
  const [agentData, setAgentData] = useState<AgentData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgentRankingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Process all 12 months of the year
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData: { [month: string]: Array<{ agentName: string; biglietteria: number; tourAereo: number; tourBus: number; total: number }> } = {};

        // Fetch all data sources
        const [biglietteriaResponse, tourAereoResponse, tourBusResponse] = await Promise.all([
          fetch('/api/biglietteria'),
          fetch('/api/tour-aereo'),
          fetch('/api/tour-bus')
        ]);

        const [biglietteriaData, tourAereoData, tourBusData] = await Promise.all([
          biglietteriaResponse.json(),
          tourAereoResponse.json(),
          tourBusResponse.json()
        ]);

        // Process data for each month
        for (let month = 0; month < 12; month++) {
          const startDate = new Date(selectedYear, month, 1);
          const endDate = new Date(selectedYear, month + 1, 0, 23, 59, 59);
          const monthName = monthNames[month];

          // Group by agent for this month
          const agentMap = new Map<string, { biglietteria: number; tourAereo: number; tourBus: number }>();

          // Process BIGLIETTERIA data for this month
          const biglietteriaRecords = biglietteriaData.records || [];
          const filteredBiglietteriaRecords = biglietteriaRecords.filter((record: any) => {
            const recordDate = new Date(record.data);
            return recordDate >= startDate && recordDate <= endDate;
          });

          filteredBiglietteriaRecords.forEach((record: any) => {
            const agentName = record.creator?.firstName 
              ? `${record.creator.firstName}${record.creator.lastName ? ` ${record.creator.lastName}` : ''}`.trim()
              : record.creator?.email || 'Usuario';
            
            if (agentMap.has(agentName)) {
              const current = agentMap.get(agentName)!;
              agentMap.set(agentName, {
                ...current,
                biglietteria: current.biglietteria + 1
              });
            } else {
              agentMap.set(agentName, {
                biglietteria: 1,
                tourAereo: 0,
                tourBus: 0
              });
            }
          });

          // Process TOUR AEREO data for this month
          const tourAereoTours = tourAereoData.tours || [];
          const filteredTourAereoTours = tourAereoTours.filter((tour: any) => {
            const tourFechaViaje = new Date(tour.fechaViaje);
            return tourFechaViaje >= startDate && tourFechaViaje <= endDate;
          });

          filteredTourAereoTours.forEach((tour: any) => {
            if (tour.ventas && tour.ventas.length > 0) {
              tour.ventas.forEach((venta: any) => {
                const agentName = venta.creator?.firstName 
                  ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                  : venta.creator?.email || 'Usuario';
                
                if (agentMap.has(agentName)) {
                  const current = agentMap.get(agentName)!;
                  agentMap.set(agentName, {
                    ...current,
                    tourAereo: current.tourAereo + 1
                  });
                } else {
                  agentMap.set(agentName, {
                    biglietteria: 0,
                    tourAereo: 1,
                    tourBus: 0
                  });
                }
              });
            }
          });

          // Process TOUR BUS data for this month
          const tourBusTours = tourBusData.tours || [];
          const filteredTourBusTours = tourBusTours.filter((tour: any) => {
            const tourFechaViaje = new Date(tour.fechaViaje);
            return tourFechaViaje >= startDate && tourFechaViaje <= endDate;
          });

          filteredTourBusTours.forEach((tour: any) => {
            if (tour.ventasTourBus && tour.ventasTourBus.length > 0) {
              tour.ventasTourBus.forEach((venta: any) => {
                const agentName = venta.creator?.firstName 
                  ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                  : venta.creator?.email || 'Usuario';
                
                if (agentMap.has(agentName)) {
                  const current = agentMap.get(agentName)!;
                  agentMap.set(agentName, {
                    ...current,
                    tourBus: current.tourBus + 1
                  });
                } else {
                  agentMap.set(agentName, {
                    biglietteria: 0,
                    tourAereo: 0,
                    tourBus: 1
                  });
                }
              });
            }
          });

          // Convert to array and calculate totals for this month
          const agentArray = Array.from(agentMap.entries()).map(([agentName, data]) => ({
            agentName,
            biglietteria: data.biglietteria,
            tourAereo: data.tourAereo,
            tourBus: data.tourBus,
            total: data.biglietteria + data.tourAereo + data.tourBus
          }));

          // Sort by total descending for this month
          agentArray.sort((a, b) => b.total - a.total);
          monthlyData[monthName] = agentArray;
        }

        // Set categories for xaxis
        setCategories(monthNames);

        // Get all unique agents across all months
        const allAgents = new Set<string>();
        Object.values(monthlyData).forEach(monthData => {
          monthData.forEach(agent => allAgents.add(agent.agentName));
        });

        // Create final data structure for chart
        const chartData: AgentData[] = Array.from(allAgents).map(agentName => {
          const monthlyTotals = monthNames.map(monthName => {
            const monthData = monthlyData[monthName];
            const agentData = monthData?.find(agent => agent.agentName === agentName);
            return agentData?.total || 0;
          });

          return {
            agentName,
            monthlyData: monthlyTotals
          };
        });

        // Sort by total descending (sum of all months)
        chartData.sort((a, b) => {
          const totalA = a.monthlyData.reduce((sum, val) => sum + val, 0);
          const totalB = b.monthlyData.reduce((sum, val) => sum + val, 0);
          return totalB - totalA;
        });
        setAgentData(chartData);
      } catch (error) {
        console.error('Error fetching agent ranking data:', error);
        setError('Error al cargar datos de ranking de agentes');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentRankingData();
  }, [selectedYear]);

  const chartOptions: ApexOptions = useMemo(() => ({
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      fontSize: "12px",
      markers: {
        size: 12,
        strokeWidth: 0,
      },
    },
    colors: ["#2a31d8", "#465fff", "#7592ff", "#c2d6ff", "#e0e7ff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 220,
      type: "area",
      toolbar: {
        show: false,
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 220,
          },
        },
      },
      {
        breakpoint: 1600,
        options: {
          chart: {
            height: 220,
          },
        },
      },
      {
        breakpoint: 2600,
        options: {
          chart: {
            height: 250,
          },
        },
      },
    ],
    stroke: {
      curve: "straight",
      width: [2, 2, 2, 2, 2],
    },
    markers: {
      size: 0,
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      style: {
        fontFamily: "Outfit",
      },
      custom: function({series, seriesIndex, dataPointIndex, w}) {
        const agentName = w.globals.seriesNames[seriesIndex];
        const value = series[seriesIndex][dataPointIndex];
        const monthName = w.globals.labels[dataPointIndex];
        
        return `
          <div style="
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            font-family: 'Outfit', sans-serif;
            min-width: 200px;
          ">
            <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">
              ${agentName}
            </div>
            <div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">
              ${monthName}: ${value} ventas
            </div>
          </div>
        `;
      }
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
  }), [categories]);

  const series = useMemo(() => {
    return agentData.map(agent => ({
      name: agent.agentName,
      data: agent.monthlyData
    }));
  }, [agentData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Ranking Agente
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Comparación de ventas por agente
          </p>
        </div>
      </div>

      {agentData.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No hay datos de ventas para este año</p>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
            <ReactApexChart
              options={chartOptions}
              series={series}
              type="area"
              height={220}
            />
          </div>
        </div>
      )}
    </div>
  );
}

