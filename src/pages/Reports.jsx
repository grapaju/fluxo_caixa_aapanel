import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  Download, 
  FileText, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

function Reports() {
  const { transactions, categories, getMonthlyData } = useData();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const currentDate = new Date();
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const monthlyData = getMonthlyData(selectedYear, selectedMonth);

  // Dados para gráfico anual
  const yearlyData = months.map((month, index) => {
    const data = getMonthlyData(selectedYear, index);
    return {
      month: month.substring(0, 3),
      receitas: data.income,
      despesas: data.expenses,
      saldo: data.balance
    };
  });

  // Dados para gráfico de categorias
  const categoryData = categories.map(cat => {
    const total = transactions
      .filter(t => 
        t.categoryId === cat.id && 
        new Date(t.date).getFullYear() === selectedYear &&
        new Date(t.date).getMonth() === selectedMonth &&
        t.status === 'paid'
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name: cat.name,
      value: total,
      color: cat.color,
      type: cat.type
    };
  }).filter(item => item.value > 0);

  const incomeByCategory = categoryData.filter(item => item.type === 'income');
  const expenseByCategory = categoryData.filter(item => item.type === 'expense');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportToPDF = () => {
    toast({
      title: "🚧 Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀",
      description: "Em breve você poderá exportar relatórios em PDF.",
    });
  };

  const exportToExcel = () => {
    toast({
      title: "🚧 Esta funcionalidade ainda não foi implementada—mas não se preocupe! Você pode solicitá-la no seu próximo prompt! 🚀",
      description: "Em breve você poderá exportar relatórios em Excel.",
    });
  };

  const totalIncome = yearlyData.reduce((sum, data) => sum + data.receitas, 0);
  const totalExpenses = yearlyData.reduce((sum, data) => sum + data.despesas, 0);
  const totalBalance = totalIncome - totalExpenses;

  return (
    <>
      <Helmet>
        <title>Relatórios - FluxoCash</title>
        <meta name="description" content="Visualize relatórios detalhados das suas finanças, gráficos mensais e anuais, e exporte dados em PDF ou Excel." />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Relatórios</h1>
            <p className="text-slate-400 mt-1">Análise detalhada das suas finanças</p>
          </div>
          
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={exportToPDF}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={exportToExcel}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass-effect border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Período:</span>
              </div>
              <div className="flex gap-2">
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-32 bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-effect border-slate-700 card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Receitas Anuais</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-effect border-slate-700 card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Despesas Anuais</p>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-effect border-slate-700 card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Saldo Anual</p>
                    <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(totalBalance)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-effect border-slate-700 card-hover">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">Transações</p>
                    <p className="text-2xl font-bold text-blue-400">{monthlyData.transactions.length}</p>
                    <p className="text-xs text-slate-500">no mês selecionado</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yearly Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-effect border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Visão Anual - {selectedYear}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Bar dataKey="receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Balance Trend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass-effect border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Evolução do Saldo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Category Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income by Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="glass-effect border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Receitas por Categoria - {months[selectedMonth]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incomeByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={incomeByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {incomeByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-400">
                    <p>Nenhuma receita registrada no período</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Expenses by Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="glass-effect border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Despesas por Categoria - {months[selectedMonth]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenseByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-400">
                    <p>Nenhuma despesa registrada no período</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Monthly Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Detalhes de {months[selectedMonth]} {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Receitas</p>
                  <p className="text-2xl font-bold text-emerald-400">{formatCurrency(monthlyData.income)}</p>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Despesas</p>
                  <p className="text-2xl font-bold text-red-400">{formatCurrency(monthlyData.expenses)}</p>
                </div>
                <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <DollarSign className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Saldo</p>
                  <p className={`text-2xl font-bold ${monthlyData.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(monthlyData.balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}

export default Reports;