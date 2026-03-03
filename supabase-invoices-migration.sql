-- Migração sugerida para suportar faturas com múltiplas transações (itens)
-- Rode no SQL Editor do Supabase (ajuste nomes se seu schema diferir).
-- Observação: este arquivo não é aplicado automaticamente pelo app.

-- 1) Ajustes na tabela invoices (se já existir, apenas adiciona colunas)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoices'
  ) THEN
    -- adiciona colunas se não existirem
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'number'
    ) THEN
      ALTER TABLE public.invoices ADD COLUMN number text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'total_amount'
    ) THEN
      ALTER TABLE public.invoices ADD COLUMN total_amount numeric;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'paid_at'
    ) THEN
      ALTER TABLE public.invoices ADD COLUMN paid_at timestamptz;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'receipt_number'
    ) THEN
      ALTER TABLE public.invoices ADD COLUMN receipt_number text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'payment_method'
    ) THEN
      ALTER TABLE public.invoices ADD COLUMN payment_method text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'notes'
    ) THEN
      ALTER TABLE public.invoices ADD COLUMN notes text;
    END IF;

    -- status padrão (mantém 'pending'/'paid' para ficar alinhado com transações)
    -- Caso você use outro padrão, ajuste no app.
  ELSE
    -- Se invoices não existir, cria com o formato recomendado
    CREATE TABLE public.invoices (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id),
      entity_id uuid REFERENCES public.entities(id),
      number text NOT NULL,
      issue_date date NOT NULL DEFAULT CURRENT_DATE,
      due_date date,
      status text NOT NULL DEFAULT 'pending',
      total_amount numeric NOT NULL DEFAULT 0,
      payment_method text,
      receipt_number text,
      paid_at timestamptz,
      notes text,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- 2) Tabela invoice_items (liga N transações a 1 fatura)
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT invoice_items_unique UNIQUE (transaction_id)
);

-- 3) Índices úteis
CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON public.invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON public.invoices (user_id);
CREATE INDEX IF NOT EXISTS invoices_entity_id_idx ON public.invoices (entity_id);

-- 4) (Opcional) RLS: habilite e crie policies conforme seu projeto.
-- Este app filtra por user_id no client; para produção, recomendo RLS.
