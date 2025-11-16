"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useUser } from '@clerk/nextjs';
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { DashboardDataProvider, useDashboardData } from '@/contexts/DashboardDataContext';
import BiglietteriaUserSalesChart from '@/components/dashboard/BiglietteriaUserSalesChart';
import TourAereoUserSalesChart from '@/components/dashboard/TourAereoUserSalesChart';
import TourBusUserSalesChart from '@/components/dashboard/TourBusUserSalesChart';
import ToursFeeCard from '@/components/dashboard/ToursFeeCard';
import BiglietteriaFeeCard from '@/components/dashboard/BiglietteriaFeeCard';
import TotalFeeCard from '@/components/dashboard/TotalFeeCard';
import AgentRankingChart from '@/components/dashboard/AgentRankingChart';
import AgentSalesPercentageChart from '@/components/dashboard/AgentSalesPercentageChart';

// Dynamically import the ReactApexChart component
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// Interfaces
interface MonthlyFeeData {
  month: string;
  biglietteria: number;
  toursBus: number;
  toursAereo: number;
  total: number;
}

interface ChartSeries {
  name: string;
  data: number[];
}

interface ChartData {
  categories: string[];
  series: ChartSeries[];
}

// Constantes
const CHART_COLORS = {
  BIGLIETTERIA: "#16a34a",
  TOURS_BUS: "#ea580c", 
  TOUR_AEREO: "#3B82F6",
  TOTAL: "#6B7280"
} as const;

const CHART_CONFIG = {
  HEIGHT: 320,
  COLUMN_WIDTH: "39%",
  BORDER_RADIUS: 5
} as const;

function DashboardViajesContent() {
  const { userRole, isLoading: roleLoading, isUser, isAdmin, isTI } = useUserRole();
  const dashboardData = useDashboardData();
  const [monthlyData, setMonthlyData] = useState<MonthlyFeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date range filters for first 6 charts + percentage chart
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const startOfCurrentYear = new Date(currentYear, 0, 1).toISOString().split('T')[0];
  const endOfToday = new Date().toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState<string>(startOfCurrentYear);
  const [endDate, setEndDate] = useState<string>(endOfToday);
  
  // Month/Year filters for other charts
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [showTable, setShowTable] = useState(false);

  // Convert date strings to Date objects for easy passing to components
  const dateRange = useMemo(() => ({
    startDate: new Date(startDate),
    endDate: new Date(endDate + 'T23:59:59')
  }), [startDate, endDate]);

  // Memoized year options
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 4 }, (_, i) => currentYear - i);
  }, []);

  // Memoized month options
  const monthOptions = useMemo(() => {
    return [
      { value: 0, label: 'Enero' },
      { value: 1, label: 'Febrero' },
      { value: 2, label: 'Marzo' },
      { value: 3, label: 'Abril' },
      { value: 4, label: 'Mayo' },
      { value: 5, label: 'Junio' },
      { value: 6, label: 'Julio' },
      { value: 7, label: 'Agosto' },
      { value: 8, label: 'Septiembre' },
      { value: 9, label: 'Octubre' },
      { value: 10, label: 'Noviembre' },
      { value: 11, label: 'Diciembre' }
    ];
  }, []);

  // Memoized chart data
  const chartData = useMemo((): ChartData => {
    const categories = monthlyData.map(data => data.month);
    const biglietteriaData = monthlyData.map(data => data.biglietteria);
    const toursBusData = monthlyData.map(data => data.toursBus);
    const toursAereoData = monthlyData.map(data => data.toursAereo);

    return {
      categories,
      series: [
        { name: "BIGLIETTERIA", data: biglietteriaData },
        { name: "TOURS BUS", data: toursBusData },
        { name: "TOUR AEREO", data: toursAereoData }
      ]
    };
  }, [monthlyData]);

  // Memoized totals
  const totals = useMemo(() => {
    const totalBiglietteria = monthlyData.reduce((sum, data) => sum + data.biglietteria, 0);
    const totalToursBus = monthlyData.reduce((sum, data) => sum + data.toursBus, 0);
    const totalToursAereo = monthlyData.reduce((sum, data) => sum + data.toursAereo, 0);
    const grandTotal = totalBiglietteria + totalToursBus + totalToursAereo;

    return {
      totalBiglietteria,
      totalToursBus,
      totalToursAereo,
      grandTotal
    };
  }, [monthlyData]);

  // OPTIMIZADO: Usar datos del Context en lugar de hacer 36 consultas
  const fetchMonthlyFeeData = useCallback(() => {
    if (dashboardData.loading) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Usar datos del Context (ya cargados una sola vez)
      const { biglietteria, tourBus, tourAereo } = dashboardData;

      // Calcular fees por mes filtrando en el frontend
      const monthlyStats: MonthlyFeeData[] = Array.from({ length: 12 }, (_, month) => {
        const startDate = new Date(selectedYear, month, 1);
        const endDate = new Date(selectedYear, month + 1, 0, 23, 59, 59);
        const monthName = startDate.toLocaleDateString('es-ES', { month: 'short' });

        // Filtrar biglietteria por mes
        const biglietteriaFee = biglietteria
          .filter((record: any) => {
            const recordDate = new Date(record.data);
            return recordDate >= startDate && recordDate <= endDate;
          })
          .reduce((sum: number, record: any) => sum + (record.feeAgv || 0), 0);

        // Filtrar tours bus por mes
        const toursBusFee = tourBus
          .filter((tour: any) => {
            const tourDate = new Date(tour.fechaViaje);
            return tourDate >= startDate && tourDate <= endDate;
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

        // Filtrar tours aereo por mes
        const toursAereoFee = tourAereo
          .filter((tour: any) => {
            const tourDate = new Date(tour.fechaViaje);
            return tourDate >= startDate && tourDate <= endDate;
          })
          .reduce((sum: number, tour: any) => {
            if (tour.ventas?.length > 0) {
              return sum + tour.ventas.reduce((ventaSum: number, venta: any) => {
                const costosTotales = (venta.transfer || 0) + (tour.guidaLocale || 0) + 
                                    (tour.coordinatore || 0) + (tour.transporte || 0) + (venta.hotel || 0);
                const fee = (venta.venduto || 0) - costosTotales;
                return ventaSum + fee;
              }, 0);
            }
            return sum;
          }, 0);

        const total = biglietteriaFee + toursBusFee + toursAereoFee;

        return {
          month: monthName,
          biglietteria: biglietteriaFee,
          toursBus: toursBusFee,
          toursAereo: toursAereoFee,
          total
        };
      });

      setMonthlyData(monthlyStats);
      setLoading(false);
    } catch (error) {
      console.error('Error calculating monthly fee data:', error);
      setError('Error al calcular los datos de FEE/AGV');
      setLoading(false);
    }
  }, [selectedYear, dashboardData]);

  // Effect to recalculate data when year changes or dashboard data loads
  useEffect(() => {
    if (!dashboardData.loading) {
      fetchMonthlyFeeData();
    }
  }, [fetchMonthlyFeeData, dashboardData.loading]);

  // Memoized chart options
  const chartOptions: ApexOptions = useMemo(() => ({
    colors: [CHART_COLORS.BIGLIETTERIA, CHART_COLORS.TOURS_BUS, CHART_COLORS.TOUR_AEREO],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: CHART_CONFIG.HEIGHT,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: CHART_CONFIG.COLUMN_WIDTH,
        borderRadius: CHART_CONFIG.BORDER_RADIUS,
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
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: { title: { text: undefined } },
    grid: {
      yaxis: { lines: { show: true } },
    },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: {
        formatter: (val: number) => `€${val.toLocaleString('es-ES', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`,
      },
    },
  }), [chartData.categories]);

  // Control de acceso
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // Verificar acceso - solo TI y ADMIN pueden ver datos globales
  if (!isTI && !isAdmin && !isUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 dark:text-gray-400">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  // Para usuarios USER, no bloquear la UI si el ID aún no está listo; seguimos renderizando
  // Carga progresiva: Cada componente muestra su propio skeleton, no bloqueamos toda la UI

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Filtro de Rango de Fechas para los primeros 6 gráficos */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Filtro de Período (Primeros 6 Gráficos)
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Desde:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Hasta:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de FEE/AGV - PRIMERA FILA */}
        <div className="mb-8">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-3">
              Resumen FEE/AGV por Período
            </h3>
          </div>

          {/* Grid de tres tarjetas en una fila */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ToursFeeCard 
              dateRange={dateRange}
            />
            <BiglietteriaFeeCard 
              dateRange={dateRange}
            />
            <TotalFeeCard 
              dateRange={dateRange}
            />
          </div>
        </div>

        {/* Gráficos de Ventas por Usuario - SEGUNDA FILA */}
        <div className="mb-8">
          <div className="mb-6 text-center">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90 mb-3">
              {isUser ? "Mis Ventas" : "Ventas por Usuario"}
            </h3>
          </div>

          {/* Grid de tres gráficos en una fila */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <BiglietteriaUserSalesChart 
              dateRange={dateRange}
            />
            <TourAereoUserSalesChart 
              dateRange={dateRange}
            />
            <TourBusUserSalesChart 
              dateRange={dateRange}
            />
          </div>
        </div>

        {/* Porcentaje de Ventas por Agente - TERCERA FILA */}
        <div className="mb-8">
          <AgentSalesPercentageChart 
            dateRange={dateRange}
          />
        </div>

        {/* Ranking de Agentes - CUARTA FILA */}
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Año:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <AgentRankingChart 
            selectedYear={selectedYear}
          />
        </div>

        {/* Gráfico Principal - AL FINAL */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 pt-6 dark:border-gray-800 dark:bg-white/[0.03] sm:px-8 sm:pt-8">
          {/* Header con título */}
          <div className="flex items-center justify-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {isUser ? "Mis Estadísticas FEE/AGV" : "FEE/AGV Statistics"}
            </h3>
          </div>

          {/* Tarjetas minimalistas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: CHART_COLORS.BIGLIETTERIA}}></div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">BIGLIETTERIA</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    €{totals.totalBiglietteria.toLocaleString('es-ES', { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 0 
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: CHART_COLORS.TOURS_BUS}}></div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">TOURS BUS</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    €{totals.totalToursBus.toLocaleString('es-ES', { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 0 
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: CHART_COLORS.TOUR_AEREO}}></div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">TOUR AEREO</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    €{totals.totalToursAereo.toLocaleString('es-ES', { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 0 
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">TOTAL</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    €{totals.grandTotal.toLocaleString('es-ES', { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 0 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
              <ReactApexChart
                options={chartOptions}
                series={chartData.series}
                type="bar"
                height={CHART_CONFIG.HEIGHT}
              />
            </div>
          </div>

          {/* Botón desplegable para tabla */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setShowTable(!showTable)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <span>Desglose Mensual</span>
              <svg
                className={`w-4 h-4 transition-transform ${showTable ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Tabla desplegable */}
          {showTable && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-4">
                Desglose Mensual FEE/AGV
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Mes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        BIGLIETTERIA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        TOURS BUS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        TOUR AEREO
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {monthlyData.map((data, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {data.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 font-semibold">
                          €{data.biglietteria.toLocaleString('es-ES', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">
                          €{data.toursBus.toLocaleString('es-ES', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 dark:text-purple-400 font-semibold">
                          €{data.toursAereo.toLocaleString('es-ES', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                          €{data.total.toLocaleString('es-ES', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Wrapper component que provee el Context
export default function DashboardViajesPage() {
  const { user: clerkUser } = useUser();
  const { isUser } = useUserRole();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Obtener el ID del usuario actual para filtrado
  useEffect(() => {
    const fetchUserId = async () => {
      if (clerkUser && isUser) {
        try {
          const userResponse = await fetch(`/api/user/profile`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setCurrentUserId(userData.id || userData.clerkId);
          }
        } catch (error) {
          console.error('Error fetching user ID:', error);
        }
      }
    };
    
    fetchUserId();
  }, [clerkUser, isUser]);

  return (
    <DashboardDataProvider userId={isUser ? currentUserId || undefined : undefined}>
      <DashboardViajesContent />
    </DashboardDataProvider>
  );
}