
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Package,
  Phone,
  Navigation, // Existing import
  CheckCircle,
  Truck,
  Clock,
  ArrowRight,
  MessageCircle,
  AlertTriangle,
  ExternalLink // New import
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Delivery, Order } from "@/api/entities";

import ChatWindow from "../chat/ChatWindow";

export default function ActiveDelivery({ delivery, onStatusUpdate, selectedVehicle }) {
  const [showChat, setShowChat] = useState(false);

  const getStatusConfig = (status) => {
    switch (status) {
      case "accepted":
        return {
          color: "bg-blue-100 text-blue-800",
          label: "Aceita",
          nextAction: "A Caminho da Retirada",
          nextStatus: "heading_pickup",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
          description: "Dirija-se ao local de retirada"
        };
      case "heading_pickup":
        return {
          color: "bg-orange-100 text-orange-800",
          label: "A Caminho da Retirada",
          nextAction: "Chegou à Retirada",
          nextStatus: "arrived_pickup",
          buttonColor: "bg-orange-600 hover:bg-orange-700",
          description: "Em trânsito para retirada"
        };
      case "arrived_pickup":
        return {
          color: "bg-purple-100 text-purple-800",
          label: "No Local de Retirada",
          nextAction: "Carga Retirada",
          nextStatus: "picked_up",
          buttonColor: "bg-purple-600 hover:bg-purple-700",
          description: "Retire a carga e confirme"
        };
      case "picked_up":
        return {
          color: "bg-indigo-100 text-indigo-800",
          label: "Carga Retirada",
          nextAction: "A Caminho da Entrega",
          nextStatus: "heading_delivery",
          buttonColor: "bg-indigo-600 hover:bg-indigo-700",
          description: "Dirija-se ao local de entrega"
        };
      case "heading_delivery":
        return {
          color: "bg-cyan-100 text-cyan-800",
          label: "A Caminho da Entrega",
          nextAction: "Chegou à Entrega",
          nextStatus: "arrived_delivery",
          buttonColor: "bg-cyan-600 hover:bg-cyan-700",
          description: "Em trânsito para entrega"
        };
      case "arrived_delivery":
        return {
          color: "bg-yellow-100 text-yellow-800",
          label: "No Local de Entrega",
          nextAction: "Carga Entregue",
          nextStatus: "delivered",
          buttonColor: "bg-green-600 hover:bg-green-700",
          description: "Entregue a carga ao cliente"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          label: status,
          nextAction: "Atualizar",
          nextStatus: status,
          buttonColor: "bg-gray-600 hover:bg-gray-700",
          description: ""
        };
    }
  };

  const handleCancelDelivery = async () => {
    if (confirm("Tem certeza que deseja cancelar esta entrega? Ela ficará disponível para outros transportadores.")) {
      try {
        await Delivery.update(delivery.id, {
          status: "cancelled",
          driver_id: null,
          vehicle_id: null
        });
        if (delivery.order_id) {
          await Order.update(delivery.order_id, {
            status: "cancelled",
            delivery_status: "cancelled"
          });
        }
        window.location.reload();
      } catch (error) {
        console.error("Erro ao cancelar entrega:", error);
      }
    }
  };

  const statusConfig = getStatusConfig(delivery.status);

  const getCurrentDestination = () => {
    const isPickupPhase = ["accepted", "heading_pickup", "arrived_pickup"].includes(delivery.status);
    return isPickupPhase ? {
      address: delivery.pickup_address,
      contact: delivery.pickup_contact,
      contactName: delivery.vendor_name,
      lat: delivery.pickup_lat,
      lng: delivery.pickup_lng,
      type: "retirada"
    } : {
      address: delivery.delivery_address,
      contact: delivery.delivery_contact,
      contactName: delivery.customer_name,
      lat: delivery.delivery_lat,
      lng: delivery.delivery_lng,
      type: "entrega"
    };
  };

  const destination = getCurrentDestination();

  const openWaze = () => {
    if (!destination.lat || !destination.lng) return;
    const wazeUrl = `https://waze.com/ul?ll=${destination.lat}%2C${destination.lng}&navigate=yes&zoom=17`;
    window.open(wazeUrl, '_blank');
  };

  const openGoogleMaps = () => {
    if (!destination.lat || !destination.lng) return;
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
    window.open(googleUrl, '_blank');
  };

  const handleStatusUpdate = () => {
    console.log('Status update clicked:', statusConfig.nextStatus);
    onStatusUpdate(delivery.id, statusConfig.nextStatus);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-6"
    >
      <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-white">
            <Truck className="w-6 h-6" />
            Entrega Ativa - #{delivery.order_id}
            <Badge className={`${statusConfig.color} ml-2`}>
              {statusConfig.label}
            </Badge>
          </CardTitle>
          <p className="text-blue-100 text-sm">{statusConfig.description}</p>
        </CardHeader>

        <CardContent className="bg-white text-gray-900 rounded-b-lg p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
              {[
                { status: "accepted", label: "Aceita", icon: CheckCircle },
                { status: "heading_pickup", label: "Indo", icon: ArrowRight },
                { status: "picked_up", label: "Retirada", icon: Package },
                { status: "heading_delivery", label: "Entregando", icon: ArrowRight },
                { status: "delivered", label: "Entregue", icon: CheckCircle }
              ].map((step, index) => {
                const isActive = delivery.status === step.status || (step.status === 'heading_pickup' && delivery.status === 'arrived_pickup') || (step.status === 'heading_delivery' && delivery.status === 'arrived_delivery');
                const isCompleted = ["accepted", "heading_pickup", "arrived_pickup", "picked_up", "heading_delivery", "arrived_delivery", "delivered"].indexOf(delivery.status) >
                                  ["accepted", "heading_pickup", "picked_up", "heading_delivery", "delivered"].indexOf(step.status);

                return (
                  <div key={step.status} className="flex items-center flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      isActive ? "bg-blue-500 text-white ring-4 ring-blue-200" :
                      isCompleted ? "bg-green-500 text-white" :
                      "bg-gray-200 text-gray-500"
                    }`}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <div className="ml-2 text-xs font-medium text-gray-600 min-w-0">
                      {step.label}
                    </div>
                    {index < 4 && (
                      <div className={`w-8 h-1 mx-3 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  Destino Atual - {destination.type.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-700 font-medium">{destination.address || 'Endereço não disponível'}</p>
              {destination.contactName && <p className="text-sm text-gray-600">{destination.contactName}</p>}
              {destination.contact && (
                <a
                  href={`tel:${destination.contact}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1"
                >
                  <Phone className="w-3 h-3" />
                  {destination.contact}
                </a>
              )}
            </div>

            {selectedVehicle && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-700">Veículo em Uso</span>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedVehicle.license_plate} - {selectedVehicle.brand} {selectedVehicle.model}
                </p>
              </div>
            )}

            {delivery.materials && delivery.materials.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 mb-2">📦 Materiais ({delivery.materials.length}):</h4>
                <div className="space-y-1">
                  {delivery.materials.map((material, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{material.quantity || 1} {material.unit || 'un'} - {material.product_name || material.name}</span>
                      {material.weight_kg && (
                        <span className="text-gray-500">{material.weight_kg}kg</span>
                      )}
                    </div>
                  ))}
                </div>
                {delivery.total_weight_kg && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-sm font-semibold">Peso Total: {delivery.total_weight_kg}kg</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={openWaze}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir no Waze
              </Button>

              <Button
                variant="outline"
                onClick={openGoogleMaps}
                className="flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                Google Maps
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowChat(true)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat Cliente
              </Button>

              {delivery.status !== "delivered" && (
                <Button
                  className={`flex-1 ${statusConfig.buttonColor} text-white`}
                  onClick={handleStatusUpdate}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {statusConfig.nextAction}
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={handleCancelDelivery}
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Cancelar Entrega
            </Button>

            <div className="text-center text-sm text-gray-500 pt-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Entrega iniciada às {delivery.created_date?.toDate ? delivery.created_date.toDate().toLocaleTimeString('pt-PT') : new Date(delivery.created_date).toLocaleTimeString('pt-PT')}
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showChat && (
          <div className="mt-4">
            <ChatWindow
              delivery={delivery}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
