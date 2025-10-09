import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Truck, LogIn } from 'lucide-react';

const AppleIcon = () => (
  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.39,14.73a5.3,5.3,0,0,1-2.2-1.34,5.49,5.49,0,0,1-1.2-2.33,5.18,5.18,0,0,1,1-3.66,4.35,4.35,0,0,1,3.15-1.59,1.6,1.6,0,0,0,.7-.14,5.1,5.1,0,0,0-3.41-1.54,6.23,6.23,0,0,0-5.18,3.15,6.1,6.1,0,0,0-2.32,4.89,5.5,5.5,0,0,0,1.3,3.77,6.3,6.3,0,0,0,4.33,2.2,2.1,2.1,0,0,0,1-.19,4.42,4.42,0,0,1-2.61-4.14,4.2,4.2,0,0,1,3.22-4.13,1.4,1.4,0,0,0,.15.82,6.13,6.13,0,0,0-.86,3.61,4.52,4.52,0,0,0,2.5,3.61,1.52,1.52,0,0,0,.76.18,1,1,0,0,0,.68-1.8Zm-2-9.42a4.4,4.4,0,0,1,2.08,3.75,4.78,4.78,0,0,1-2.12,3.8,1.33,1.33,0,0,0-.54,1,1.36,1.36,0,0,0,1.15.9,4.82,4.82,0,0,0,2.11-.53,6,6,0,0,0,2.83-2.9,6,6,0,0,0-2.73-6.84,5.63,5.63,0,0,0-2.78-.68Z" />
  </svg>
);

const GooglePlayIcon = () => (
  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.6,2.25,14.1,12,3.6,21.75ZM15,12l3.45-3.45L15.9,6.75ZM18.45,15.45,15.9,17.25,15,12l.9,4.95Z" />
  </svg>
);


export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Truck className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">ConstruPreço</h1>
        <p className="text-2xl text-gray-700 mt-2">Transportadores</p>
        <p className="text-gray-600 mt-6 mb-8">
          A aplicação essencial para transportadores de materiais de construção. Aceite entregas, otimize as suas rotas e aumente os seus ganhos.
        </p>
        
        <div className="space-y-4 mb-10">
          <Button size="lg" className="w-full bg-black hover:bg-gray-800 text-white py-6">
            <AppleIcon />
            Download na App Store
          </Button>
          <Button size="lg" className="w-full bg-black hover:bg-gray-800 text-white py-6">
            <GooglePlayIcon />
            Disponível no Google Play
          </Button>
        </div>
        
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="outline" size="lg" className="w-full py-6 text-blue-600 border-blue-600 hover:bg-blue-50">
            <LogIn className="w-5 h-5 mr-2" />
            Já tenho conta. Aceder.
          </Button>
        </Link>
      </div>
      <footer className="absolute bottom-4 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} ConstruPreço. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}