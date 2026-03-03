
import React, { useState } from 'react';
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
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, Palette } from 'lucide-react';

const colorOptions = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory } = useData();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '', type: 'expense', color: '#ef4444'
  });

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory(editingCategory.id, formData);
    } else {
      addCategory(formData);
    }
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'expense', color: '#ef4444' });
    setEditingCategory(null);
  };

  const handleEdit = (category) => {
    setFormData({ name: category.name, type: category.type, color: category.color });
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

    const handleDelete = async (category) => {
    const confirmed = await confirm({
      title: 'Excluir Categoria',
      description: `Tem certeza que deseja excluir a categoria "${category.name}"? Esta ação não pode ser desfeita e pode afetar transações vinculadas.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive'
    });

    if (confirmed) {
      deleteCategory(category.id);
    }
  };

  const CategoryCard = ({ category, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass-effect border-slate-700 card-hover">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: category.color + '20', border: `1px solid ${category.color}` }}>
                {category.type === 'income' ? <TrendingUp className="w-5 h-5" style={{ color: category.color }} /> : <TrendingDown className="w-5 h-5" style={{ color: category.color }} />}
              </div>
              <div>
                <h3 className="font-medium text-white">{category.name}</h3>
                <Badge variant="secondary" className={category.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                  {category.type === 'income' ? 'Receita' : 'Despesa'}
                </Badge>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button size="icon" variant="ghost" onClick={() => handleEdit(category)} className="text-slate-400 hover:text-blue-400"><Edit className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(category)} className="text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Categorias - FluxoCash</title>
        <meta name="description" content="Gerencie suas categorias de receitas e despesas." />
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Categorias</h1>
            <p className="text-slate-400 mt-1">Organize suas receitas e despesas</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0 bg-gradient-to-r from-emerald-500 to-blue-500" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" /> Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-slate-700 max-w-md">
              <DialogHeader><DialogTitle className="text-white">{editingCategory ? 'Editar' : 'Nova'} Categoria</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>Nome da Categoria</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-800 border-slate-600" required /></div>
                <div className="space-y-2"><Label>Tipo</Label><Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}><SelectTrigger className="bg-slate-800 border-slate-600"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Receita</SelectItem><SelectItem value="expense">Despesa</SelectItem></SelectContent></Select></div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {colorOptions.map(color => (
                      <button key={color} type="button" className={`w-8 h-8 rounded-lg border-2 transition-all ${formData.color === color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} onClick={() => setFormData({ ...formData, color })} />
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 mt-2"><Palette className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-400">Cor: {formData.color}</span></div>
                </div>
                <div className="flex space-x-2 pt-4"><Button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500">{editingCategory ? 'Atualizar' : 'Criar'}</Button><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-600">Cancelar</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div>
          <div className="flex items-center space-x-2 mb-4"><TrendingUp className="w-5 h-5 text-emerald-400" /><h2 className="text-xl font-semibold text-white">Receitas</h2><Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">{incomeCategories.length}</Badge></div>
          {incomeCategories.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{incomeCategories.map((c, i) => <CategoryCard key={c.id} category={c} index={i} />)}</div> : <Card className="glass-effect border-slate-700"><CardContent className="p-8 text-center text-slate-400">Nenhuma categoria de receita.</CardContent></Card>}
        </div>
        <div>
          <div className="flex items-center space-x-2 mb-4"><TrendingDown className="w-5 h-5 text-red-400" /><h2 className="text-xl font-semibold text-white">Despesas</h2><Badge variant="secondary" className="bg-red-500/20 text-red-400">{expenseCategories.length}</Badge></div>
          {expenseCategories.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{expenseCategories.map((c, i) => <CategoryCard key={c.id} category={c} index={i} />)}</div> : <Card className="glass-effect border-slate-700"><CardContent className="p-8 text-center text-slate-400">Nenhuma categoria de despesa.</CardContent></Card>}
        </div>
      </div>
      <ConfirmDialogComponent />
    </>
  );
}

export default Categories;