import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Euro, 
  Package, 
  Navigation,
  AlertCircle,
  Weight,
  Construction,
  Truck,
  Eye,
  EyeOff
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

export default function DeliveryCard({ delivery, onAccept, isUserAvailable, userVehicles }) {
  const priorityColors = {
    normal: "bg-blue-100 text-blue-800",
    urgent: "bg-red-100 text-red-800", 
    scheduled: "bg-purple-100 text-purple-800"
  };

  const priorityLabels = {
    normal: "Normal",
    urgent: "Urgente",
    scheduled: "Agendada"
  };

  const isAnyVehicleCompatible = () => {
    if (!userVehicles || userVehicles.length === 0) return false;
    
    return userVehicles.some(vehicle => {
      if (!vehicle.is_active) return false;
      const vehicleMatches = !delivery.required_vehicle_type || 
                           delivery.required_vehicle_type === vehicle.vehicle_type;
      const craneMatches = !delivery.requires_crane || vehicle.has_crane;
      const weightMatches = !delivery.total_weight_kg || 
                          vehicle.max_weight_kg >= delivery.total_weight_kg;
      return vehicleMatches && craneMatches && weightMatches;
    });
  };

  const compatible = isAnyVehicleCompatible();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 border-0`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Pedido #{delivery.order_id}
              </h3>
              <p className="text-sm text-gray-500">{delivery.vendor_name}</p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Badge className={priorityColors[delivery.priority]}>
                {priorityLabels[delivery.priority]}
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-200">
                €{delivery.delivery_fee?.toFixed(2)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {(delivery.required_vehicle_type || delivery.requires_crane || delivery.total_weight_kg) && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-2">Requisitos do Veículo:</p>
              <div className="flex flex-wrap gap-2">
                {delivery.required_vehicle_type && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Truck className="w-3 h-3 mr-1" />
                    {vehicleTypeLabels[delivery.required_vehicle_type]}
                  </Badge>
                )}
                {delivery.requires_crane && (
                  <Badge className="bg-orange-100 text-orange-800">
                    <Construction className="w-3 h-3 mr-1" />
                    Grua Necessária
                  </Badge>
                )}
                {delivery.total_weight_kg && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Weight className="w-3 h-3 mr-1" />
                    {delivery.total_weight_kg}kg
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Retirada</p>
                <p className="text-sm text-gray-600">{delivery.pickup_address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <EyeOff className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Contacto disponível após aceitar</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Entrega</p>
                <p className="text-sm text-gray-600">{delivery.delivery_address}</p>
                <div className="flex items-center gap-2 mt-1">
                  <EyeOff className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Contacto disponível após aceitar</span>
                </div>
              </div>
            </div>
          </div>

          {delivery.materials && delivery.materials.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Materiais de Construção:</p>
              <div className="space-y-1">
                {delivery.materials.map((material, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{material.quantity} {material.unit} {material.name}</span>
                    <div className="flex gap-2">
                      {material.weight_kg && (
                        <span className="text-gray-500">{material.weight_kg}kg</span>
                      )}
                      {material.requires_crane && (
                        <Construction className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-gray-600">
                <Navigation className="w-4 h-4" />
                <span>{delivery.distance_km || 0}km</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{delivery.estimated_duration || 0}min</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-green-600 text-lg">
                €{delivery.delivery_fee?.toFixed(2)}
              </div>
            </div>
          </div>

          {delivery.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">{delivery.notes}</p>
              </div>
            </div>
          )}

          <Button
            onClick={() => onAccept(delivery)}
            disabled={!isUserAvailable || !compatible}
            className="w-full font-semibold py-3"
            variant={compatible && isUserAvailable ? "default" : "secondary"}
          >
            {!isUserAvailable ? "Fique online para aceitar" : 
             !compatible ? "Nenhum veículo compatível" : "Aceitar Entrega"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}