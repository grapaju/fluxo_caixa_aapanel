import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search, Filter, Edit, Trash2, TrendingUp, TrendingDown, Check, X, FileText, FileCheck, Repeat } from 'lucide-react';
import { InvoiceGenerator } from '@/components/InvoiceGenerator';
import { ReceiptGenerator } from '@/components/ReceiptGenerator';
import { InvoiceGroupGenerator } from '@/components/InvoiceGroupGenerator';
import { ReceiptGroupGenerator } from '@/components/ReceiptGroupGenerator';
import { CompanySettings } from '@/components/CompanySettings';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

function Transactions() {
  const { transactions, categories, entities, invoices, invoiceItems, invoicePayments, paymentMethods, periods, addTransaction, updateTransaction, deleteTransaction, createInvoice, markInvoicePaid, registerInvoicePayment } = useData();
  const { toast } = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceEntityId, setInvoiceEntityId] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [selectedInvoiceTransactionIds, setSelectedInvoiceTransactionIds] = useState([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [formData, setFormData] = useState({
    description: '', amount: '', date: new Date().toISOString().split('T')[0],
    category_id: '', type: 'expense', payment_method: '', status: 'pending',
    notes: '', entity_id: '', period: 'Único'
  });

  const categoriesById = useMemo(() => {
    const map = {};
    for (const c of categories) map[c.id] = c;
    return map;
  }, [categories]);

  const pendingInvoiceIds = useMemo(() => (invoices || []).filter(i => i.status === 'pending').map(i => i.id), [invoices]);
  const blockedTransactionIds = useMemo(() => {
    const pendingSet = new Set(pendingInvoiceIds);
    const blocked = new Set();
    for (const ii of (invoiceItems || [])) {
      if (pendingSet.has(ii.invoice_id)) blocked.add(ii.transaction_id);
    }
    return blocked;
  }, [invoiceItems, pendingInvoiceIds]);

  const eligibleInvoiceTransactions = useMemo(() => {
    if (!invoiceEntityId) return [];
    return (transactions || [])
      .filter(t => t.type === 'income' && t.status === 'pending' && t.entity_id === invoiceEntityId)
      .filter(t => !blockedTransactionIds.has(t.id))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [transactions, invoiceEntityId, blockedTransactionIds]);

  const invoiceEntityOptions = useMemo(() => {
    const eligibleEntityIds = new Set(
      (transactions || [])
        .filter(t => t.type === 'income' && t.status === 'pending' && t.entity_id)
        .filter(t => !blockedTransactionIds.has(t.id))
        .map(t => t.entity_id)
    );
    return (entities || [])
      .filter(e => eligibleEntityIds.has(e.id))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
  }, [transactions, entities, blockedTransactionIds]);

  const selectedInvoiceTotal = useMemo(() => {
    const selectedSet = new Set(selectedInvoiceTransactionIds);
    return eligibleInvoiceTransactions
      .filter(t => selectedSet.has(t.id))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [eligibleInvoiceTransactions, selectedInvoiceTransactionIds]);

  const getPendingStatusKey = (dateValue) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(`${dateValue}T00:00:00`);
    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'due_soon';
    return 'open';
  };

  const getStatusMeta = (transaction) => {
    if (transaction.status === 'paid') {
      return {
        key: 'paid',
        label: 'Pago',
        className: 'bg-emerald-500/20 text-emerald-400'
      };
    }

    const pendingKey = getPendingStatusKey(transaction.date);
    if (pendingKey === 'overdue') {
      return {
        key: 'overdue',
        label: 'Atrasado',
        className: 'bg-red-500/20 text-red-400'
      };
    }

    if (pendingKey === 'due_soon') {
      return {
        key: 'due_soon',
        label: 'Próximo ao vencimento',
        className: 'bg-orange-500/20 text-orange-300'
      };
    }

    return {
      key: 'open',
      label: 'Aberto',
      className: 'bg-amber-500/20 text-amber-400'
    };
  };

  const filteredTransactions = transactions
    .filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      const statusKey = t.status === 'paid' ? 'paid' : getPendingStatusKey(t.date);
      const matchesStatus = filterStatus === 'all' || statusKey === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const getNextDate = (currentDate, period) => {
    const date = new Date(currentDate + 'T00:00:00');
    switch (period) {
      case 'Mensal': date.setMonth(date.getMonth() + 1); break;
      case 'Bimestral': date.setMonth(date.getMonth() + 2); break;
      case 'Trimestral': date.setMonth(date.getMonth() + 3); break;
      default: return null;
    }
    return date.toISOString().split('T')[0];
  };

  const handleToggleStatus = async (transaction) => {
    const newStatus = transaction.status === 'paid' ? 'pending' : 'paid';
    const isMarkingAsPaid = newStatus === 'paid';
    
    const confirmed = await confirm({
      title: isMarkingAsPaid ? 'Marcar como Pago' : 'Marcar como Pendente',
      description: isMarkingAsPaid 
        ? `Confirmar o pagamento de "${transaction.description}"? ${transaction.period !== 'Único' ? 'Uma nova transação recorrente será criada automaticamente.' : ''}`
        : `Reverter o pagamento de "${transaction.description}" para pendente?`,
      confirmText: isMarkingAsPaid ? 'Confirmar Pagamento' : 'Marcar Pendente',
      cancelText: 'Cancelar',
      variant: isMarkingAsPaid ? 'success' : 'warning'
    });

    if (confirmed) {
      await updateTransaction(transaction.id, { status: newStatus });

      if (newStatus === 'paid' && transaction.period !== 'Único') {
        const nextDate = getNextDate(transaction.date, transaction.period);
        if (nextDate) {
          const newTransaction = { ...transaction };
          delete newTransaction.id;
          delete newTransaction.created_at;
          delete newTransaction.updated_at;
          newTransaction.date = nextDate;
          newTransaction.status = 'pending';
          await addTransaction(newTransaction);
          toast({ title: 'Próxima transação recorrente criada!' });
        }
      }

      toast({
        title: isMarkingAsPaid ? 'Pagamento confirmado!' : 'Status alterado',
        description: isMarkingAsPaid 
          ? 'Transação marcada como paga com sucesso.'
          : 'Transação marcada como pendente.'
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category_id) {
      toast({ title: "Erro", description: "Selecione uma categoria", variant: "destructive" });
      return;
    }
    
    // Converter valor com máscara para número (resiliente a espaços especiais do locale)
    const rawAmount = String(formData.amount ?? '').trim();
    const normalizedAmount = rawAmount
      .replace(/\s/g, '')
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.');
    const amount = Number(normalizedAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Erro", description: "Informe um valor válido maior que zero", variant: "destructive" });
      return;
    }
    
    const transactionData = { ...formData, amount, entity_id: formData.entity_id || null };
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      description: '', amount: '', date: new Date().toISOString().split('T')[0],
      category_id: '', type: 'expense', payment_method: '', status: 'pending',
      notes: '', entity_id: '', period: 'Único'
    });
    setEditingTransaction(null);
  };

  const handleEdit = (transaction) => {
    // Formatar valor para máscara de moeda
    const formatToMask = (value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return 'R$ 0,00';
      return numValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    };
    
    setFormData({
      description: transaction.description, 
      amount: formatToMask(transaction.amount), 
      date: transaction.date,
      category_id: transaction.category_id, 
      type: transaction.type, 
      payment_method: transaction.payment_method,
      status: transaction.status, 
      notes: transaction.notes || '', 
      entity_id: transaction.entity_id || '',
      period: transaction.period || 'Único'
    });
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = async (transaction) => {
    const confirmed = await confirm({
      title: 'Excluir Transação',
      description: `Tem certeza que deseja excluir a transação "${transaction.description}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive'
    });

    if (confirmed) {
      deleteTransaction(transaction.id);
      toast({
        title: 'Transação excluída',
        description: 'A transação foi removida com sucesso.'
      });
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const showToast = (feature) => toast({ title: `🚧 ${feature} não implementado!`, description: "Você pode solicitar esta funcionalidade no próximo prompt! 🚀" });

  const openPaymentDialog = (invoice, balance) => {
    setSelectedInvoiceForPayment({ ...invoice, balance });
    setPaymentAmount(String(balance.toFixed(2)));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod(invoice.payment_method || '');
    setPaymentNotes('');
    setIsPaymentDialogOpen(true);
  };

  const handleRegisterInvoicePayment = async (event) => {
    event.preventDefault();
    if (!selectedInvoiceForPayment) return;

    const amount = Number(String(paymentAmount || '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: 'Erro', description: 'Informe um valor de pagamento válido.', variant: 'destructive' });
      return;
    }

    if (amount > selectedInvoiceForPayment.balance) {
      toast({
        title: 'Erro',
        description: `O valor não pode ser maior que o saldo (${formatCurrency(selectedInvoiceForPayment.balance)}).`,
        variant: 'destructive'
      });
      return;
    }

    const result = await registerInvoicePayment({
      invoiceId: selectedInvoiceForPayment.id,
      amountPaid: amount,
      paymentDate,
      paymentMethod,
      notes: paymentNotes,
    });

    if (result?.payment) {
      setIsPaymentDialogOpen(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Transações - FluxoCash</title>
        <meta name="description" content="Gerencie suas receitas e despesas, adicione novas transações e controle o status de pagamento." />
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Transações</h1>
            <p className="text-slate-400 mt-1">Gerencie suas receitas e despesas</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <CompanySettings />

            <Dialog open={isInvoiceDialogOpen} onOpenChange={(open) => {
              setIsInvoiceDialogOpen(open);
              if (open) {
                setInvoiceEntityId('');
                setInvoiceDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                setInvoicePaymentMethod('');
                setInvoiceNotes('');
                setSelectedInvoiceTransactionIds([]);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-600" title="Criar uma fatura com múltiplas transações do mesmo cliente">
                  <FileText className="w-4 h-4 mr-2" /> Criar Fatura
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-slate-700 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Criar Fatura (Agrupada)</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente</Label>
                      <Select value={invoiceEntityId} onValueChange={(v) => {
                        setInvoiceEntityId(v);
                        const defaults = (transactions || [])
                          .filter(t => t.type === 'income' && t.status === 'pending' && t.entity_id === v)
                          .filter(t => !blockedTransactionIds.has(t.id))
                          .map(t => t.id);
                        setSelectedInvoiceTransactionIds(defaults);
                      }}>
                        <SelectTrigger className="bg-slate-800 border-slate-600">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {invoiceEntityOptions.length > 0 ? (
                            invoiceEntityOptions.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)
                          ) : (
                            <div className="p-2 text-sm text-slate-400">Nenhuma entidade com receitas pendentes elegíveis.</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Vencimento</Label>
                      <Input type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} className="bg-slate-800 border-slate-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Forma de Pagamento (opcional)</Label>
                      <Select value={invoicePaymentMethod} onValueChange={setInvoicePaymentMethod}>
                        <SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="A definir" /></SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Observações (opcional)</Label>
                      <Input value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} className="bg-slate-800 border-slate-600" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Itens (receitas pendentes deste cliente)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-slate-300"
                        onClick={() => setSelectedInvoiceTransactionIds(eligibleInvoiceTransactions.map(t => t.id))}
                        disabled={!invoiceEntityId || eligibleInvoiceTransactions.length === 0}
                      >
                        Selecionar todos
                      </Button>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-3 max-h-56 overflow-y-auto">
                      {invoiceEntityId ? (
                        eligibleInvoiceTransactions.length > 0 ? (
                          <div className="space-y-2">
                            {eligibleInvoiceTransactions.map((t) => {
                              const checked = selectedInvoiceTransactionIds.includes(t.id);
                              return (
                                <label key={t.id} className="flex items-center justify-between gap-3 p-2 rounded hover:bg-slate-800/40">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedInvoiceTransactionIds(prev => [...prev, t.id]);
                                        } else {
                                          setSelectedInvoiceTransactionIds(prev => prev.filter(id => id !== t.id));
                                        }
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <div>
                                      <div className="text-sm text-white">{t.description}</div>
                                      <div className="text-xs text-slate-400">
                                        {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-sm font-semibold text-emerald-400">{formatCurrency(t.amount)}</div>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400">Nenhuma receita pendente elegível para este cliente (ou já está em uma fatura pendente).</div>
                        )
                      ) : (
                        <div className="text-sm text-slate-400">Selecione um cliente para listar as receitas pendentes.</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-300">
                      Selecionadas: <span className="font-semibold">{selectedInvoiceTransactionIds.length}</span>
                    </div>
                    <div className="text-sm text-slate-300">
                      Total: <span className="font-semibold text-white">{formatCurrency(selectedInvoiceTotal)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-600"
                      onClick={() => setIsInvoiceDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      className="bg-gradient-to-r from-purple-500 to-blue-500"
                      disabled={!invoiceEntityId || selectedInvoiceTransactionIds.length === 0}
                      onClick={async () => {
                        const invoice = await createInvoice({
                          entityId: invoiceEntityId,
                          transactionIds: selectedInvoiceTransactionIds,
                          dueDate: invoiceDueDate,
                          paymentMethod: invoicePaymentMethod || null,
                          notes: invoiceNotes || null,
                        });
                        if (invoice) setIsInvoiceDialogOpen(false);
                      }}
                    >
                      Criar Fatura
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-blue-500" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" /> Nova Transação
                </Button>
              </DialogTrigger>
            <DialogContent className="glass-effect border-slate-700 max-w-lg">
              <DialogHeader><DialogTitle className="text-white">{editingTransaction ? 'Editar' : 'Nova'} Transação</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required className="bg-slate-800 border-slate-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input 
                      type="text" 
                      value={formData.amount} 
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value) {
                          value = (parseInt(value) / 100).toFixed(2);
                          value = value.replace('.', ',');
                          value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                          value = 'R$ ' + value;
                        }
                        setFormData({ ...formData, amount: value });
                      }} 
                      placeholder="R$ 0,00"
                      required 
                      className="bg-slate-800 border-slate-600" 
                    />
                  </div>
                  <div className="space-y-2"><Label>Data</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="bg-slate-800 border-slate-600" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Tipo</Label><Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v, category_id: '' })}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Receita</SelectItem><SelectItem value="expense">Despesa</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Categoria</Label><Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{categories.filter(c => c.type === formData.type).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Cliente/Fornecedor</Label><Select value={formData.entity_id} onValueChange={(v) => setFormData({ ...formData, entity_id: v })}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Nenhum" /></SelectTrigger><SelectContent>{entities.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Forma de Pagamento</Label><Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pendente</SelectItem><SelectItem value="paid">Pago</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Período</Label><Select value={formData.period} onValueChange={(v) => setFormData({ ...formData, period: v })}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger><SelectContent>{periods.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>Anotações</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-slate-800 border-slate-600" /></div>
                <div className="flex space-x-2 pt-4"><Button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500">{editingTransaction ? 'Atualizar' : 'Adicionar'}</Button><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600">Cancelar</Button></div>
              </form>
            </DialogContent>
          </Dialog>

            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogContent className="glass-effect border-slate-700 max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-white">Registrar Pagamento da Fatura</DialogTitle>
                </DialogHeader>

                <form className="space-y-4" onSubmit={handleRegisterInvoicePayment}>
                  <div className="text-sm text-slate-300">
                    <div>Fatura: <strong>{selectedInvoiceForPayment?.number}</strong></div>
                    <div>Saldo em aberto: <strong>{formatCurrency(Number(selectedInvoiceForPayment?.balance || 0))}</strong></div>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor recebido</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={selectedInvoiceForPayment?.balance || undefined}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="bg-slate-800 border-slate-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data do pagamento</Label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="bg-slate-800 border-slate-600"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Forma de pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações (opcional)</Label>
                    <Input
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="outline" className="border-slate-600" onClick={() => setIsPaymentDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-blue-500">
                      Registrar Pagamento
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="glass-effect border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-600" /></div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-32 bg-slate-800 border-slate-600"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="income">Receitas</SelectItem><SelectItem value="expense">Despesas</SelectItem></SelectContent></Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-56 bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="paid">Pago</SelectItem><SelectItem value="open">Aberto</SelectItem><SelectItem value="due_soon">Próximo ao vencimento</SelectItem><SelectItem value="overdue">Atrasado</SelectItem></SelectContent></Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            {(invoices || []).length > 0 ? (
              <div className="space-y-3">
                {[...invoices]
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((inv) => {
                    const entity = entities.find(e => e.id === inv.entity_id);
                    const invItemIds = (invoiceItems || []).filter(ii => ii.invoice_id === inv.id).map(ii => ii.transaction_id);
                    const invTransactions = (transactions || []).filter(t => invItemIds.includes(t.id)).sort((a, b) => new Date(a.date) - new Date(b.date));
                    const invPayments = (invoicePayments || [])
                      .filter(p => p.invoice_id === inv.id)
                      .sort((a, b) => new Date(b.payment_date + 'T00:00:00') - new Date(a.payment_date + 'T00:00:00'));
                    const latestPayment = invPayments[0] || null;
                    const total = Number(inv.total_amount ?? invTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0));
                    const amountPaid = Number(inv.amount_paid ?? invPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0));
                    const balanceDue = Number(inv.balance_due ?? Math.max(total - amountPaid, 0));

                    const statusClass = inv.status === 'paid'
                      ? 'bg-emerald-900/20 border-l-emerald-500'
                      : inv.status === 'partial'
                        ? 'bg-amber-900/20 border-l-amber-500'
                        : 'bg-slate-800/50 border-l-purple-500';

                    const statusBadgeClass = inv.status === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : inv.status === 'partial'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-purple-500/20 text-purple-300';

                    const statusLabel = inv.status === 'paid' ? 'Paga' : inv.status === 'partial' ? 'Parcial' : 'Pendente';

                    return (
                      <div key={inv.id} className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${statusClass}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-white">{inv.number || 'Fatura'}</div>
                            <Badge
                              variant={inv.status === 'paid' ? 'default' : 'secondary'}
                              className={statusBadgeClass}
                            >
                              {statusLabel}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {entity ? entity.name : 'Entidade não encontrada'}
                            <span className="text-slate-500"> • </span>
                            Itens: {invTransactions.length}
                            {inv.due_date && (
                              <>
                                <span className="text-slate-500"> • </span>
                                Venc.: {new Date(inv.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold text-white">{formatCurrency(total)}</div>
                            <div className="text-xs text-slate-400">Recebido: {formatCurrency(amountPaid)}</div>
                            <div className="text-xs text-amber-300">Saldo: {formatCurrency(balanceDue)}</div>
                            {latestPayment?.receipt_number && (
                              <div className="text-xs text-emerald-400">Últ. recibo: {latestPayment.receipt_number}</div>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            <InvoiceGroupGenerator
                              invoice={inv}
                              entity={entity}
                              items={invTransactions}
                              categoriesById={categoriesById}
                            />
                            <ReceiptGroupGenerator
                              invoice={inv}
                              entity={entity}
                              items={invTransactions}
                              categoriesById={categoriesById}
                              payment={inv.status === 'paid' ? null : latestPayment}
                            />

                            {inv.status !== 'paid' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-slate-400 hover:text-blue-400"
                                title="Registrar pagamento parcial"
                                onClick={() => openPaymentDialog(inv, balanceDue)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}

                            {inv.status !== 'paid' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-slate-400 hover:text-emerald-400"
                                title="Marcar fatura como paga"
                                onClick={async () => {
                                  const confirmed = await confirm({
                                    title: 'Marcar Fatura como Paga',
                                    description: `Confirmar o pagamento da fatura "${inv.number}" no valor de ${formatCurrency(total)}? As transações vinculadas serão marcadas como pagas.`,
                                    confirmText: 'Confirmar Pagamento',
                                    cancelText: 'Cancelar',
                                    variant: 'success'
                                  });
                                  if (!confirmed) return;
                                  await markInvoicePaid({ invoiceId: inv.id, paymentMethod: inv.payment_method || null });
                                }}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-sm text-slate-400">Ainda não há faturas. Use “Criar Fatura” para agrupar receitas pendentes por cliente.</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-effect border-slate-700">
          <CardHeader><CardTitle className="text-white">Transações ({filteredTransactions.length})</CardTitle></CardHeader>
          <CardContent>
            {filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map((t, i) => {
                  const category = categories.find(c => c.id === t.category_id);
                  const entity = entities.find(e => e.id === t.entity_id);
                  const ii = (invoiceItems || []).find(x => x.transaction_id === t.id);
                  const linkedInvoice = ii ? (invoices || []).find(inv => inv.id === ii.invoice_id) : null;
                  const isInPendingInvoice = linkedInvoice?.status === 'pending';
                  const isInPaidInvoice = linkedInvoice?.status === 'paid';
                  const statusMeta = getStatusMeta(t);
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${t.status === 'paid' ? 'bg-emerald-900/20 border-l-emerald-500' : 'bg-slate-800/50 border-l-transparent'}`}>
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center relative ${t.status === 'paid' ? 'ring-2 ring-emerald-500/50' : ''}`} style={{ backgroundColor: category?.color + '20', border: `1px solid ${category?.color}` }}>
                          {t.type === 'income' ? <TrendingUp className="w-6 h-6" style={{ color: category?.color }} /> : <TrendingDown className="w-6 h-6" style={{ color: category?.color }} />}
                          {t.status === 'paid' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium ${t.status === 'paid' ? 'text-emerald-100' : 'text-white'}`}>{t.description}</h3>
                            {t.status === 'paid' && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 rounded-full">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-400">PAGO</span>
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center flex-wrap gap-x-2 mt-1 text-sm ${t.status === 'paid' ? 'text-emerald-300/80' : 'text-slate-400'}`}>
                            <span>{category?.name}</span><span className="text-slate-500">•</span>
                            <span>{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                            {entity && <><span className="text-slate-500">•</span><span>{entity.name}</span></>}
                            {t.period !== 'Único' && <Repeat className="w-3 h-3 text-blue-400" />}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}</p>
                          <Badge variant={statusMeta.key === 'paid' ? 'default' : 'secondary'} className={statusMeta.className}>{statusMeta.label}</Badge>
                          {linkedInvoice && (
                            <div className="mt-1">
                              <Badge className={linkedInvoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-purple-500/10 text-purple-300'}>
                                {linkedInvoice.status === 'paid' ? 'Em fatura paga' : 'Em fatura pendente'}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          {!isInPendingInvoice && (
                            <InvoiceGenerator 
                              transaction={t} 
                              entity={entity} 
                              category={category}
                            />
                          )}
                          {!isInPaidInvoice && (
                            <ReceiptGenerator 
                              transaction={t} 
                              entity={entity} 
                              category={category}
                            />
                          )}
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleToggleStatus(t)} 
                            className="text-slate-400 hover:text-emerald-400"
                            title={t.status === 'paid' ? 'Marcar como pendente' : 'Marcar como pago'}
                          >
                            {t.status === 'paid' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleEdit(t)} 
                            className="text-slate-400 hover:text-blue-400"
                            title="Editar transação"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDelete(t)} 
                            className="text-slate-400 hover:text-red-400"
                            title="Excluir transação"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400"><X className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nenhuma transação encontrada</p></div>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialogComponent />
    </>
  );
}

export default Transactions;