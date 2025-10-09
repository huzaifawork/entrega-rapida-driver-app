
import React, { useState, useEffect } from "react";
import { Vehicle } from "@/api/entities";
import { User } from "@/api/entities";
import { Warehouse } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  Plus, 
  Edit, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Settings,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import VehicleCard from "../components/vehicles/VehicleCard";
import VehicleForm from "../components/vehicles/VehicleForm";
import VehicleAnalytics from "../components/vehicles/VehicleAnalytics";

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [user, setUser] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedVehicleForAnalytics, setSelectedVehicleForAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const [userVehicles, userWarehouses] = await Promise.all([
        Vehicle.filter({ owner_id: userData.id }, "-created_date"),
        Warehouse.filter({ owner_id: userData.id }, "-created_date")
      ]);
      
      setVehicles(userVehicles);
      setWarehouses(userWarehouses);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (vehicleData) => {
    try {
      if (editingVehicle) {
        await Vehicle.update(editingVehicle.id, vehicleData);
      } else {
        await Vehicle.create({ 
          ...vehicleData, 
          owner_id: user.id 
        });
      }
      
      setShowForm(false);
      setEditingVehicle(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar veículo:", error);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleToggleActive = async (vehicle) => {
    try {
      await Vehicle.update(vehicle.id, { 
        is_active: !vehicle.is_active 
      });
      loadData();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const getExpiringDocuments = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return vehicles.filter(vehicle => {
      const insuranceExpiring = vehicle.insurance_expiry && 
        new Date(vehicle.insurance_expiry) <= thirtyDaysFromNow;
      const inspectionExpiring = vehicle.inspection_expiry && 
        new Date(vehicle.inspection_expiry) <= thirtyDaysFromNow;
      
      return insuranceExpiring || inspectionExpiring;
    });
  };

  const expiringDocs = getExpiringDocuments();
  
  // Criar um mapa para pesquisa rápida de nomes de armazéns
  const warehouseMap = new Map(warehouses.map(wh => [wh.id, wh.name]));

  return (
    <div className="p-4 pb-20 lg:pb-4 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Truck className="w-6 h-6 text-green-600" />
                Gestão de Veículos
              </CardTitle>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Veículo
              </Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Alertas de Documentação */}
      {expiringDocs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="shadow-lg border-0 border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900">Documentos a Expirar</h3>
                  <p className="text-sm text-orange-800 mt-1">
                    {expiringDocs.length} veículo(s) com documentação a expirar nos próximos 30 dias
                  </p>
                  <div className="mt-2">
                    {expiringDocs.map(vehicle => (
                      <Badge key={vehicle.id} variant="outline" className="mr-2 text-orange-700 border-orange-300">
                        {vehicle.license_plate}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Formulário de Veículo */}
      <AnimatePresence>
        {showForm && (
          <VehicleForm
            vehicle={editingVehicle}
            onSubmit={handleSubmit}
            warehouses={warehouses}
            onCancel={() => {
              setShowForm(false);
              setEditingVehicle(null);
            }}
          />
        )}
      </AnimatePresence>

      <Tabs defaultValue="fleet" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="fleet">Frota</TabsTrigger>
          <TabsTrigger value="analytics">Análise Financeira</TabsTrigger>
        </TabsList>

        <TabsContent value="fleet">
          {/* Lista de Veículos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {vehicles.length === 0 ? (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhum veículo registado
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Adicione veículos para começar a receber entregas
                  </p>
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Veículo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {vehicles.map((vehicle, index) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    index={index}
                    warehouseName={warehouseMap.get(vehicle.warehouse_id)}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    onViewAnalytics={() => setSelectedVehicleForAnalytics(vehicle)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {selectedVehicleForAnalytics ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Análise do Veículo {selectedVehicleForAnalytics.license_plate}
                  </h2>
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedVehicleForAnalytics(null)}
                  >
                    Ver Todos os Veículos
                  </Button>
                </div>
                <VehicleAnalytics vehicle={selectedVehicleForAnalytics} />
              </div>
            ) : (
              <Card className="shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Selecione um veículo para análise
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Escolha um veículo da sua sua frota para ver a análise financeira detalhada
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                    {vehicles.map((vehicle) => (
                      <Button
                        key={vehicle.id}
                        variant="outline"
                        onClick={() => setSelectedVehicleForAnalytics(vehicle)}
                        className="p-4 h-auto flex flex-col items-center gap-2"
                      >
                        <Truck className="w-6 h-6 text-gray-600" />
                        <span className="text-sm font-medium">{vehicle.license_plate}</span>
                        <span className="text-xs text-gray-500">{vehicle.brand} {vehicle.model}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
