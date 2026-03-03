import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileCheck, Download, Building, CheckCircle } from 'lucide-react';
import { generatePDF, formatCurrency, formatDate, getCompanyInfo, getCompanyLogo } from '@/lib/pdfGenerator';
import { useToast } from '@/components/ui/use-toast';

export function ReceiptGroupGenerator({ invoice, entity, items, categoriesById }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const receiptRef = useRef();
  const { toast } = useToast();

  const company = getCompanyInfo();
  const logo = getCompanyLogo();

  const totalAmount = Number(invoice?.total_amount ?? items.reduce((sum, t) => sum + Number(t.amount || 0), 0));
  const paymentDate = invoice?.paid_at ? invoice.paid_at.slice(0, 10) : new Date().toISOString().split('T')[0];

  const handleGeneratePDF = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);

    try {
      const safeName = (entity?.name || 'Cliente').replace(/[\\/:*?"<>|]/g, '-');
      const receiptNumber = invoice?.receipt_number || invoice?.number;
      const fileName = `Recibo_${receiptNumber}_${safeName}.pdf`;
      const result = await generatePDF(receiptRef.current, fileName);
      if (!result.success) throw new Error(result.error);

      toast({ title: 'Recibo gerado com sucesso!', description: `PDF salvo como ${fileName}` });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Erro ao gerar recibo', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!invoice || invoice.status !== 'paid' || !entity) return null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-slate-400 hover:text-green-400"
          title="Emitir recibo da fatura"
        >
          <FileCheck className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Recibo - {invoice.receipt_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={receiptRef}
            className="bg-white text-black p-8 rounded-lg"
            style={{ minHeight: '297mm', width: '210mm', fontSize: '12px' }}
          >
            <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-green-500">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
                  ) : (
                    <Building className="w-8 h-8 text-green-600" />
                  )}
                  <h1 className="text-2xl font-bold text-green-600">{company.name}</h1>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>CNPJ: {company.document}</p>
                  <p>{company.address}</p>
                  <p>{company.city} - {company.cep}</p>
                  <p>Tel: {company.phone} | E-mail: {company.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <h2 className="text-3xl font-bold text-gray-800">RECIBO</h2>
                </div>
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-600">
                  <p className="font-semibold">Nº {invoice.receipt_number}</p>
                  <p className="text-sm">Data do Pagamento: {formatDate(paymentDate)}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">PAGO</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-green-800 text-center">COMPROVANTE DE PAGAMENTO</h3>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 mb-2">{formatCurrency(totalAmount)}</p>
                  <p className="text-sm text-gray-600 italic">Valor recebido em {formatDate(paymentDate)}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">DADOS DO PAGADOR</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">{entity.name}</p>
                    <p className="text-sm text-gray-600">Tipo: {entity.type === 'customer' ? 'Cliente' : 'Fornecedor'}</p>
                    {entity.document && <p className="text-sm text-gray-600">CPF/CNPJ: {entity.document}</p>}
                  </div>
                  <div>
                    {entity.email && <p className="text-sm text-gray-600">E-mail: {entity.email}</p>}
                    {entity.phone && <p className="text-sm text-gray-600">Telefone: {entity.phone}</p>}
                    {entity.address && <p className="text-sm text-gray-600">Endereço: {entity.address}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">ITENS PAGOS</h3>
              <div className="overflow-hidden border border-gray-300 rounded">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left font-semibold">Descrição</th>
                      <th className="p-3 text-left font-semibold">Categoria</th>
                      <th className="p-3 text-center font-semibold">Data</th>
                      <th className="p-3 text-right font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t) => {
                      const category = categoriesById?.[t.category_id];
                      return (
                        <tr key={t.id} className="border-t border-gray-200">
                          <td className="p-3">{t.description}</td>
                          <td className="p-3">{category?.name || '-'}</td>
                          <td className="p-3 text-center">{formatDate(t.date)}</td>
                          <td className="p-3 text-right font-semibold text-green-600">{formatCurrency(t.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">FORMA DE PAGAMENTO</h3>
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Data do Pagamento:</strong> {formatDate(paymentDate)}</p>
                    <p><strong>Valor Pago:</strong> {formatCurrency(totalAmount)}</p>
                  </div>
                  <div>
                    <p><strong>Forma de Pagamento:</strong> {invoice.payment_method || 'Não informado'}</p>
                    <p><strong>Status:</strong> <span className="text-green-600 font-semibold ml-1">✓ RECEBIDO</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <p className="text-sm text-center leading-relaxed">
                  <strong>DECLARO</strong> que recebi de <strong>{entity.name}</strong> a quantia de{' '}
                  <strong>{formatCurrency(totalAmount)}</strong> referente à fatura <strong>{invoice.number}</strong>,
                  conforme itens discriminados acima.
                </p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-end">
                <div className="w-1/2 text-center">
                  <div className="border-t-2 border-gray-400 pt-2 mt-16">
                    <p className="font-semibold">{company.name}</p>
                    <p className="text-sm text-gray-600">CNPJ: {company.document}</p>
                    <p className="text-xs text-gray-500 mt-2">{company.city}, {formatDate(paymentDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center text-gray-500 text-xs mt-8 pt-4 border-t border-gray-200">
              <p className="mb-2">Este recibo foi gerado automaticamente pelo sistema FluxoCash</p>
              {company.website && <p>Visite: {company.website}</p>}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button onClick={handleGeneratePDF} disabled={isGenerating} className="bg-gradient-to-r from-emerald-500 to-blue-500">
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Gerando...' : 'Baixar PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
