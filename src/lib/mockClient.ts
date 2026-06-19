import { MOCK_ENTITIES, MOCK_EVENTS, MOCK_JOBS, MOCK_FUNDING_ROUNDS, MOCK_ROUND_INVESTORS, MOCK_TEAM_MEMBERS } from './mockData';
import type { Entity } from './supabase';

type Row = Record<string, any>;

class MockQueryBuilder {
  private _table: string;
  private _filters: Array<{ col: string; op: string; val: any }> = [];
  private _order?: { col: string; asc: boolean };
  private _limit?: number;
  private _single = false;
  private _notNull?: string;
  private _orFilters: Array<{ col: string; op: string; val: any }> = [];

  constructor(table: string) { this._table = table; }

  select(_cols?: string) { return this; }
  eq(col: string, val: any) { this._filters.push({ col, op: 'eq', val }); return this; }
  neq(col: string, val: any) { this._filters.push({ col, op: 'neq', val }); return this; }
  ilike(col: string, val: any) { this._filters.push({ col, op: 'ilike', val }); return this; }
  gte(col: string, val: any) { this._filters.push({ col, op: 'gte', val }); return this; }
  in(col: string, vals: any[]) { this._filters.push({ col, op: 'in', val: vals }); return this; }
  not(col: string, _op: string, _val: any) { this._notNull = col; return this; }
  or(query: string) {
    // Parse "slug.eq.some-value,id.eq.some-value"
    this._orFilters = query.split(',').map(part => {
      const dotIdx = part.indexOf('.');
      const rest = part.slice(dotIdx + 1);
      const dotIdx2 = rest.indexOf('.');
      const col = part.slice(0, dotIdx);
      const op = rest.slice(0, dotIdx2);
      const val = rest.slice(dotIdx2 + 1);
      return { col, op, val };
    });
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this._order = { col, asc: opts?.ascending !== false };
    return this;
  }
  limit(n: number) { this._limit = n; return this; }
  single() { this._single = true; return this; }

  private getBaseData(): Row[] {
    switch (this._table) {
      case 'entities': return MOCK_ENTITIES as Row[];
      case 'startup_details': return MOCK_ENTITIES.filter(e => e.startup_details).map(e => e.startup_details!) as Row[];
      case 'investor_details': return MOCK_ENTITIES.filter(e => e.investor_details).map(e => e.investor_details!) as Row[];
      case 'funding_rounds': return MOCK_FUNDING_ROUNDS as Row[];
      case 'round_investors': return MOCK_ROUND_INVESTORS as Row[];
      case 'team_members': return MOCK_TEAM_MEMBERS as Row[];
      case 'events': return MOCK_EVENTS as Row[];
      case 'jobs': return MOCK_JOBS as Row[];
      default: return [];
    }
  }

  private matchFilter(row: Row, col: string, op: string, val: any): boolean {
    const cellVal = row[col];
    if (op === 'eq') return String(cellVal) === String(val);
    if (op === 'neq') return cellVal !== val;
    if (op === 'ilike') return typeof cellVal === 'string' && cellVal.toLowerCase().includes(String(val).replace(/%/g, '').toLowerCase());
    if (op === 'gte') return cellVal != null && cellVal >= val;
    if (op === 'in') return Array.isArray(val) && val.map(String).includes(String(cellVal));
    return true;
  }

  private applyFilters(rows: Row[]): Row[] {
    return rows.filter(row => {
      const andPasses = this._filters.every(({ col, op, val }) => this.matchFilter(row, col, op, val));
      if (!andPasses) return false;
      if (this._orFilters.length === 0) return true;
      return this._orFilters.some(({ col, op, val }) => this.matchFilter(row, col, op, val));
    });
  }

  private execute(): { data: any; error: null } {
    let rows = this.getBaseData();
    rows = this.applyFilters(rows);

    if (this._notNull) {
      rows = rows.filter(r => r[this._notNull!] != null);
    }

    if (this._order) {
      const { col, asc } = this._order;
      rows = [...rows].sort((a, b) => {
        const av = a[col] ?? '';
        const bv = b[col] ?? '';
        return asc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
    }

    if (this._limit != null) rows = rows.slice(0, this._limit);

    if (this._single) {
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }

  then(resolve: (v: any) => any, reject?: (e: any) => any) {
    return Promise.resolve(this.execute()).then(resolve, reject);
  }
}

const noopSubscription = { data: { subscription: { unsubscribe: () => {} } } };

export const mockSupabase = {
  from: (table: string) => new MockQueryBuilder(table),

  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: (_cb: any) => noopSubscription,
    signInWithPassword: async () => ({ error: { message: 'Demo mode — Supabase not connected' } }),
    signUp: async () => ({ error: { message: 'Demo mode — Supabase not connected' } }),
    signInWithOtp: async () => ({ error: { message: 'Demo mode — Supabase not connected' } }),
    signOut: async () => ({}),
  },
};
