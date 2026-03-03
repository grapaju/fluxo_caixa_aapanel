import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileCheck, Download, Building, CheckCircle } from 'lucide-react';
import { generatePDF, formatCurrency, formatDate, generateReceiptNumber, getCompanyInfo, getCompanyLogo } from '@/lib/pdfGenerator';
import { useToast } from '@/components/ui/use-toast';

export function ReceiptGenerator({ transaction, entity, category, onReceiptGenerated }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const receiptRef = useRef();
  const { toast } = useToast();

  const receiptData = {
    number: generateReceiptNumber(),
    paymentDate: new Date().toISOString().split('T')[0],
    transaction,
    entity,
    category,
    company: getCompanyInfo(),
    logo: getCompanyLogo()
  };

  const handleGeneratePDF = async () => {
    if (!receiptRef.current) return;

    setIsGenerating(true);
    try {
      const fileName = `Recibo_${receiptData.number}_${entity?.name || 'Cliente'}.pdf`;
      const result = await generatePDF(receiptRef.current, fileName);
      
      if (result.success) {
        toast({
          title: 'Recibo gerado com sucesso!',
          description: `PDF salvo como ${fileName}`
        });
        setIsDialogOpen(false);
        if (onReceiptGenerated) {
          onReceiptGenerated(receiptData);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Erro ao gerar recibo',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Só mostrar para transações pagas
  if (transaction.status !== 'paid') {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-slate-400 hover:text-green-400"
          title="Emitir recibo (somente transações pagas)"
        >
          <FileCheck className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Recibo - {receiptData.number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview do Recibo */}
          <div 
            ref={receiptRef}
            className="bg-white text-black p-8 rounded-lg"
            style={{ minHeight: '297mm', width: '210mm', fontSize: '12px' }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-green-500">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {receiptData.logo ? (
                    <img src={receiptData.logo} alt="Logo" className="w-12 h-12 object-contain" />
                  ) : (
                    <Building className="w-8 h-8 text-green-600" />
                  )}
                  <h1 className="text-2xl font-bold text-green-600">{receiptData.company.name}</h1>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>CNPJ: {receiptData.company.document}</p>
                  <p>{receiptData.company.address}</p>
                  <p>{receiptData.company.city} - {receiptData.company.cep}</p>
                  <p>Tel: {receiptData.company.phone} | E-mail: {receiptData.company.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <h2 className="text-3xl font-bold text-gray-800">RECIBO</h2>
                </div>
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-600">
                  <p className="font-semibold">Nº {receiptData.number}</p>
                  <p className="text-sm">Data do Pagamento: {formatDate(receiptData.paymentDate)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">PAGO</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Valor por Extenso */}
            <div className="mb-8">
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-green-800 text-center">
                  COMPROVANTE DE PAGAMENTO
                </h3>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 mb-2">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    Valor recebido em {formatDate(receiptData.paymentDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Dados do Pagador */}
            {entity && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">
                  DADOS DO {transaction.type === 'income' ? 'PAGADOR' : 'BENEFICIÁRIO'}
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
            )}

            {/* Detalhes do Pagamento */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">
                DETALHES DO PAGAMENTO
              </h3>
              <div className="overflow-hidden border border-gray-300 rounded">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left font-semibold">Descrição</th>
                      <th className="p-3 text-left font-semibold">Categoria</th>
                      <th className="p-3 text-center font-semibold">Data Transação</th>
                      <th className="p-3 text-right font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="p-3">{transaction.description}</td>
                      <td className="p-3">{category?.name}</td>
                      <td className="p-3 text-center">{formatDate(transaction.date)}</td>
                      <td className="p-3 text-right font-semibold text-green-600">
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Informações do Pagamento */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">
                FORMA DE PAGAMENTO
              </h3>
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Data do Pagamento:</strong> {formatDate(receiptData.paymentDate)}</p>
                    <p><strong>Valor Pago:</strong> {formatCurrency(transaction.amount)}</p>
                  </div>
                  <div>
                    <p><strong>Forma de Pagamento:</strong> {transaction.payment_method || 'Não informado'}</p>
                    <p><strong>Status:</strong> 
                      <span className="text-green-600 font-semibold ml-1">
                        ✓ RECEBIDO
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

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

            {/* Declaração */}
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <p className="text-sm text-center leading-relaxed">
                  <strong>DECLARO</strong> que recebi de <strong>{entity?.name || 'Cliente'}</strong> a quantia de{' '}
                  <strong>{formatCurrency(transaction.amount)}</strong> referente a{' '}
                  <strong>{transaction.description}</strong>, conforme discriminado acima.
                  Para clareza e como comprovante, firmo o presente recibo.
                </p>
              </div>
            </div>

            {/* Assinatura */}
            <div className="mb-8">
              <div className="flex justify-end">
                <div className="w-1/2 text-center">
                  <div className="border-t-2 border-gray-400 pt-2 mt-16">
                    <p className="font-semibold">{receiptData.company.name}</p>
                    <p className="text-sm text-gray-600">CNPJ: {receiptData.company.document}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {receiptData.company.city}, {formatDate(receiptData.paymentDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-300">
              <div className="text-center text-sm text-gray-600">
                <p className="mb-2">Este recibo foi gerado automaticamente pelo sistema FluxoCash</p>
                <p>{receiptData.company.website} | {receiptData.company.email}</p>
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
              className="bg-gradient-to-r from-green-500 to-emerald-500"
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