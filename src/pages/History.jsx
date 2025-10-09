
import React, { useState, useEffect } from "react";
import { Delivery } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  MapPin, 
  Package, 
  Euro, 
  Calendar,
  TrendingUp,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale"; // This import is not used in the provided filtering logic but is part of the original code.
import { motion } from "framer-motion";

import HistoryFilters from "../components/history/HistoryFilters";
import DeliveryHistoryCard from "../components/history/DeliveryHistoryCard";

export default function History() {
  const [user, setUser] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: "all",
    status: "all"
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Aplicar filtros diretamente no useEffect
    let filtered = [...deliveries];

    // Filtro por período
    if (filters.period !== "all") {
      const now = new Date();
      const startDate = new Date();
      
      switch (filters.period) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(delivery => 
        new Date(delivery.delivery_time || delivery.created_date) >= startDate
      );
    }

    // Filtro por status
    if (filters.status !== "all") {
      filtered = filtered.filter(delivery => delivery.status === filters.status);
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, filters]); // Dependencies are deliveries and filters

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      // Buscar entregas do transportador (concluídas e canceladas)
      const userDeliveries = await Delivery.filter({ 
        driver_id: userData.id
      }, "-created_date", 100);
      
      // Filtrar apenas entregas concluídas ou canceladas
      const completedDeliveries = userDeliveries.filter(d => 
        d.status === "delivered" || d.status === "cancelled"
      );
      
      setDeliveries(completedDeliveries);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      setIsLoading(false);
    }
  };

  // The applyFilters function has been moved into the useEffect above and is no longer needed.
  // const applyFilters = () => {
  //   let filtered = [...deliveries];

  //   // Filtro por período
  //   if (filters.period !== "all") {
  //     const now = new Date();
  //     const startDate = new Date();
      
  //     switch (filters.period) {
  //       case "today":
  //         startDate.setHours(0, 0, 0, 0);
  //         break;
  //       case "week":
  //         startDate.setDate(now.getDate() - 7);
  //         break;
  //       case "month":
  //         startDate.setMonth(now.getMonth() - 1);
  //         break;
  //     }
      
  //     filtered = filtered.filter(delivery => 
  //       new Date(delivery.delivery_time || delivery.created_date) >= startDate
  //     );
  //   }

  //   // Filtro por status
  //   if (filters.status !== "all") {
  //     filtered = filtered.filter(delivery => delivery.status === filters.status);
  //   }

  //   setFilteredDeliveries(filtered);
  // };

  const getTotalEarnings = () => {
    return filteredDeliveries.reduce((total, delivery) => 
      total + (delivery.delivery_fee || 7.50), 0
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-gray-200 rounded-2xl"></div>
          <div className="grid md:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 lg:pb-4 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Clock className="w-6 h-6 text-blue-600" />
              Histórico de Entregas
            </CardTitle>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Estatísticas Rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-lg border-0">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Euro className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                €{getTotalEarnings().toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Ganhos Filtrados</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredDeliveries.length}
              </div>
              <p className="text-sm text-gray-600">Entregas</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                €{filteredDeliveries.length > 0 ? (getTotalEarnings() / filteredDeliveries.length).toFixed(2) : "0.00"}
              </div>
              <p className="text-sm text-gray-600">Média por Entrega</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Filtros */}
      <HistoryFilters filters={filters} onFiltersChange={setFilters} />

      {/* Lista de Entregas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Entregas Realizadas</span>
              <Badge variant="secondary">{filteredDeliveries.length} entregas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDeliveries.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Nenhuma entrega encontrada
                </h3>
                <p className="text-gray-500">
                  Ajuste os filtros ou realize mais entregas
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDeliveries.map((delivery, index) => (
                  <DeliveryHistoryCard 
                    key={delivery.id}
                    delivery={delivery}
                    index={index}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
