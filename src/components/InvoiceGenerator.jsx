import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Building } from 'lucide-react';
import { generatePDF, formatCurrency, formatDate, generateInvoiceNumber, getCompanyInfo, getCompanyLogo, generatePixQRCode } from '@/lib/pdfGenerator';
import { useToast } from '@/components/ui/use-toast';

export function InvoiceGenerator({ transaction, entity, category }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pixQRCode, setPixQRCode] = useState(null);
  const invoiceRef = useRef();
  const { toast } = useToast();

  const invoiceData = {
    number: generateInvoiceNumber(),
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
    transaction,
    entity,
    category,
    company: getCompanyInfo(),
    logo: getCompanyLogo()
  };

  // Gerar QR Code PIX quando necessário
  React.useEffect(() => {
    const generateQRCode = async () => {
      if (isDialogOpen && invoiceData.company.pixKey) {
        try {
          const qrCode = await generatePixQRCode(
            invoiceData.company.pixKey,
            invoiceData.company.name,
            invoiceData.company.city.split(' - ')[0], // Apenas a cidade
            transaction.amount,
            `Fatura ${invoiceData.number}`
          );
          setPixQRCode(qrCode);
        } catch (error) {
          console.error('Erro ao gerar QR Code:', error);
        }
      }
    };

    generateQRCode();
  }, [isDialogOpen, invoiceData.company.pixKey, transaction.amount, invoiceData.number]);

  const handleGeneratePDF = async () => {
    if (!invoiceRef.current) return;

    setIsGenerating(true);
    try {
      const fileName = `Fatura_${invoiceData.number}_${entity?.name || 'Cliente'}.pdf`;
      const result = await generatePDF(invoiceRef.current, fileName);
      
      if (result.success) {
        toast({
          title: 'Fatura gerada com sucesso!',
          description: `PDF salvo como ${fileName}`
        });
        setIsDialogOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Erro ao gerar fatura',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Só mostrar para receitas pendentes com cliente vinculado
  if (transaction.type !== 'income' || transaction.status === 'paid' || !entity) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-slate-400 hover:text-purple-400"
          title="Emitir fatura (somente receitas pendentes com cliente)"
        >
          <FileText className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Fatura - {invoiceData.number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview da Fatura */}
          <div 
            ref={invoiceRef}
            className="bg-white text-black p-8 rounded-lg"
            style={{ minHeight: '297mm', width: '210mm', fontSize: '12px' }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-300">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {invoiceData.logo ? (
                    <img src={invoiceData.logo} alt="Logo" className="w-12 h-12 object-contain" />
                  ) : (
                    <Building className="w-8 h-8 text-blue-600" />
                  )}
                  <h1 className="text-2xl font-bold text-blue-600">{invoiceData.company.name}</h1>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>CNPJ: {invoiceData.company.document}</p>
                  <p>{invoiceData.company.address}</p>
                  <p>{invoiceData.company.city} - {invoiceData.company.cep}</p>
                  <p>Tel: {invoiceData.company.phone} | E-mail: {invoiceData.company.email}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">FATURA</h2>
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-600">
                  <p className="font-semibold">Nº {invoiceData.number}</p>
                  <p className="text-sm">Emissão: {formatDate(invoiceData.issueDate)}</p>
                  <p className="text-sm">Vencimento: {formatDate(invoiceData.dueDate)}</p>
                </div>
              </div>
            </div>

            {/* Dados do Cliente */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">
                DADOS DO CLIENTE
              </h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">{entity.name}</p>
                    <p className="text-sm text-gray-600">
                      Tipo: {entity.type === 'customer' ? 'Cliente' : 'Fornecedor'}
                    </p>
                    {entity.document && (
                      <p className="text-sm text-gray-600">
                        {entity.type === 'customer' ? 'CPF/CNPJ' : 'CNPJ'}: {entity.document}
                      </p>
                    )}
                  </div>
                  <div>
                    {entity.email && <p className="text-sm text-gray-600">E-mail: {entity.email}</p>}
                    {entity.phone && <p className="text-sm text-gray-600">Telefone: {entity.phone}</p>}
                    {entity.address && <p className="text-sm text-gray-600">Endereço: {entity.address}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Itens/Serviços */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">
                DISCRIMINAÇÃO DOS SERVIÇOS
              </h3>
              <div className="overflow-hidden border border-gray-300 rounded">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left font-semibold">Descrição</th>
                      <th className="p-3 text-left font-semibold">Categoria</th>
                      <th className="p-3 text-center font-semibold">Qtd</th>
                      <th className="p-3 text-right font-semibold">Valor Unit.</th>
                      <th className="p-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="p-3">{transaction.description}</td>
                      <td className="p-3">{category?.name}</td>
                      <td className="p-3 text-center">1</td>
                      <td className="p-3 text-right">{formatCurrency(transaction.amount)}</td>
                      <td className="p-3 text-right font-semibold">{formatCurrency(transaction.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totais */}
            <div className="mb-8">
              <div className="flex justify-end">
                <div className="w-1/3">
                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="flex justify-between py-2">
                      <span className="font-semibold">Subtotal:</span>
                      <span>{formatCurrency(transaction.amount)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t border-gray-300">
                      <span className="font-bold text-lg">TOTAL GERAL:</span>
                      <span className="font-bold text-lg text-blue-600">{formatCurrency(transaction.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações de Pagamento */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">
                INFORMAÇÕES DE PAGAMENTO
              </h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Vencimento:</strong> {formatDate(invoiceData.dueDate)}</p>
                    <p><strong>Valor:</strong> {formatCurrency(transaction.amount)}</p>
                  </div>
                  <div>
                    <p><strong>Forma de Pagamento:</strong> {transaction.payment_method || 'A definir'}</p>
                    <p><strong>Status:</strong> <span className="text-red-600 font-semibold">PENDENTE</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* PIX */}
            {invoiceData.company.pixKey && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">
                  PAGAMENTO VIA PIX
                </h3>
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-3">Dados para Pagamento:</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Favorecido:</strong> {invoiceData.company.name}
                        </div>
                        <div>
                          <strong>CNPJ:</strong> {invoiceData.company.document}
                        </div>
                        <div>
                          <strong>Chave PIX:</strong> 
                          <div className="bg-white p-2 rounded border mt-1 font-mono text-xs break-all">
                            {invoiceData.company.pixKey}
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-100 rounded border-l-4 border-blue-500">
                          <p className="text-xs text-blue-800">
                            <strong>Valor:</strong> {formatCurrency(transaction.amount)}<br/>
                            <strong>Vencimento:</strong> {formatDate(invoiceData.dueDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold text-blue-800 mb-3">QR Code PIX:</h4>
                      {pixQRCode ? (
                        <div className="inline-block p-4 bg-white rounded border">
                          <img src={pixQRCode} alt="QR Code PIX" className="w-32 h-32 mx-auto" />
                          <p className="text-xs text-gray-600 mt-2">
                            Escaneie com o app do seu banco
                          </p>
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded border mx-auto flex items-center justify-center">
                          <p className="text-xs text-gray-500 text-center">
                            Carregando<br/>QR Code...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-800">
                      <strong>Importante:</strong> Após efetuar o pagamento, envie o comprovante para {invoiceData.company.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {transaction.notes && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">
                  OBSERVAÇÕES
                </h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm">{transaction.notes}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-300">
              <div className="text-center text-sm text-gray-600">
                <p className="mb-2">Esta fatura foi gerada automaticamente pelo sistema FluxoCash</p>
                <p>{invoiceData.company.website} | {invoiceData.company.email}</p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-500 to-blue-500"
            >
              {isGenerating ? (
                <>Gerando...</>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}