import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Fuel, 
  Wrench, 
  Euro,
  BarChart3,
  Calendar,
  Target
} from "lucide-react";
import { Delivery } from "@/api/entities";
import { motion } from "framer-motion";

export default function VehicleAnalytics({ vehicle }) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      // Buscar entregas deste veículo nos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const deliveries = await Delivery.filter({
        vehicle_id: vehicle.id,
        status: "delivered"
      }, "-delivery_time", 100);

      const recentDeliveries = deliveries.filter(d => 
        new Date(d.delivery_time || d.created_date) >= thirtyDaysAgo
      );

      const totalRevenue = recentDeliveries.reduce((sum, d) => sum + (d.delivery_fee || 7.50), 0);
      const totalDistance = recentDeliveries.reduce((sum, d) => sum + (d.distance_km || 0), 0);
      
      // Calcular custos detalhados
      const fuelCostPerKm = 0.18; // €0.18 por km (combustível)
      const maintenanceCostPerKm = 0.08; // €0.08 por km (manutenção)
      const insuranceCostPerDay = (vehicle.insurance_cost_annual || 1500) / 365;
      const inspectionCostPerDay = 150 / 365; // €150 inspeção anual / 365 dias
      
      const fuelCosts = totalDistance * fuelCostPerKm;
      const maintenanceCosts = totalDistance * maintenanceCostPerKm;
      const insuranceCosts = insuranceCostPerDay * 30;
      const inspectionCosts = inspectionCostPerDay * 30;
      const totalCosts = fuelCosts + maintenanceCosts + insuranceCosts + inspectionCosts;

      const netProfit = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const averageRevenuePerDelivery = recentDeliveries.length > 0 ? totalRevenue / recentDeliveries.length : 0;
      const averageProfitPerDelivery = recentDeliveries.length > 0 ? netProfit / recentDeliveries.length : 0;
      
      // Taxa de utilização (dias trabalhados dos últimos 30)
      const workingDays = new Set(recentDeliveries.map(d => 
        new Date(d.delivery_time).toDateString()
      )).size;
      const utilizationRate = (workingDays / 30) * 100;

      // Eficiência por km
      const revenuePerKm = totalDistance > 0 ? totalRevenue / totalDistance : 0;
      const costPerKm = totalDistance > 0 ? totalCosts / totalDistance : 0;

      setAnalytics({
        totalDeliveries: recentDeliveries.length,
        totalRevenue,
        totalCosts,
        netProfit,
        profitMargin,
        averageRevenuePerDelivery,
        averageProfitPerDelivery,
        utilizationRate,
        totalDistance,
        revenuePerKm,
        costPerKm,
        costBreakdown: {
          fuel: fuelCosts,
          maintenance: maintenanceCosts,
          insurance: insuranceCosts,
          inspection: inspectionCosts
        }
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar analytics:", error);
      setIsLoading(false);
    }
  }, [vehicle.id, vehicle.insurance_cost_annual]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum dado disponível para este veículo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-lg border-0">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                €{analytics.totalRevenue.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Receita (30 dias)</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-lg border-0">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-red-600">
                €{analytics.totalCosts.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Custos (30 dias)</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-lg border-0">
            <CardContent className="p-4 text-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                analytics.netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                {analytics.netProfit >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className={`text-2xl font-bold ${analytics.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                €{analytics.netProfit.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Lucro Líquido</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-lg border-0">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className={`text-2xl font-bold ${analytics.profitMargin >= 20 ? 'text-green-600' : analytics.profitMargin >= 10 ? 'text-orange-600' : 'text-red-600'}`}>
                {analytics.profitMargin.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Margem de Lucro</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Análise Detalhada */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Breakdown de Custos */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-600" />
              Breakdown de Custos (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-red-500" />
                  <span>Combustível</span>
                </div>
                <span className="font-semibold">€{analytics.costBreakdown.fuel.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-500" />
                  <span>Manutenção</span>
                </div>
                <span className="font-semibold">€{analytics.costBreakdown.maintenance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge className="w-4 h-4 bg-green-500" />
                  <span>Seguro</span>
                </div>
                <span className="font-semibold">€{analytics.costBreakdown.insurance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span>Inspeção</span>
                </div>
                <span className="font-semibold">€{analytics.costBreakdown.inspection.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span className="text-red-600">€{analytics.totalCosts.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Performance */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Métricas de Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Entregas Realizadas</span>
                <span className="font-semibold text-blue-600">{analytics.totalDeliveries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Distância Total</span>
                <span className="font-semibold">{analytics.totalDistance.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Taxa de Utilização</span>
                <span className={`font-semibold ${analytics.utilizationRate >= 70 ? 'text-green-600' : analytics.utilizationRate >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                  {analytics.utilizationRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Receita por Km</span>
                <span className="font-semibold text-green-600">€{analytics.revenuePerKm.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Custo por Km</span>
                <span className="font-semibold text-red-600">€{analytics.costPerKm.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Lucro Médio/Entrega</span>
                <span className={`font-semibold ${analytics.averageProfitPerDelivery >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{analytics.averageProfitPerDelivery.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendações */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.profitMargin < 15 && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-red-800 font-medium">⚠️ Margem de lucro baixa</p>
                <p className="text-red-700 text-sm">Considere negociar preços mais altos ou reduzir custos operacionais.</p>
              </div>
            )}
            {analytics.utilizationRate < 50 && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                <p className="text-orange-800 font-medium">📈 Taxa de utilização baixa</p>
                <p className="text-orange-700 text-sm">Este veículo está sendo subutilizado. Considere mais entregas ou transferir para outro transportador.</p>
              </div>
            )}
            {analytics.costPerKm > 0.30 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-yellow-800 font-medium">💰 Custos operacionais elevados</p>
                <p className="text-yellow-700 text-sm">Analise os custos de combustível e manutenção. Veículo pode precisar de revisão.</p>
              </div>
            )}
            {analytics.profitMargin >= 20 && analytics.utilizationRate >= 70 && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <p className="text-green-800 font-medium">✅ Veículo muito rentável</p>
                <p className="text-green-700 text-sm">Este veículo está a gerar bons lucros com alta utilização. Continue assim!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}