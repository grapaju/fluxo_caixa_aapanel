import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../auth.js';
import { generateInvoiceNumber, generateReceiptNumber } from './helpers/numbers.js';
import { getNextDate } from './helpers/recurrence.js';

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function periodToUi(value: any) {
  if (value === 'Mensal' || value === 'Bimestral' || value === 'Trimestral') return value;
  return 'Único';
}

function transactionDto(t: any) {
  return {
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    date: toIsoDate(t.date),
    status: t.status,
    category_id: t.categoryId ?? null,
    entity_id: t.entityId ?? null,
    payment_method: t.paymentMethod ?? null,
    notes: t.notes ?? null,
    period: periodToUi(t.period),
    created_at: t.createdAt?.toISOString?.() ?? null,
    updated_at: t.updatedAt?.toISOString?.() ?? null,
  };
}

function categoryDto(c: any) {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    color: c.color,
    created_at: c.createdAt?.toISOString?.() ?? null,
  };
}

function entityDto(e: any) {
  return {
    id: e.id,
    name: e.name,
    type: e.type,
    email: e.email,
    phone: e.phone,
    document: e.document,
    address: e.address,
    created_at: e.createdAt?.toISOString?.() ?? null,
  };
}

function invoiceDto(i: any) {
  return {
    id: i.id,
    user_id: i.userId,
    entity_id: i.entityId,
    number: i.number,
    issue_date: toIsoDate(i.issueDate),
    due_date: i.dueDate ? toIsoDate(i.dueDate) : null,
    status: i.status,
    total_amount: Number(i.totalAmount),
    payment_method: i.paymentMethod ?? null,
    receipt_number: i.receiptNumber ?? null,
    paid_at: i.paidAt ? i.paidAt.toISOString() : null,
    notes: i.notes ?? null,
    created_at: i.createdAt?.toISOString?.() ?? null,
  };
}

function invoiceItemDto(ii: any) {
  return {
    id: ii.id,
    user_id: ii.userId,
    invoice_id: ii.invoiceId,
    transaction_id: ii.transactionId,
    created_at: ii.createdAt?.toISOString?.() ?? null,
  };
}

const idParam = z.object({ id: z.string().uuid() });

export async function apiRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/me', async (request) => ({ user: request.user }));

  // Categories
  app.get('/categories', async (request) => {
    const rows = await prisma.category.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: 'desc' } });
    return rows.map(categoryDto);
  });

  app.post('/categories', async (request) => {
    const body = z.object({ name: z.string().min(1), type: z.enum(['income', 'expense']), color: z.string().min(1) }).parse(request.body);
    const created = await prisma.category.create({ data: { ...body, userId: request.user!.id } });
    return categoryDto(created);
  });

  app.put('/categories/:id', async (request) => {
    const { id } = idParam.parse(request.params);
    const body = z.object({ name: z.string().min(1), type: z.enum(['income', 'expense']), color: z.string().min(1) }).parse(request.body);
    const existing = await prisma.category.findFirst({ where: { id, userId: request.user!.id } });
    if (!existing) {
      const err: any = new Error('Categoria não encontrada');
      err.statusCode = 404;
      throw err;
    }
    const updated = await prisma.category.update({ where: { id }, data: body });
    return categoryDto(updated);
  });

  app.delete('/categories/:id', async (request) => {
    const { id } = idParam.parse(request.params);
    const existing = await prisma.category.findFirst({ where: { id, userId: request.user!.id } });
    if (!existing) {
      const err: any = new Error('Categoria não encontrada');
      err.statusCode = 404;
      throw err;
    }
    await prisma.category.delete({ where: { id } });
    return { ok: true };
  });

  // Entities
  app.get('/entities', async (request) => {
    const rows = await prisma.entity.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: 'desc' } });
    return rows.map(entityDto);
  });

  app.post('/entities', async (request) => {
    const body = z.object({
      name: z.string().min(1),
      type: z.enum(['customer', 'supplier']),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      document: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
    }).parse(request.body);
    const created = await prisma.entity.create({ data: { ...body, userId: request.user!.id } });
    return entityDto(created);
  });

  app.put('/entities/:id', async (request) => {
    const { id } = idParam.parse(request.params);
    const body = z.object({
      name: z.string().min(1),
      type: z.enum(['customer', 'supplier']),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      document: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
    }).parse(request.body);
    const existing = await prisma.entity.findFirst({ where: { id, userId: request.user!.id } });
    if (!existing) {
      const err: any = new Error('Entidade não encontrada');
      err.statusCode = 404;
      throw err;
    }
    const updated = await prisma.entity.update({ where: { id }, data: body });
    return entityDto(updated);
  });

  app.delete('/entities/:id', async (request) => {
    const { id } = idParam.parse(request.params);
    const existing = await prisma.entity.findFirst({ where: { id, userId: request.user!.id } });
    if (!existing) {
      const err: any = new Error('Entidade não encontrada');
      err.statusCode = 404;
      throw err;
    }
    await prisma.entity.delete({ where: { id } });
    return { ok: true };
  });

  // Transactions
  app.get('/transactions', async (request) => {
    const rows = await prisma.transaction.findMany({ where: { userId: request.user!.id }, orderBy: { date: 'desc' } });
    return rows.map(transactionDto);
  });

  app.post('/transactions', async (request) => {
    const rawBody = (request.body ?? {}) as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(rawBody, 'amount') && rawBody.amount === null) {
      const err: any = new Error('Campo "amount" não pode ser nulo');
      err.statusCode = 400;
      throw err;
    }

    const body = z.object({
      description: z.string().min(1),
      amount: z.number().positive(),
      type: z.enum(['income', 'expense']),
      date: z.string().min(10),
      status: z.enum(['pending', 'paid']).optional(),
      category_id: z.string().uuid().optional().nullable(),
      entity_id: z.string().uuid().optional().nullable(),
      payment_method: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      period: z.enum(['Único', 'Mensal', 'Bimestral', 'Trimestral']).optional(),
    }).parse(request.body);

    const created = await prisma.transaction.create({
      data: {
        userId: request.user!.id,
        description: body.description,
        amount: body.amount as any,
        type: body.type,
        date: new Date(body.date),
        status: body.status || 'pending',
        categoryId: body.category_id || null,
        entityId: body.entity_id || null,
        paymentMethod: body.payment_method || null,
        notes: body.notes || null,
        period: body.period === 'Mensal' ? 'Mensal' : body.period === 'Bimestral' ? 'Bimestral' : body.period === 'Trimestral' ? 'Trimestral' : 'Unico',
      },
    });
    return transactionDto(created);
  });

  app.put('/transactions/:id', async (request) => {
    const { id } = idParam.parse(request.params);
    const rawBody = (request.body ?? {}) as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(rawBody, 'amount') && rawBody.amount === null) {
      const err: any = new Error('Campo "amount" não pode ser nulo');
      err.statusCode = 400;
      throw err;
    }

    const body = z.object({
      description: z.string().min(1).optional(),
      amount: z.number().positive().optional(),
      type: z.enum(['income', 'expense']).optional(),
      date: z.string().min(10).optional(),
      status: z.enum(['pending', 'paid']).optional(),
      category_id: z.string().uuid().optional().nullable(),
      entity_id: z.string().uuid().optional().nullable(),
      payment_method: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      period: z.enum(['Único', 'Mensal', 'Bimestral', 'Trimestral']).optional(),
    }).parse(request.body);

    const existing = await prisma.transaction.findFirst({ where: { id, userId: request.user!.id } });
    if (!existing) {
      const err: any = new Error('Transação não encontrada');
      err.statusCode = 404;
      throw err;
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        description: body.description,
        amount: body.amount === undefined ? undefined : (body.amount as any),
        type: body.type,
        date: body.date ? new Date(body.date) : undefined,
        status: body.status,
        categoryId: body.category_id === undefined ? undefined : (body.category_id || null),
        entityId: body.entity_id === undefined ? undefined : (body.entity_id || null),
        paymentMethod: body.payment_method === undefined ? undefined : (body.payment_method || null),
        notes: body.notes === undefined ? undefined : (body.notes || null),
        period: body.period
          ? (body.period === 'Mensal' ? 'Mensal' : body.period === 'Bimestral' ? 'Bimestral' : body.period === 'Trimestral' ? 'Trimestral' : 'Unico')
          : undefined,
      },
    });
    return transactionDto(updated);
  });

  app.delete('/transactions/:id', async (request) => {
    const { id } = idParam.parse(request.params);
    const existing = await prisma.transaction.findFirst({ where: { id, userId: request.user!.id } });
    if (!existing) {
      const err: any = new Error('Transação não encontrada');
      err.statusCode = 404;
      throw err;
    }
    await prisma.transaction.delete({ where: { id } });
    return { ok: true };
  });

  // Invoices + items
  app.get('/invoices', async (request) => {
    const rows = await prisma.invoice.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: 'desc' } });
    return rows.map(invoiceDto);
  });

  app.get('/invoice-items', async (request) => {
    const rows = await prisma.invoiceItem.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: 'desc' } });
    return rows.map(invoiceItemDto);
  });

  app.post('/invoices', async (request, reply) => {
    const body = z.object({
      entity_id: z.string().uuid(),
      due_date: z.string().min(10).optional().nullable(),
      payment_method: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      transaction_ids: z.array(z.string().uuid()).min(1),
    }).parse(request.body);

    const userId = request.user!.id;

    const txs = await prisma.transaction.findMany({
      where: { id: { in: body.transaction_ids }, userId },
    });

    if (txs.length !== body.transaction_ids.length) {
      reply.status(400).send({ message: 'Uma ou mais transações não pertencem ao usuário' });
      return;
    }

    const invalid = txs.find((t: any) => t.type !== 'income' || t.status !== 'pending' || t.entityId !== body.entity_id);
    if (invalid) {
      reply.status(400).send({ message: 'Transações devem ser receitas pendentes do mesmo cliente' });
      return;
    }

    // garantir que nenhuma transação já está em item de fatura
    const already = await prisma.invoiceItem.findMany({ where: { transactionId: { in: body.transaction_ids } } });
    if (already.length > 0) {
      reply.status(409).send({ message: 'Uma ou mais transações já estão vinculadas a uma fatura' });
      return;
    }

    const total = txs.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        entityId: body.entity_id,
        number: generateInvoiceNumber(),
        issueDate: new Date(),
        dueDate: body.due_date ? new Date(body.due_date) : null,
        status: 'pending',
        totalAmount: total as any,
        paymentMethod: body.payment_method || null,
        notes: body.notes || null,
        items: {
          create: body.transaction_ids.map(id => ({ userId, transactionId: id })),
        },
      },
    });

    return invoiceDto(invoice);
  });

  app.post('/invoices/:id/pay', async (request, reply) => {
    const { id } = idParam.parse(request.params);
    const body = z.object({ payment_method: z.string().optional().nullable() }).parse(request.body || {});

    const userId = request.user!.id;
    const invoice = await prisma.invoice.findFirst({ where: { id, userId } });
    if (!invoice) {
      reply.status(404).send({ message: 'Fatura não encontrada' });
      return;
    }

    if (invoice.status === 'paid') {
      reply.send(invoiceDto(invoice));
      return;
    }

    const items = await prisma.invoiceItem.findMany({ where: { invoiceId: id, userId } });
    const transactionIds = items.map((i: any) => i.transactionId);
    const linked = await prisma.transaction.findMany({ where: { id: { in: transactionIds }, userId } });

    // marcar como pago
    await prisma.transaction.updateMany({ where: { id: { in: transactionIds }, userId }, data: { status: 'paid' } });

    // criar recorrências para as transações que eram pendentes e recorrentes
    const recurrences = linked
      .filter((t: any) => t.status !== 'paid')
      .filter((t: any) => t.period !== 'Unico')
      .map((t: any) => {
        const nextDate = getNextDate(t.date, t.period);
        if (!nextDate) return null;
        return {
          userId,
          description: t.description,
          amount: t.amount,
          type: t.type,
          date: nextDate,
          status: 'pending' as const,
          categoryId: t.categoryId,
          entityId: t.entityId,
          paymentMethod: t.paymentMethod,
          notes: t.notes,
          period: t.period,
        };
      })
      .filter(Boolean) as any[];

    if (recurrences.length > 0) {
      await prisma.transaction.createMany({ data: recurrences });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        receiptNumber: generateReceiptNumber(),
        paymentMethod: body.payment_method || invoice.paymentMethod || null,
      },
    });

    return invoiceDto(updatedInvoice);
  });
}
