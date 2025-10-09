
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Weight,
  Ruler,
  Construction,
  Truck,
  Power,
  BarChart3,
  Building
} from "lucide-react";

const vehicleTypeLabels = {
  truck_small: "Camião Pequeno",
  truck_medium: "Camião Médio", 
  truck_large: "Camião Grande",
  van: "Carrinha",
  pickup: "Pickup",
  crane_truck: "Camião com Grua",
  tipper_truck: "Camião Basculante",
  flatbed: "Camião Plataforma"
};

export default function VehicleCard({ vehicle, index, onEdit, onToggleActive, onViewAnalytics, warehouseName }) {
  const isDocumentValid = (date) => {
    return !date || new Date(date) > new Date();
  };

  const isExpiringSoon = (date) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
  };

  const isVehicleValid = () => {
    return isDocumentValid(vehicle.insurance_expiry) && 
           isDocumentValid(vehicle.inspection_expiry) &&
           vehicle.is_active;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 ${
        !isVehicleValid() ? "border-red-200" : "border-0"
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {vehicle.license_plate}
              </h3>
              <p className="text-sm text-gray-500">
                {vehicleTypeLabels[vehicle.vehicle_type]}
              </p>
              <p className="text-sm text-gray-600">
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {isVehicleValid() ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Válido
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Problemas
                </Badge>
              )}
              {!vehicle.is_active && (
                <Badge variant="outline" className="text-gray-500">
                  Inativo
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Warehouse */}
          {warehouseName && (
            <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-md">
              <Building className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-gray-700 font-medium truncate">
                Base: {warehouseName}
              </span>
            </div>
          )}

          {/* Especificações */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-gray-500" />
              <span>{vehicle.max_weight_kg}kg</span>
            </div>
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-gray-500" />
              <span>{vehicle.cargo_length_m}x{vehicle.cargo_width_m}x{vehicle.cargo_height_m}m</span>
            </div>
          </div>

          {/* Custos de Operação */}
          {(vehicle.base_freight_cost || vehicle.cost_per_km || vehicle.cost_per_hour) && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">Custos Configurados:</p>
              <div className="space-y-1 text-sm">
                {vehicle.base_freight_cost && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Frete base:</span>
                    <span className="font-medium">€{vehicle.base_freight_cost}</span>
                  </div>
                )}
                {vehicle.cost_per_km && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Por km:</span>
                    <span className="font-medium">€{vehicle.cost_per_km}</span>
                  </div>
                )}
                {vehicle.cost_per_hour && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Por hora:</span>
                    <span className="font-medium">€{vehicle.cost_per_hour}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Características Especiais */}
          <div className="flex flex-wrap gap-2">
            {vehicle.has_crane && (
              <Badge className="bg-blue-100 text-blue-800">
                <Construction className="w-3 h-3 mr-1" />
                Grua {vehicle.crane_reach_m}m
              </Badge>
            )}
            {vehicle.has_tipper && (
              <Badge className="bg-green-100 text-green-800">
                Basculante
              </Badge>
            )}
            {vehicle.has_tailgate && (
              <Badge className="bg-purple-100 text-purple-800">
                Elevador
              </Badge>
            )}
          </div>

          {/* Status da Documentação */}
          <div className="space-y-2">
            {vehicle.insurance_expiry && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Seguro:</span>
                <div className="flex items-center gap-2">
                  <span className={`${
                    !isDocumentValid(vehicle.insurance_expiry) ? "text-red-600" :
                    isExpiringSoon(vehicle.insurance_expiry) ? "text-orange-600" :
                    "text-green-600"
                  }`}>
                    {new Date(vehicle.insurance_expiry).toLocaleDateString()}
                  </span>
                  {!isDocumentValid(vehicle.insurance_expiry) ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : isExpiringSoon(vehicle.insurance_expiry) ? (
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </div>
            )}

            {vehicle.inspection_expiry && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Inspeção:</span>
                <div className="flex items-center gap-2">
                  <span className={`${
                    !isDocumentValid(vehicle.inspection_expiry) ? "text-red-600" :
                    isExpiringSoon(vehicle.inspection_expiry) ? "text-orange-600" :
                    "text-green-600"
                  }`}>
                    {new Date(vehicle.inspection_expiry).toLocaleDateString()}
                  </span>
                  {!isDocumentValid(vehicle.inspection_expiry) ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : isExpiringSoon(vehicle.inspection_expiry) ? (
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(vehicle)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewAnalytics(vehicle)}
              className="flex-1"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Análise
            </Button>
          </div>
          
          <Button
            variant={vehicle.is_active ? "outline" : "default"}
            size="sm"
            onClick={() => onToggleActive(vehicle)}
            className={`w-full ${
              vehicle.is_active 
                ? "text-red-600 border-red-200 hover:bg-red-50" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            <Power className="w-4 h-4 mr-2" />
            {vehicle.is_active ? "Desativar" : "Ativar"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
