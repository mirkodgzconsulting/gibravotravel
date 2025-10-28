"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface AgentSalesPercentageChartProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  userId?: string;
}

interface AgentFeeData {
  agentName: string;
  feeAmount: number;
  percentage: number;
}

export default function AgentSalesPercentageChart({ dateRange, userId }: AgentSalesPercentageChartProps) {
  const [agentData, setAgentData] = useState<AgentFeeData[]>([]);
  const [totalFee, setTotalFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgentFeeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the provided date range
        const startDate = dateRange.startDate;
        const endDate = dateRange.endDate;

        // Fetch all data sources
        const userIdParam = userId ? `?userId=${userId}` : '';
        const [biglietteriaResponse, tourAereoResponse] = await Promise.all([
          fetch(`/api/biglietteria${userIdParam}`),
          fetch(`/api/tour-aereo${userIdParam}`)
        ]);

        const [biglietteriaData, tourAereoData] = await Promise.all([
          biglietteriaResponse.json(),
          tourAereoResponse.json()
        ]);

        // Group by agent and sum fees
        const agentFeeMap = new Map<string, number>();

        // Process BIGLIETTERIA data
        const biglietteriaRecords = biglietteriaData.records || [];
        const filteredBiglietteriaRecords = biglietteriaRecords.filter((record: any) => {
          const recordDate = new Date(record.data);
          return recordDate >= startDate && recordDate <= endDate;
        });

        filteredBiglietteriaRecords.forEach((record: any) => {
          const agentName = record.creator?.firstName 
            ? `${record.creator.firstName}${record.creator.lastName ? ` ${record.creator.lastName}` : ''}`.trim()
            : record.creator?.email || 'Usuario';
          
          const feeAmount = record.feeAgv || 0;
          
          if (agentFeeMap.has(agentName)) {
            agentFeeMap.set(agentName, agentFeeMap.get(agentName)! + feeAmount);
          } else {
            agentFeeMap.set(agentName, feeAmount);
          }
        });

        // Process TOUR AEREO data
        const tourAereoTours = tourAereoData.tours || [];
        const filteredTourAereoTours = tourAereoTours.filter((tour: any) => {
          const tourFechaViaje = new Date(tour.fechaViaje);
          return tourFechaViaje >= startDate && tourFechaViaje <= endDate;
        });

        filteredTourAereoTours.forEach((tour: any) => {
          const tourFee = tour.feeAgv || 0;
          if (tourFee > 0) {
            // For tours, we need to attribute the fee to the agents who made sales
            if (tour.ventas && tour.ventas.length > 0) {
              const feePerSale = tourFee / tour.ventas.length;
              tour.ventas.forEach((venta: any) => {
                const agentName = venta.creator?.firstName 
                  ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                  : venta.creator?.email || 'Usuario';
                
                if (agentFeeMap.has(agentName)) {
                  agentFeeMap.set(agentName, agentFeeMap.get(agentName)! + feePerSale);
                } else {
                  agentFeeMap.set(agentName, feePerSale);
                }
              });
            }
          }
        });

        // Calculate total and percentages
        const total = Array.from(agentFeeMap.values()).reduce((sum, val) => sum + val, 0);
        setTotalFee(total);

        const agentFeesArray: AgentFeeData[] = Array.from(agentFeeMap.entries())
          .map(([agentName, feeAmount]) => ({
            agentName,
            feeAmount,
            percentage: total > 0 ? (feeAmount / total) * 100 : 0
          }))
          .sort((a, b) => b.feeAmount - a.feeAmount)
          .slice(0, 10); // Top 10 agents

        setAgentData(agentFeesArray);
      } catch (error) {
        console.error('Error fetching agent fee data:', error);
        setError('Error al cargar datos de porcentaje de ventas');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentFeeData();
  }, [dateRange, userId]);

  const chartOptions: ApexOptions = useMemo(() => ({
    colors: ["#2a31d8", "#465fff", "#7592ff", "#c2d6ff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: agentData.length * 45,
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
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: '12px',
        fontWeight: 500,
        colors: ['#fff']
      },
      offsetX: 10,
    },
    xaxis: {
      categories: agentData.map(agent => agent.agentName),
      axisBorder: { show: false },
      axisTicks: { show: false },
      max: 100,
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
    fill: { 
      opacity: 1,
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#465fff', '#7592ff', '#c2d6ff', '#e0e7ff'],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.8,
      }
    },
    tooltip: {
      enabled: true,
      style: {
        fontFamily: "Outfit",
      },
      custom: function({series, seriesIndex, dataPointIndex, w}) {
        const value = series[seriesIndex][dataPointIndex];
        const agentName = w.globals.labels[dataPointIndex];
        const feeAmount = agentData[dataPointIndex]?.feeAmount || 0;
        
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
              ${value.toFixed(2)}%
            </div>
            <div style="color: #6b7280; font-size: 14px;">
              ${feeAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
            </div>
          </div>
        `;
      }
    },
  }), [agentData, totalFee]);

  const series = useMemo(() => {
    return [
      {
        name: "Porcentaje",
        data: agentData.map(agent => agent.percentage)
      }
    ];
  }, [agentData]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Porcentaje de Ventas por Agente
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Basado en FEE/AGV total (BIGLIETTERIA + TOUR AÉREO)
        </p>
      </div>

      {agentData.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No hay datos disponibles para este período</p>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          {/* Total Fee Display */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total FEE/AGV del Período
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {totalFee.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
            </p>
          </div>

          {/* Chart */}
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[400px]">
              <ReactApexChart
                options={chartOptions}
                series={series}
                type="bar"
                height={agentData.length * 45 + 50}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
