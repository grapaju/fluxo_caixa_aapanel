import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/apiClient';

const DataContext = createContext();

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
}

const paymentMethods = [
  'Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'PIX', 'Transferência', 'Boleto'
];

const periods = ['Único', 'Mensal', 'Bimestral', 'Trimestral'];

export function DataProvider({ children }) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [entities, setEntities] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoicePayments, setInvoicePayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!session) {
      setTransactions([]);
      setCategories([]);
      setEntities([]);
      setInvoices([]);
      setInvoiceItems([]);
      setInvoicePayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [tx, cat, ent, inv, invItems, invPayments] = await Promise.all([
        apiRequest('/api/transactions'),
        apiRequest('/api/categories'),
        apiRequest('/api/entities'),
        apiRequest('/api/invoices'),
        apiRequest('/api/invoice-items'),
        apiRequest('/api/invoice-payments'),
      ]);

      setTransactions(tx || []);
      setCategories(cat || []);
      setEntities(ent || []);
      setInvoices(inv || []);
      setInvoiceItems(invItems || []);
      setInvoicePayments(invPayments || []);
    } catch (error) {
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [session, toast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addTransaction = async (transactionData) => {
    try {
      const created = await apiRequest('/api/transactions', { method: 'POST', body: transactionData });
      setTransactions(prev => [created, ...prev]);
      toast({ title: 'Transação adicionada com sucesso!' });
      return created;
    } catch (error) {
      toast({ title: 'Erro ao adicionar transação', description: error.message, variant: 'destructive' });
    }
  };

  const updateTransaction = async (id, transactionData) => {
    try {
      const updated = await apiRequest(`/api/transactions/${id}`, { method: 'PUT', body: transactionData });
      setTransactions(prev => prev.map(t => t.id === id ? updated : t));
      toast({ title: 'Transação atualizada com sucesso!' });
      return updated;
    } catch (error) {
      toast({ title: 'Erro ao atualizar transação', description: error.message, variant: 'destructive' });
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await apiRequest(`/api/transactions/${id}`, { method: 'DELETE' });
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Transação excluída com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao excluir transação', description: error.message, variant: 'destructive' });
    }
  };

  const addCategory = async (categoryData) => {
    try {
      const created = await apiRequest('/api/categories', { method: 'POST', body: categoryData });
      setCategories(prev => [created, ...prev]);
      toast({ title: 'Categoria criada com sucesso!' });
      return created;
    } catch (error) {
      toast({ title: 'Erro ao criar categoria', description: error.message, variant: 'destructive' });
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      const updated = await apiRequest(`/api/categories/${id}`, { method: 'PUT', body: categoryData });
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
      toast({ title: 'Categoria atualizada com sucesso!' });
      return updated;
    } catch (error) {
      toast({ title: 'Erro ao atualizar categoria', description: error.message, variant: 'destructive' });
    }
  };

  const deleteCategory = async (id) => {
    try {
      await apiRequest(`/api/categories/${id}`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Categoria excluída com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao excluir categoria', description: error.message, variant: 'destructive' });
    }
  };

  const addEntity = async (entityData) => {
    try {
      const created = await apiRequest('/api/entities', { method: 'POST', body: entityData });
      setEntities(prev => [created, ...prev]);
      toast({ title: 'Entidade adicionada com sucesso!' });
      return created;
    } catch (error) {
      toast({ title: 'Erro ao adicionar entidade', description: error.message, variant: 'destructive' });
    }
  };

  const updateEntity = async (id, entityData) => {
    try {
      const updated = await apiRequest(`/api/entities/${id}`, { method: 'PUT', body: entityData });
      setEntities(prev => prev.map(e => e.id === id ? updated : e));
      toast({ title: 'Entidade atualizada com sucesso!' });
      return updated;
    } catch (error) {
      toast({ title: 'Erro ao atualizar entidade', description: error.message, variant: 'destructive' });
    }
  };

  const deleteEntity = async (id) => {
    try {
      await apiRequest(`/api/entities/${id}`, { method: 'DELETE' });
      setEntities(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Entidade excluída com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao excluir entidade', description: error.message, variant: 'destructive' });
    }
  };

  const createInvoice = async ({ entityId, transactionIds, dueDate, paymentMethod, notes }) => {
    try {
      const invoice = await apiRequest('/api/invoices', {
        method: 'POST',
        body: {
          entity_id: entityId,
          transaction_ids: transactionIds,
          due_date: dueDate || null,
          payment_method: paymentMethod || null,
          notes: notes || null,
        },
      });

      const [inv, invItems] = await Promise.all([
        apiRequest('/api/invoices'),
        apiRequest('/api/invoice-items'),
      ]);
      setInvoices(inv || []);
      setInvoiceItems(invItems || []);

      toast({ title: 'Fatura criada com sucesso!' });
      return invoice;
    } catch (error) {
      toast({ title: 'Erro ao criar fatura', description: error.message, variant: 'destructive' });
    }
  };

  const markInvoicePaid = async ({ invoiceId, paymentMethod }) => {
    try {
      const updated = await apiRequest(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        body: { payment_method: paymentMethod || null },
      });

      await fetchAll();
      return updated;
    } catch (error) {
      toast({ title: 'Erro ao marcar fatura como paga', description: error.message, variant: 'destructive' });
    }
  };

  const registerInvoicePayment = async ({ invoiceId, amountPaid, paymentDate, paymentMethod, notes }) => {
    try {
      const result = await apiRequest(`/api/invoices/${invoiceId}/payments`, {
        method: 'POST',
        body: {
          amount_paid: amountPaid,
          payment_date: paymentDate || undefined,
          payment_method: paymentMethod || null,
          notes: notes || null,
        },
      });

      await fetchAll();
      toast({ title: 'Pagamento registrado com sucesso!' });
      return result;
    } catch (error) {
      toast({ title: 'Erro ao registrar pagamento parcial', description: error.message, variant: 'destructive' });
    }
  };

  const getMonthlyData = (year, month) => {
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
    });
    const income = monthTransactions.filter(t => t.type === 'income' && t.status === 'paid').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = monthTransactions.filter(t => t.type === 'expense' && t.status === 'paid').reduce((sum, t) => sum + Number(t.amount), 0);
    const pending = monthTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + Number(t.amount), 0);
    return { income, expenses, balance: income - expenses, pending, transactions: monthTransactions };
  };

  const value = {
    transactions,
    categories,
    entities,
    invoices,
    invoiceItems,
    invoicePayments,
    paymentMethods,
    periods,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addEntity,
    updateEntity,
    deleteEntity,
    getMonthlyData,
    createInvoice,
    markInvoicePaid,
    registerInvoicePayment,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
