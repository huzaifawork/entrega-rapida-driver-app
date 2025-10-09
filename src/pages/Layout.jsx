

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, 
  User, 
  Clock, 
  Bell, 
  Menu, 
  X, 
  Truck,
  MapPin,
  Star
} from "lucide-react";
import { User as UserEntity, Delivery } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Início",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "Veículos",
    url: createPageUrl("Vehicles"),
    icon: Truck,
  },
  {
    title: "Histórico",
    url: createPageUrl("History"),
    icon: Clock,
  },
  {
    title: "Perfil",
    url: createPageUrl("Profile"),
    icon: User,
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await UserEntity.me();
      
      // Calculate earnings
      const allDriverDeliveries = await Delivery.filter({ driver_id: userData.id }, "-created_date");
      const completedDeliveries = allDriverDeliveries.filter(d => d.status === "delivered");
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const todayEarnings = completedDeliveries
        .filter(d => new Date(d.delivery_time || d.created_date) >= today)
        .reduce((sum, d) => sum + (d.delivery_fee || 7.50), 0);
      
      const weekEarnings = completedDeliveries
        .filter(d => new Date(d.delivery_time || d.created_date) >= weekAgo)
        .reduce((sum, d) => sum + (d.delivery_fee || 7.50), 0);
      
      setUser({
        ...userData,
        earnings_today: todayEarnings,
        earnings_week: weekEarnings,
        total_deliveries: completedDeliveries.length
      });
    } catch (error) {
      console.log("Usuário não logado");
    }
  };

  const toggleAvailability = async () => {
    if (!user) return;
    const newStatus = !user.is_available;
    await UserEntity.updateMyUserData({ is_available: newStatus });
    setUser({ ...user, is_available: newStatus });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header Mobile */}
      <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">ConstruPreço</h1>
                <p className="text-xs text-gray-500">Transportadores</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (
                <Button
                  variant={user.is_available ? "default" : "outline"}
                  size="sm"
                  onClick={toggleAvailability}
                  className={`text-xs px-3 py-1 ${
                    user.is_available 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "text-gray-600 border-gray-300"
                  }`}
                >
                  {user.is_available ? "Online" : "Offline"}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* User Status Bar */}
          {user && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium">{user.rating?.toFixed(1) || "5.0"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{user.base_location_address?.split(',')[0] || "Lisboa"}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">€{user.earnings_today?.toFixed(2) || "0.00"}</div>
                <div className="text-xs text-gray-500">hoje</div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div className="bg-white w-64 h-full shadow-xl">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">Menu</h2>
            </div>
            <nav className="p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.title}
                    to={item.url}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      location.pathname === item.url
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="lg:hidden bg-white border-t border-gray-200 px-4 py-2 fixed bottom-0 left-0 right-0 z-40">
        <div className="flex justify-around">
          {navigationItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${
                location.pathname === item.url
                  ? "text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 w-64 h-full bg-white shadow-xl border-r border-gray-200 z-30">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ConstruPreço</h1>
              <p className="text-sm text-gray-500">Transportadores</p>
            </div>
          </div>
        </div>

        {user && (
          <div className="p-6 border-b bg-gray-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{user.full_name?.[0] || "U"}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.full_name}</p>
                <p className="text-sm text-gray-500">{user.company_name}</p>
              </div>
            </div>
            <Button
              variant={user.is_available ? "default" : "outline"}
              onClick={toggleAvailability}
              className={`w-full ${
                user.is_available 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "text-gray-600 border-gray-300"
              }`}
            >
              {user.is_available ? "Online - Disponível" : "Offline - Indisponível"}
            </Button>
          </div>
        )}

        <nav className="p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                to={item.url}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  location.pathname === item.url
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </div>
        </nav>
      </aside>
    </div>
  );
}

