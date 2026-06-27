import { MOCK_ENTITIES, MOCK_EVENTS, MOCK_JOBS, MOCK_FUNDING_ROUNDS, MOCK_ROUND_INVESTORS, MOCK_TEAM_MEMBERS } from './mockData';
import type { Entity } from './supabase';

type Row = Record<string, any>;

// ── Mutable data (reset on full page reload) ─────────────────────────────────
const _fundingRounds = MOCK_FUNDING_ROUNDS.map(r => ({ ...r })) as Record<string, any>[];
const _roundInvestors = MOCK_ROUND_INVESTORS.map(r => ({ ...r })) as Record<string, any>[];
const _teamMembers = MOCK_TEAM_MEMBERS.map(r => ({ ...r })) as Record<string, any>[];

// ── Mutable session state ─────────────────────────────────────────────────────

const DEMO_SESSION_KEY = 'startupmap_demo_session';
const SHORTLIST_KEY = 'startupmap_shortlist';

let _demoLoggedIn = sessionStorage.getItem(DEMO_SESSION_KEY) === 'true';

// Shortlist: Set of entity IDs
const _shortlist = new Set<string>(
  JSON.parse(sessionStorage.getItem(SHORTLIST_KEY) || '[]')
);

// Entity patches: sparse overrides applied on top of MOCK_ENTITIES
const _entityPatches: Record<string, Partial<Entity>> = {};
const _detailPatches: Record<string, any> = {};

function getEntities(): Entity[] {
  return MOCK_ENTITIES.map(e => {
    const patch = _entityPatches[e.id];
    const detailPatch = _detailPatches[e.id];
    if (!patch && !detailPatch) return e;
    return {
      ...e,
      ...patch,
      startup_details: e.startup_details ? { ...e.startup_details, ...(detailPatch ?? {}) } : e.startup_details,
      investor_details: e.investor_details ? { ...e.investor_details, ...(detailPatch ?? {}) } : e.investor_details,
    };
  });
}

// ── Query builder ─────────────────────────────────────────────────────────────

class MockQueryBuilder {
  private _table: string;
  private _mode: 'select' | 'update' | 'delete' | 'insert' = 'select';
  private _updateData?: any;
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

  update(data: any) { this._mode = 'update'; this._updateData = data; return this; }
  delete() { this._mode = 'delete'; return this; }

  private _insertData?: any;
  insert(data: any) { this._mode = 'insert'; this._insertData = data; return this; }

  private getBaseData(): Row[] {
    switch (this._table) {
      case 'entities': return getEntities() as Row[];
      case 'startup_details': return getEntities().filter(e => e.startup_details).map(e => e.startup_details!) as Row[];
      case 'investor_details': return getEntities().filter(e => e.investor_details).map(e => e.investor_details!) as Row[];
      case 'funding_rounds': return _fundingRounds;
      case 'round_investors': return _roundInvestors;
      case 'team_members': return _teamMembers;
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

  private getMatchedIds(): string[] {
    let rows = this.getBaseData();
    rows = this.applyFilters(rows);
    return rows.map(r => r.id ?? r.entity_id).filter(Boolean);
  }

  private execute(): { data: any; error: null } {
    if (this._mode === 'insert') {
      const row = { id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ...this._insertData };
      if (this._table === 'funding_rounds') _fundingRounds.push(row);
      else if (this._table === 'round_investors') _roundInvestors.push(row);
      else if (this._table === 'team_members') _teamMembers.push(row);
      return { data: row, error: null };
    }

    if (this._mode === 'update') {
      if (this._table === 'entities') {
        const ids = this.getMatchedIds();
        ids.forEach(id => { _entityPatches[id] = { ...(_entityPatches[id] ?? {}), ...this._updateData }; });
      } else if (this._table === 'startup_details' || this._table === 'investor_details') {
        const ids = this.getMatchedIds();
        ids.forEach(id => { _detailPatches[id] = { ...(_detailPatches[id] ?? {}), ...this._updateData }; });
      } else if (this._table === 'funding_rounds') {
        this.applyFilters(_fundingRounds).forEach(row => Object.assign(row, this._updateData));
      } else if (this._table === 'team_members') {
        this.applyFilters(_teamMembers).forEach(row => Object.assign(row, this._updateData));
      }
      return { data: null, error: null };
    }

    if (this._mode === 'delete') {
      if (this._table === 'funding_rounds') {
        const del = new Set(this.applyFilters(_fundingRounds).map(r => r.id));
        for (let i = _fundingRounds.length - 1; i >= 0; i--)
          if (del.has(_fundingRounds[i].id)) _fundingRounds.splice(i, 1);
      } else if (this._table === 'round_investors') {
        const del = new Set(this.applyFilters(_roundInvestors).map(r => r.id));
        for (let i = _roundInvestors.length - 1; i >= 0; i--)
          if (del.has(_roundInvestors[i].id)) _roundInvestors.splice(i, 1);
      } else if (this._table === 'team_members') {
        const del = new Set(this.applyFilters(_teamMembers).map(r => r.id));
        for (let i = _teamMembers.length - 1; i >= 0; i--)
          if (del.has(_teamMembers[i].id)) _teamMembers.splice(i, 1);
      }
      return { data: null, error: null };
    }

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

// ── Auth ──────────────────────────────────────────────────────────────────────

const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@startupmap.lu',
  user_metadata: { full_name: 'Demo User' },
};

const DEMO_PROFILE = {
  id: 'demo-user-id',
  full_name: 'Demo User',
  role: 'Founder',
  entity_id: '1', // Talkwalker
  is_admin: false,
};

const _authListeners: Array<(event: string, session: any) => void> = [];

function notifyListeners(event: string, session: any) {
  _authListeners.forEach(cb => cb(event, session));
}

const noopSubscription = { data: { subscription: { unsubscribe: () => {} } } };

// ── Main export ───────────────────────────────────────────────────────────────

export const mockSupabase = {
  from: (table: string) => {
    // Profiles table
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: (_col: string, _val: any) => ({
            single: async () => ({ data: _demoLoggedIn ? DEMO_PROFILE : null, error: null }),
          }),
        }),
        upsert: async () => ({ error: null }),
      };
    }

    // Saved entities (shortlist)
    if (table === 'saved_entities') {
      return {
        select: (_cols?: string) => ({
          eq: (_col: string, _val: any) => ({
            data: [..._shortlist].map(entity_id => ({ entity_id, user_id: DEMO_USER.id })),
            error: null,
            then: (resolve: any) => Promise.resolve({
              data: [..._shortlist].map(entity_id => ({ entity_id, user_id: DEMO_USER.id })),
              error: null,
            }).then(resolve),
          }),
        }),
        insert: async (row: { entity_id: string; user_id: string }) => {
          _shortlist.add(row.entity_id);
          sessionStorage.setItem(SHORTLIST_KEY, JSON.stringify([..._shortlist]));
          return { error: null };
        },
        delete: () => ({
          eq: (_col1: string, _val1: any) => ({
            eq: (col2: string, val2: any) => {
              const entityId = col2 === 'entity_id' ? val2 : _val1;
              _shortlist.delete(entityId);
              sessionStorage.setItem(SHORTLIST_KEY, JSON.stringify([..._shortlist]));
              return Promise.resolve({ error: null });
            },
          }),
        }),
      };
    }

    // Claim requests — auto-claim on email method, manual stays in review
    if (table === 'claim_requests') {
      return {
        insert: async (row: any) => {
          if (row.method === 'email') {
            _entityPatches[row.entity_id] = { ...(_entityPatches[row.entity_id] ?? {}), claimed: true };
            DEMO_PROFILE.entity_id = row.entity_id;
          }
          return { error: null };
        },
      };
    }

    return new MockQueryBuilder(table);
  },

  auth: {
    getUser: async () => ({
      data: { user: _demoLoggedIn ? DEMO_USER : null },
      error: null,
    }),
    onAuthStateChange: (cb: any) => {
      _authListeners.push(cb);
      return noopSubscription;
    },
    signInAsDemo: async () => {
      _demoLoggedIn = true;
      sessionStorage.setItem(DEMO_SESSION_KEY, 'true');
      notifyListeners('SIGNED_IN', { user: DEMO_USER });
      return { error: null };
    },
    signInWithPassword: async () => ({ error: { message: 'Demo mode — use "Continue as demo"' } }),
    signUp: async () => ({ error: { message: 'Demo mode — use "Continue as demo"' } }),
    signInWithOtp: async () => ({ error: { message: 'Demo mode — use "Continue as demo"' } }),
    signOut: async () => {
      _demoLoggedIn = false;
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      notifyListeners('SIGNED_OUT', null);
      return {};
    },
  },
};
