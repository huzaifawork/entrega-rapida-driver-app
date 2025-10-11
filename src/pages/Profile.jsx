import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Vehicle } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Save, Loader2, AlertCircle, Star, Package, Euro, Award, Target, Bell, MessageSquare, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import PersonalInfo from "../components/profile/PersonalInfo";
import DocumentUpload from "../components/profile/DocumentUpload";
import PaymentSettings from "../components/profile/PaymentSettings";
import WarehouseManager from "../components/profile/WarehouseManager";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [editedData, setEditedData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const { Delivery } = await import('@/api/entities');
      const userData = await User.me();
      
      // Calculate earnings
      const allDriverDeliveries = await Delivery.filter({ driver_id: userData.id }, "-created_date");
      const completedDeliveries = allDriverDeliveries.filter(d => d.status === "delivered");
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weekEarnings = completedDeliveries
        .filter(d => new Date(d.delivery_time || d.created_date) >= weekAgo)
        .reduce((sum, d) => sum + (d.delivery_fee || 7.50), 0);
      
      const userWithStats = {
        ...userData,
        earnings_week: weekEarnings,
        total_deliveries: completedDeliveries.length
      };
      
      setUser(userWithStats);
      setEditedData(userWithStats || {});

      // Carregar veículos para análise de conformidade
      const userVehicles = await Vehicle.filter({ owner_id: userData.id }, "-created_date");
      setVehicles(userVehicles);

      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user && Object.keys(editedData).length > 0) {
      const userSubset = {};
      for (const key in editedData) {
        if (Object.prototype.hasOwnProperty.call(user, key)) {
          userSubset[key] = user[key];
        }
      }
      const hasChanged = JSON.stringify(userSubset) !== JSON.stringify(editedData);
      setIsDirty(hasChanged);
    } else {
      setIsDirty(false);
    }
  }, [editedData, user]);

  const handleSave = async () => {
    if (!isDirty) return;
    setIsSaving(true);
    try {
      await User.updateMyUserData(editedData);
      const updatedUser = await User.me();
      setUser(updatedUser);
      setEditedData(updatedUser);
      setIsDirty(false);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      navigate('/Login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleUpdate = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
    setEditedData((prev) => ({ ...prev, ...updatedFields }));
  };

  const getBonusLevel = (rating) => {
    if (rating >= 4.8) return { level: "Platinum", multiplier: "1.2x", color: "text-purple-600 bg-purple-100" };
    if (rating >= 4.5) return { level: "Gold", multiplier: "1.1x", color: "text-yellow-600 bg-yellow-100" };
    if (rating >= 4.0) return { level: "Silver", multiplier: "1.05x", color: "text-gray-600 bg-gray-100" };
    return { level: "Bronze", multiplier: "1.0x", color: "text-amber-600 bg-amber-100" };
  };

  if (isLoading || !user || !editedData) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>);
  }

  const hasPendingDocs = user.id_front_status === 'pending_review' || user.id_back_status === 'pending_review' || user.license_status === 'pending_review' || user.insurance_status === 'pending_review';
  const bonusInfo = getBonusLevel(user?.rating || 0);

  return (
    <div className="p-4 pb-20 lg:pb-4 min-h-screen">
      {/* Header do Perfil */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}>

        <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-green-600 text-white mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">
                  {user?.full_name?.[0] || "U"}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{user?.full_name}</h1>
                <p className="text-blue-100">{user?.email}</p>
                {user?.company_name &&
                <p className="text-sm text-blue-200 mt-1">{user.company_name}</p>
                }
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="font-semibold">{user?.rating?.toFixed(1) || "5.0"}</span>
                    <span className="text-sm text-blue-200">({user?.total_reviews || 0} avaliações)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>{user?.total_deliveries || 0} entregas</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${bonusInfo.color}`}>
                  {bonusInfo.level} {bonusInfo.multiplier}
                </div>
                <p className="text-xs text-blue-200 mt-1">Nível de Bónus</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 hidden sm:block">O Meu Perfil</h1>
        <Button onClick={handleSave} disabled={isSaving || !isDirty} className="flex items-center gap-2 ml-auto">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'A Guardar...' : isDirty ? 'Guardar Alterações' : 'Guardado'}
        </Button>
      </div>

      {!user.is_verified &&
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6">

          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center gap-3" role="alert">
            <AlertCircle className="w-5 h-5" />
            <span className="block sm:inline">O seu perfil não está verificado. Por favor, carregue os seus documentos para ativar a sua conta.</span>
          </div>
        </motion.div>
      }

      {hasPendingDocs &&
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6">

          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative flex items-center gap-3" role="alert">
            <AlertCircle className="w-5 h-5" />
            <span className="block sm:inline">Alguns dos seus documentos estão pendentes de revisão. A sua conta poderá estar limitada até à aprovação.</span>
          </div>
        </motion.div>
      }

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="personal">Pessoal</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="warehouses">Armazéns</TabsTrigger>
          <TabsTrigger value="payment">Pagamentos</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <PersonalInfo editedData={editedData} setEditedData={setEditedData} />
          </motion.div>
        </TabsContent>
        <TabsContent value="documents">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <DocumentUpload user={user} vehicles={vehicles} onUpdate={handleUpdate} />
          </motion.div>
        </TabsContent>
        <TabsContent value="warehouses">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <WarehouseManager user={user} />
          </motion.div>
        </TabsContent>
        <TabsContent value="payment">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <PaymentSettings user={user} editedData={editedData} setEditedData={setEditedData} />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Botão de Terminar Sessão (Logout) */}
      <div className="flex justify-center items-center pt-6">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="text-red-600 border-red-200 hover:bg-red-50">

          <LogOut className="w-4 h-4 mr-2" />
          Terminar Sessão
        </Button>
      </div>
    </div>);

}