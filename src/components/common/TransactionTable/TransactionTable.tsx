'use client';

import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Edit2, Minus, Plus, Search, Trash2 } from 'lucide-react';

export interface TransactionRow {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  amountSign: 'debit' | 'credit' | 'neutral';
  category: string;
  status: 'cleared' | 'pending' | 'voided';
}

export interface TransactionTableProps {
  rows: TransactionRow[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
  onRowClick?: (id: string) => void;
  loading?: boolean;
  title?: string;
  pageSize?: number;
}

type SortKey = 'date' | 'merchant' | 'category' | 'amount' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_LABELS: Record<TransactionRow['status'], string> = {
  cleared: '● Cleared',
  pending: '◌ Pending',
  voided: '✕ Voided',
};

function formatAmount(row: TransactionRow) {
  const prefix = row.amountSign === 'debit' ? '−' : row.amountSign === 'credit' ? '+' : '';
  return `${prefix}₹${row.amount.toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  } catch {
    return iso;
  }
}

function TypeIcon({ type }: { type: TransactionRow['amountSign'] }) {
  if (type === 'credit') return <ArrowDownLeft size={14} />;
  if (type === 'debit') return <ArrowUpRight size={14} />;
  return <Minus size={14} />;
}

function SortIndicator({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronDown size={12} className="tx-crud__sort-idle" aria-hidden />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="tx-crud__sort-active" aria-hidden />
    : <ChevronDown size={12} className="tx-crud__sort-active" aria-hidden />;
}

export function TransactionTable({
  rows,
  onEdit,
  onDelete,
  onAdd,
  onRowClick,
  loading = false,
  title = 'Transactions',
  pageSize = 10,
}: TransactionTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r =>
      r.merchant.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortKey === 'merchant') cmp = a.merchant.localeCompare(b.merchant);
      else if (sortKey === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortKey === 'amount') cmp = a.amount - b.amount;
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (loading) {
    return (
      <div className="tx-crud__loading" aria-label="Loading">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="tx-crud__skeleton" aria-hidden />
        ))}
      </div>
    );
  }

  const COLS: { key: SortKey; label: string; align?: 'right' }[] = [
    { key: 'date', label: 'Date' },
    { key: 'merchant', label: 'Merchant' },
    { key: 'amount', label: 'Amount', align: 'right' },
    { key: 'category', label: 'Category' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="tx-crud">
      <div className="tx-crud__header">
        <h2 className="tx-crud__header-title">{title}</h2>
        {onAdd && (
          <button type="button" className="tx-crud__add-btn" onClick={onAdd} aria-label="Add transaction">
            <Plus size={16} aria-hidden />
            Add
          </button>
        )}
      </div>

      {/* Search */}
      <div className="tx-crud__search">
        <Search size={14} className="tx-crud__search-icon" aria-hidden />
        <input
          type="text"
          placeholder="Search by merchant, category…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          aria-label="Search transactions"
        />
        {search && (
          <button
            type="button"
            className="tx-crud__search-clear"
            onClick={() => setSearch('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {sorted.length === 0 && !loading && (
        <div className="tx-crud__empty">
          {search ? 'No results for your search' : 'No transactions yet'}
        </div>
      )}

      {sorted.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="tx-crud__table-wrap">
            <table className="tx-crud__table" aria-label={title}>
              <thead>
                <tr>
                  {COLS.map(col => (
                    <th
                      key={col.key}
                      scope="col"
                      className={`tx-crud__th${col.align === 'right' ? ' tx-crud__th--right' : ''}`}
                    >
                      <button
                        type="button"
                        className="tx-crud__sort-btn"
                        onClick={() => handleSort(col.key)}
                        aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        {col.label}
                        <SortIndicator col={col.key} sortKey={sortKey} sortDir={sortDir} />
                      </button>
                    </th>
                  ))}
                  {(onEdit || onDelete) && (
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginated.map(row => (
                  <tr
                    key={row.id}
                    className={`tx-crud__tr${onRowClick ? ' tx-crud__tr--clickable' : ''}`}
                    onClick={() => onRowClick?.(row.id)}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (onRowClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onRowClick(row.id); }
                    }}
                  >
                    <td>{formatDate(row.date)}</td>
                    <td className="tx-crud__merchant">{row.merchant}</td>
                    <td className={`tx-crud__amount tx-crud__amount--${row.amountSign}`}>
                      {formatAmount(row)}
                    </td>
                    <td className="tx-crud__category">{row.category}</td>
                    <td>
                      <span className={`tx-crud__status tx-crud__status--${row.status}`}>
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    {(onEdit || onDelete) && (
                      <td onClick={e => e.stopPropagation()}>
                        <div className="tx-crud__actions">
                          {onEdit && (
                            <button
                              type="button"
                              className="tx-crud__action-btn"
                              onClick={() => onEdit(row.id)}
                              aria-label={`Edit ${row.merchant}`}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              className="tx-crud__action-btn tx-crud__action-btn--delete"
                              onClick={() => onDelete(row.id)}
                              aria-label={`Delete ${row.merchant}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards (hidden on desktop) */}
          <div className="tx-crud__cards">
            {paginated.map(row => (
              <div
                key={row.id}
                className={`tx-crud__card${onRowClick ? ' tx-crud__card--clickable' : ''}`}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row.id)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onRowClick(row.id); }
                }}
              >
                <div className="tx-crud__card-row">
                  <div className="tx-crud__card-left">
                    <span className={`tx-crud__type-icon tx-crud__type-icon--${row.amountSign}`}>
                      <TypeIcon type={row.amountSign} />
                    </span>
                    <span className="tx-crud__card-merchant">{row.merchant}</span>
                  </div>
                  <span className={`tx-crud__amount tx-crud__amount--${row.amountSign}`}>
                    {formatAmount(row)}
                  </span>
                </div>
                <div className="tx-crud__card-row tx-crud__card-row--meta">
                  <div className="tx-crud__card-meta">
                    <span>{row.category}</span>
                    <span>· {formatDate(row.date)}</span>
                  </div>
                  {(onEdit || onDelete) && (
                    <div
                      className="tx-crud__card-actions"
                      onClick={e => e.stopPropagation()}
                    >
                      {onEdit && (
                        <button
                          type="button"
                          className="tx-crud__action-btn"
                          onClick={() => onEdit(row.id)}
                          aria-label={`Edit ${row.merchant}`}
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="tx-crud__action-btn tx-crud__action-btn--delete"
                          onClick={() => onDelete(row.id)}
                          aria-label={`Delete ${row.merchant}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {(onEdit || onDelete) && (
            <p className="tx-crud__swipe-hint" aria-hidden>
              ← Swipe left to delete · Swipe right to edit
            </p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="tx-crud__pagination" aria-label="Pagination">
              <span className="tx-crud__pagination-info">
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} of {sorted.length}
              </span>
              <div className="tx-crud__pagination-controls">
                <button
                  type="button"
                  className="tx-crud__page-btn"
                  disabled={safePage === 1}
                  onClick={() => setPage(p => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="tx-crud__page-label">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  className="tx-crud__page-btn"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
