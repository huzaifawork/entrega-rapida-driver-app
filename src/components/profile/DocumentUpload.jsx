import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Camera, Upload, AlertTriangle, CheckCircle, Clock, Shield, ShieldCheck, ShieldX } from "lucide-react";
import { User } from "@/api/entities";
import { Vehicle } from "@/api/entities";
import { UploadFile, InvokeLLM } from "@/api/integrations";
import { motion } from "framer-motion";

const DocumentItem = ({ docType, label, user, onUpdate, hasExpiry, allowPhoto = false }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  const docUrl = user?.[`${docType}_document_url`];
  const docStatus = user?.[`${docType}_status`];

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      if (e.target.files[0]) {
        setSelectedFile(e.target.files[0]);
      }
    };
    input.click();
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    try {
      const { file_url } = await UploadFile({ file: selectedFile });
      const updatedFields = {
        [`${docType}_document_url`]: file_url,
        [`${docType}_status`]: 'pending_review'
      };
      await User.updateMyUserData(updatedFields);
      onUpdate(updatedFields);
      setUploadStatus('success');
      setSelectedFile(null);
    } catch (error) {
      console.error(`Erro ao carregar ${label}:`, error);
      setUploadStatus('error');
    }
  };

  const getStatusInfo = () => {
    if (docStatus === 'approved') return { text: "Aprovado", color: "text-green-600", icon: CheckCircle };
    if (docStatus === 'pending_review') return { text: "Pendente", color: "text-orange-600", icon: Clock };
    if (docStatus === 'rejected') return { text: "Rejeitado", color: "text-red-600", icon: AlertTriangle };
    return { text: "Não carregado", color: "text-gray-500", icon: FileText };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className="border-t pt-4 first:border-t-0 first:pt-0">
      <h3 className="font-medium mb-3">{label}</h3>
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="flex-grow"
          />
          
          {allowPhoto && (
            <Button variant="outline" size="icon" onClick={handleCameraCapture}>
              <Camera className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {selectedFile && (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 truncate flex-1 mr-3">{selectedFile.name}</p>
            <Button 
              onClick={handleUpload} 
              disabled={uploadStatus === 'uploading'}
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadStatus === 'uploading' ? "A carregar..." : "Carregar"}
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-3 text-sm">
        <div className={`flex items-center gap-1 ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
          <span>Status: {status.text}</span>
        </div>
        {docUrl && (
          <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Ver Documento
          </a>
        )}
      </div>
      
      {uploadStatus === 'error' && (
        <p className="text-red-500 text-sm mt-1">Erro ao carregar. Tente novamente.</p>
      )}
      {uploadStatus === 'success' && (
        <p className="text-green-500 text-sm mt-1">Documento carregado com sucesso!</p>
      )}
    </div>
  );
};

export default function DocumentUpload({ user, onUpdate }) {
  const [vehicles, setVehicles] = useState([]);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadVehicles = useCallback(async () => {
    if (!user?.id) return;
    try {
      const userVehicles = await Vehicle.filter({ owner_id: user.id }, "-created_date");
      setVehicles(userVehicles);
    } catch (error) {
      console.error("Erro ao carregar veículos:", error);
    }
  }, [user?.id]);

  const runComplianceAnalysis = useCallback(async () => {
    if (!user) return;
    
    setIsAnalyzing(true);
    try {
      const documentData = {
        user_documents: {
          license_expiry: user?.license_expiry,
          license_status: user?.license_status,
          insurance_expiry: user?.insurance_expiry,
          insurance_status: user?.insurance_status,
          id_front_status: user?.id_front_status,
          id_back_status: user?.id_back_status
        },
        vehicles: vehicles.map(v => ({
          license_plate: v.license_plate,
          insurance_expiry: v.insurance_expiry,
          inspection_expiry: v.inspection_expiry,
          is_active: v.is_active
        }))
      };

      const analysisResult = await InvokeLLM({
        prompt: `Analise a conformidade dos documentos de transportador:

${JSON.stringify(documentData, null, 2)}

Determine apenas se está EM CONFORMIDADE para fazer entregas (true/false) e calcule um score de 0-100.

Regras críticas:
- Documentos expirados = NÃO CONFORME
- Documentos pendentes há mais de 15 dias = NÃO CONFORME  
- Veículos ativos sem seguro/inspeção válidos = NÃO CONFORME
- ID front/back rejeitados = NÃO CONFORME

Responda de forma simples e objetiva.`,
        response_json_schema: {
          type: "object",
          properties: {
            is_compliant: { type: "boolean" },
            compliance_score: { type: "number" }
          }
        }
      });

      setComplianceStatus(analysisResult);

      // Atualizar verificação do usuário
      if (analysisResult.is_compliant !== user.is_verified) {
        await User.updateMyUserData({ 
          is_verified: analysisResult.is_compliant,
          compliance_score: analysisResult.compliance_score 
        });
        onUpdate({ 
          is_verified: analysisResult.is_compliant,
          compliance_score: analysisResult.compliance_score 
        });
      }

    } catch (error) {
      console.error("Erro na análise de conformidade (opcional):", error);
      // Silently fail - compliance analysis is optional
      setComplianceStatus(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, vehicles, onUpdate]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Compliance analysis is optional - only run if explicitly triggered
  // useEffect(() => {
  //   if (user && vehicles.length >= 0) {
  //     const timer = setTimeout(() => {
  //       runComplianceAnalysis();
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [user, vehicles.length, runComplianceAnalysis]);

  const documentsToManage = [
    { type: "id_front", label: "Cartão de Cidadão (Frente)", hasExpiry: false, allowPhoto: true },
    { type: "id_back", label: "Cartão de Cidadão (Verso)", hasExpiry: false, allowPhoto: true },
    { type: "license", label: "Carta de Condução", hasExpiry: true, allowPhoto: true },
    { type: "insurance", label: "Seguro de Responsabilidade Civil", hasExpiry: true, allowPhoto: false },
  ];

  return (
    <div className="space-y-6">
      {/* Status de Conformidade - Análise Opcional */}
      {complianceStatus && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Status de Conformidade
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {complianceStatus.is_compliant ? (
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                ) : (
                  <ShieldX className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <p className={`font-bold text-lg ${complianceStatus.is_compliant ? 'text-green-600' : 'text-red-600'}`}>
                    {complianceStatus.is_compliant ? 'EM CONFORMIDADE' : 'NÃO CONFORME'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {complianceStatus.is_compliant 
                      ? 'Pode aceitar entregas normalmente' 
                      : 'Não pode aceitar entregas até resolver pendências'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${complianceStatus.compliance_score >= 80 ? 'text-green-600' : complianceStatus.compliance_score >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                  {complianceStatus.compliance_score}/100
                </div>
                <p className="text-xs text-gray-500">Score de Conformidade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Gestão de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Tirar Fotos dos Documentos</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Para o Cartão de Cidadão e Carta de Condução, pode usar a câmara do telemóvel para tirar fotos diretamente. 
                  Certifique-se que a foto está bem focada e que todos os dados são legíveis.
                </p>
              </div>
            </div>
          </div>
          
          {documentsToManage.map((doc) => (
            <DocumentItem
              key={doc.type}
              docType={doc.type}
              label={doc.label}
              user={user}
              onUpdate={onUpdate}
              hasExpiry={doc.hasExpiry}
              allowPhoto={doc.allowPhoto}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}