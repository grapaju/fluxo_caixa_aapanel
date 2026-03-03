import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building, Save, Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { DEFAULT_COMPANY_INFO } from '@/lib/pdfGenerator';

export function CompanySettings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [companyData, setCompanyData] = useState(DEFAULT_COMPANY_INFO);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar dados salvos do localStorage
    const savedData = localStorage.getItem('fluxocash_company_info');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setCompanyData(parsed);
    }

    const savedLogo = localStorage.getItem('fluxocash_company_logo');
    if (savedLogo) {
      setLogoPreview(savedLogo);
    }
  }, []);

  const handleInputChange = (field, value) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: 'Arquivo muito grande',
          description: 'Por favor, selecione uma imagem menor que 2MB',
          variant: 'destructive'
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    try {
      // Salvar dados da empresa
      localStorage.setItem('fluxocash_company_info', JSON.stringify(companyData));
      
      // Salvar logo se foi alterado
      if (logoPreview) {
        localStorage.setItem('fluxocash_company_logo', logoPreview);
      }

      toast({
        title: 'Configurações salvas!',
        description: 'Os dados da empresa foram atualizados com sucesso.'
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-slate-600">
          <Building className="w-4 h-4 mr-2" />
          Configurar Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect border-slate-700 max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building className="w-5 h-5" />
            Configurações da Empresa
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Logo da Empresa */}
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Logo da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoPreview && (
                <div className="flex justify-center">
                  <img 
                    src={logoPreview} 
                    alt="Logo da empresa" 
                    className="max-w-32 max-h-32 object-contain border border-slate-600 rounded"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-4 hover:border-slate-500 transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm text-slate-400">
                        Clique para selecionar uma logo (PNG, JPG - máx 2MB)
                      </p>
                    </div>
                  </div>
                </Label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados da Empresa */}
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={companyData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-slate-800 border-slate-600"
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={companyData.document}
                    onChange={(e) => handleInputChange('document', e.target.value)}
                    className="bg-slate-800 border-slate-600"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={companyData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="bg-slate-800 border-slate-600"
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade/Estado</Label>
                  <Input
                    value={companyData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="bg-slate-800 border-slate-600"
                    placeholder="Cidade - UF"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={companyData.cep}
                    onChange={(e) => handleInputChange('cep', e.target.value)}
                    className="bg-slate-800 border-slate-600"
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={companyData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-slate-800 border-slate-600"
                    placeholder="(11) 9999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    value={companyData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-slate-800 border-slate-600"
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={companyData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="bg-slate-800 border-slate-600"
                  placeholder="www.empresa.com.br"
                />
              </div>

              <div className="space-y-2">
                <Label>Chave PIX</Label>
                <Input
                  value={companyData.pixKey || ''}
                  onChange={(e) => handleInputChange('pixKey', e.target.value)}
                  className="bg-slate-800 border-slate-600"
                  placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                />
                <p className="text-xs text-slate-400">
                  A chave PIX será exibida nas faturas para facilitar o pagamento dos clientes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botões de Ação - Fixos na parte inferior */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm">
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            className="border-slate-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-500 to-purple-500"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para acessar os dados da empresa em outros componentes
export function useCompanyInfo() {
  const [companyInfo, setCompanyInfo] = useState(DEFAULT_COMPANY_INFO);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    const savedData = localStorage.getItem('fluxocash_company_info');
    if (savedData) {
      setCompanyInfo(JSON.parse(savedData));
    }

    const savedLogo = localStorage.getItem('fluxocash_company_logo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  return { companyInfo, logo };
}