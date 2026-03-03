import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Building } from 'lucide-react';
import { generatePDF, formatCurrency, formatDate, getCompanyInfo, getCompanyLogo, generatePixQRCode } from '@/lib/pdfGenerator';
import { useToast } from '@/components/ui/use-toast';

export function InvoiceGroupGenerator({ invoice, entity, items, categoriesById }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pixQRCode, setPixQRCode] = useState(null);
  const invoiceRef = useRef();
  const { toast } = useToast();

  const company = getCompanyInfo();
  const logo = getCompanyLogo();

  const totalAmount = Number(invoice?.total_amount ?? items.reduce((sum, t) => sum + Number(t.amount || 0), 0));

  React.useEffect(() => {
    const run = async () => {
      if (!isDialogOpen) return;
      if (!company.pixKey) return;

      try {
        const qrCode = await generatePixQRCode(
          company.pixKey,
          company.name,
          (company.city || '').split(' - ')[0],
          totalAmount,
          `Fatura ${invoice.number}`
        );
        setPixQRCode(qrCode);
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      }
    };

    run();
  }, [isDialogOpen, company.pixKey, company.name, company.city, totalAmount, invoice.number]);

  const handleGeneratePDF = async () => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);

    try {
      const safeName = (entity?.name || 'Cliente').replace(/[\\/:*?"<>|]/g, '-');
      const fileName = `Fatura_${invoice.number}_${safeName}.pdf`;
      const result = await generatePDF(invoiceRef.current, fileName);
      if (!result.success) throw new Error(result.error);

      toast({ title: 'Fatura gerada com sucesso!', description: `PDF salvo como ${fileName}` });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Erro ao gerar fatura', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!invoice || !entity) return null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-slate-400 hover:text-purple-400"
          title="Abrir fatura"
        >
          <FileText className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-effect border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Fatura - {invoice.number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={invoiceRef}
            className="bg-white text-black p-8 rounded-lg"
            style={{ minHeight: '297mm', width: '210mm', fontSize: '12px' }}
          >
            <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-300">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {logo ? (
                    <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
                  ) : (
                    <Building className="w-8 h-8 text-blue-600" />
                  )}
                  <h1 className="text-2xl font-bold text-blue-600">{company.name}</h1>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>CNPJ: {company.document}</p>
                  <p>{company.address}</p>
                  <p>{company.city} - {company.cep}</p>
                  <p>Tel: {company.phone} | E-mail: {company.email}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">FATURA</h2>
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-600">
                  <p className="font-semibold">Nº {invoice.number}</p>
                  <p className="text-sm">Emissão: {formatDate(invoice.issue_date)}</p>
                  {invoice.due_date && <p className="text-sm">Vencimento: {formatDate(invoice.due_date)}</p>}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">DADOS DO CLIENTE</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">{entity.name}</p>
                    <p className="text-sm text-gray-600">Tipo: {entity.type === 'customer' ? 'Cliente' : 'Fornecedor'}</p>
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

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">ITENS / SERVIÇOS</h3>
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
                          <td className="p-3 text-right font-semibold">{formatCurrency(t.amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-end">
                <div className="w-1/3">
                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="flex justify-between py-2">
                      <span className="font-semibold">Itens:</span>
                      <span>{items.length}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t border-gray-300">
                      <span className="font-bold text-lg">TOTAL GERAL:</span>
                      <span className="font-bold text-lg text-blue-600">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">INFORMAÇÕES DE PAGAMENTO</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    {invoice.due_date && <p><strong>Vencimento:</strong> {formatDate(invoice.due_date)}</p>}
                    <p><strong>Valor:</strong> {formatCurrency(totalAmount)}</p>
                  </div>
                  <div>
                    <p><strong>Forma de Pagamento:</strong> {invoice.payment_method || 'A definir'}</p>
                    <p><strong>Status:</strong> <span className="text-red-600 font-semibold">{invoice.status === 'paid' ? 'PAGA' : 'PENDENTE'}</span></p>
                  </div>
                </div>
              </div>
            </div>

            {company.pixKey && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">PAGAMENTO VIA PIX</h3>
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-blue-800 mb-3">Dados para Pagamento:</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Favorecido:</strong> {company.name}</div>
                        <div><strong>CNPJ:</strong> {company.document}</div>
                        <div>
                          <strong>Chave PIX:</strong>
                          <div className="bg-white p-2 rounded border mt-1 font-mono text-xs break-all">{company.pixKey}</div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-100 rounded border-l-4 border-blue-500">
                          <p className="text-xs text-blue-800">
                            <strong>Valor:</strong> {formatCurrency(totalAmount)}<br />
                            <strong>Referência:</strong> Fatura {invoice.number}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <h4 className="font-semibold text-blue-800 mb-3">QR Code PIX</h4>
                      {pixQRCode ? (
                        <img src={pixQRCode} alt="QR Code PIX" className="w-48 h-48 border border-blue-200 rounded" />
                      ) : (
                        <div className="w-48 h-48 border border-blue-200 rounded bg-white flex items-center justify-center">
                          <span className="text-xs text-gray-500">Gerando QR Code...</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-2 text-center">Aponte a câmera do seu app bancário</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {invoice.notes && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-200 pb-2">OBSERVAÇÕES</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              </div>
            )}

            <div className="text-center text-gray-500 text-xs mt-8 pt-4 border-t border-gray-200">
              <p className="mb-2">Esta fatura foi gerada automaticamente pelo sistema FluxoCash</p>
              {company.website && <p>Visite: {company.website}</p>}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button onClick={handleGeneratePDF} disabled={isGenerating} className="bg-gradient-to-r from-purple-500 to-blue-500">
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Gerando...' : 'Baixar PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
