import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Package, 
  Euro, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";

export default function DeliveryHistoryCard({ delivery, index }) {
  const statusConfig = {
    delivered: {
      color: "bg-green-100 text-green-800 border-green-200",
      label: "Entregue"
    },
    cancelled: {
      color: "bg-red-100 text-red-800 border-red-200", 
      label: "Cancelada"
    }
  };

  const config = statusConfig[delivery.status] || statusConfig.delivered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Pedido #{delivery.order_id}
              </h3>
              <p className="text-sm text-gray-500">{delivery.vendor_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${config.color} border`}>
                {config.label}
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-200">
                €{(delivery.delivery_fee || 7.50).toFixed(2)}
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="font-medium">De:</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">{delivery.pickup_address}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium">Para:</span>
              </div>
              <p className="text-sm text-gray-600 ml-6">{delivery.delivery_address}</p>
              <p className="text-xs text-gray-500 ml-6">Cliente: {delivery.customer_name}</p>
            </div>
          </div>

          {/* Produtos */}
          {delivery.products && delivery.products.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Produtos entregues:</p>
              <div className="space-y-1">
                {delivery.products.map((product, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{product.quantity}x {product.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              {delivery.pickup_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Retirada: {format(new Date(delivery.pickup_time), "HH:mm")}</span>
                </div>
              )}
              {delivery.delivery_time && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Entregue: {format(new Date(delivery.delivery_time), "HH:mm")}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(delivery.delivery_time || delivery.created_date), "dd/MM/yyyy")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}