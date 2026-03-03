import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function Dashboard() {
  const { transactions, categories, getMonthlyData } = useData();
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const monthlyData = getMonthlyData(currentYear, currentMonth);
  
  // Dados para gráfico de barras (últimos 6 meses)
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1);
    const data = getMonthlyData(date.getFullYear(), date.getMonth());
    chartData.push({
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      receitas: data.income,
      despesas: data.expenses
    });
  }

  // Dados para gráfico de pizza (categorias de despesas)
  const expensesByCategory = categories
    .filter(cat => cat.type === 'expense')
    .map(cat => {
      const total = transactions
        .filter(t => t.categoryId === cat.id && t.type === 'expense' && t.status === 'paid')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: cat.name,
        value: total,
        color: cat.color
      };
    })
    .filter(item => item.value > 0);

  // Transações recentes
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const stats = [
    {
      title: 'Saldo Atual',
      value: formatCurrency(monthlyData.balance),
      icon: Wallet,
      gradient: 'balance-gradient',
      change: monthlyData.balance >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'Receitas do Mês',
      value: formatCurrency(monthlyData.income),
      icon: TrendingUp,
      gradient: 'income-gradient',
      change: 'positive'
    },
    {
      title: 'Despesas do Mês',
      value: formatCurrency(monthlyData.expenses),
      icon: TrendingDown,
      gradient: 'expense-gradient',
      change: 'negative'
    },
    {
      title: 'Pendentes',
      value: formatCurrency(monthlyData.pending),
      icon: Clock,
      gradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
      change: 'neutral'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - FluxoCash</title>
        <meta name="description" content="Visualize seu resumo financeiro, saldo atual, receitas e despesas do mês em um dashboard interativo." />
      </Helmet>

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">
              Resumo financeiro de {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button className="mt-4 sm:mt-0 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-effect border-slate-700 card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                      <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${stat.gradient} flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    {stat.change === 'positive' && (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400 mr-1" />
                    )}
                    {stat.change === 'negative' && (
                      <ArrowDownRight className="w-4 h-4 text-red-400 mr-1" />
                    )}
                    <span className={`text-sm ${
                      stat.change === 'positive' ? 'text-emerald-400' : 
                      stat.change === 'negative' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {stat.change === 'positive' ? 'Receita' : 
                       stat.change === 'negative' ? 'Despesa' : 'Aguardando'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass-effect border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Receitas vs Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
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

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass-effect border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {expensesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-400">
                    <p>Nenhuma despesa registrada este mês</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-effect border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Transações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => {
                    const category = categories.find(c => c.id === transaction.categoryId);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: category?.color + '20', border: `1px solid ${category?.color}` }}
                          >
                            {transaction.type === 'income' ? (
                              <TrendingUp className="w-5 h-5" style={{ color: category?.color }} />
                            ) : (
                              <TrendingDown className="w-5 h-5" style={{ color: category?.color }} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{transaction.description}</p>
                            <p className="text-sm text-slate-400">
                              {category?.name} • {new Date(transaction.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className={`text-xs ${
                            transaction.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                          }`}>
                            {transaction.status === 'paid' ? 'Pago' : 'Pendente'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p>Nenhuma transação registrada ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}

export default Dashboard;