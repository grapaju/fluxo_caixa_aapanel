import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'destructive', // 'destructive', 'warning', 'success', 'info'
  icon: CustomIcon,
  isLoading = false
}) {
  const variants = {
    destructive: {
      icon: Trash2,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
      titleColor: 'text-red-400'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
      titleColor: 'text-amber-400'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      confirmClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      titleColor: 'text-emerald-400'
    },
    info: {
      icon: AlertCircle,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
      titleColor: 'text-blue-400'
    }
  };

  const config = variants[variant];
  const IconComponent = CustomIcon || config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-effect border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3 text-lg">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor} ${config.borderColor} border`}>
              <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <span className={config.titleColor}>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Descrição */}
          <div className={`p-4 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
            <p className="text-slate-300 leading-relaxed">{description}</p>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-slate-600 hover:bg-slate-700"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={config.confirmClass}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <IconComponent className="w-4 h-4 mr-2" />
                  {confirmText}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook para usar o ConfirmDialog de forma mais simples
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'destructive',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    icon: null,
    isLoading: false
  });

  const confirm = React.useCallback((options) => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title: options.title || 'Confirmar ação',
        description: options.description || 'Tem certeza que deseja continuar?',
        variant: options.variant || 'destructive',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        icon: options.icon,
        isLoading: false,
        onConfirm: () => {
          resolve(true);
          setDialogState(prev => ({ ...prev, open: false }));
        }
      });
    });
  }, []);

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      {...dialogState}
      onOpenChange={(open) => {
        if (!open) {
          setDialogState(prev => ({ ...prev, open: false }));
        }
      }}
    />
  );

  return { confirm, ConfirmDialogComponent };
}