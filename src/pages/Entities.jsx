
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
import { Plus, Edit, Trash2, Users, User, Building } from 'lucide-react';

function EntityForm({ formData, setFormData, onSubmit, onCancel, editingEntity }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Nome</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-slate-800 border-slate-600 text-white"
            placeholder="Nome do Cliente/Fornecedor"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Tipo</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="bg-slate-800 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Cliente</SelectItem>
              <SelectItem value="supplier">Fornecedor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Email</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="bg-slate-800 border-slate-600 text-white"
            placeholder="contato@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Telefone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-slate-800 border-slate-600 text-white"
            placeholder="(00) 99999-9999"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">CPF/CNPJ</Label>
        <Input
          value={formData.document}
          onChange={(e) => setFormData({ ...formData, document: e.target.value })}
          className="bg-slate-800 border-slate-600 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-300">Endereço</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="bg-slate-800 border-slate-600 text-white"
        />
      </div>
      <div className="flex space-x-2 pt-4">
        <Button type="submit" className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500">
          {editingEntity ? 'Atualizar' : 'Adicionar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="border-slate-600">
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function Entities() {
  const { entities, addEntity, updateEntity, deleteEntity } = useData();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [formData, setFormData] = useState({
    name: '', type: 'customer', email: '', phone: '', document: '', address: ''
  });

  const clients = entities.filter(e => e.type === 'customer');
  const suppliers = entities.filter(e => e.type === 'supplier');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEntity) {
      updateEntity(editingEntity.id, formData);
    } else {
      addEntity(formData);
    }
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'customer', email: '', phone: '', document: '', address: '' });
    setEditingEntity(null);
  };

  const handleEdit = (entity) => {
    setFormData({
      name: entity.name, type: entity.type, email: entity.email || '',
      phone: entity.phone || '', document: entity.document || '', address: entity.address || ''
    });
    setEditingEntity(entity);
    setIsDialogOpen(true);
  };

  const handleDelete = async (entity) => {
    const confirmed = await confirm({
      title: 'Excluir Cliente/Fornecedor',
      description: `Tem certeza que deseja excluir "${entity.name}"? Esta ação não pode ser desfeita e pode afetar transações vinculadas.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      variant: 'destructive'
    });

    if (confirmed) {
      deleteEntity(entity.id);
    }
  };

  const EntityCard = ({ entity, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="glass-effect border-slate-700 card-hover">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${entity.type === 'customer' ? 'bg-blue-500/20' : 'bg-amber-500/20'}`}>
                {entity.type === 'customer' ? <User className="w-5 h-5 text-blue-400" /> : <Building className="w-5 h-5 text-amber-400" />}
              </div>
              <div>
                <h3 className="font-medium text-white">{entity.name}</h3>
                <p className="text-sm text-slate-400">{entity.email}</p>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button size="icon" variant="ghost" onClick={() => handleEdit(entity)} className="text-slate-400 hover:text-blue-400">
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(entity)} className="text-slate-400 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Entidades - FluxoCash</title>
        <meta name="description" content="Gerencie seus clientes e fornecedores." />
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Entidades</h1>
            <p className="text-slate-400 mt-1">Gerencie seus clientes e fornecedores</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Entidade
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-slate-700 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">{editingEntity ? 'Editar Entidade' : 'Nova Entidade'}</DialogTitle>
              </DialogHeader>
              <EntityForm formData={formData} setFormData={setFormData} onSubmit={handleSubmit} onCancel={() => setIsDialogOpen(false)} editingEntity={editingEntity} />
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Clientes</h2>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">{clients.length}</Badge>
          </div>
          {clients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((entity, index) => <EntityCard key={entity.id} entity={entity} index={index} />)}
            </div>
          ) : (
            <Card className="glass-effect border-slate-700"><CardContent className="p-8 text-center text-slate-400">Nenhum cliente cadastrado.</CardContent></Card>
          )}
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Building className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-semibold text-white">Fornecedores</h2>
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">{suppliers.length}</Badge>
          </div>
          {suppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((entity, index) => <EntityCard key={entity.id} entity={entity} index={index} />)}
            </div>
          ) : (
            <Card className="glass-effect border-slate-700"><CardContent className="p-8 text-center text-slate-400">Nenhum fornecedor cadastrado.</CardContent></Card>
          )}
        </div>
      </div>
      <ConfirmDialogComponent />
    </>
  );
}

export default Entities;
  