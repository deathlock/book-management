import { SupabaseClient } from '@supabase/supabase-js';
import {
  BaseRecord,
  BaseResource,
  Filter,
  ParamsType,
  SupportedDatabasesType,
} from 'adminjs';
import { ResourceInfo } from '../info/ResourceInfo';
import { undefinedToNull } from '../utils/object';
import { Property } from './Property';

export class Resource extends BaseResource {
  static override isAdapterFor(resource: any): boolean {
    const r = resource instanceof ResourceInfo;
    if (!r) {
      if (Array.isArray(resource) && resource[0] instanceof ResourceInfo) {
        throw new Error(
          'resource is an array. Did you forgot `...` before `db.tables()`?',
        );
      }
    }
    return r;
  }

  private propertyMap = new Map<string, Property>();
  private tableName: string;
  private _databaseName: string;
  private _properties: Property[];
  private idColumn: string;
  private supabase: SupabaseClient;
  constructor(info: ResourceInfo) {
    super(info.tableName);
    this.supabase = info.connection;
    this.tableName = info.tableName;
    this._databaseName = 'Supabase';
    this._properties = info.properties;
    this._properties.forEach((p) => {
      this.propertyMap.set(p.path(), p);
    });
    this.idColumn = info.idProperty.columnName;
  }

  override databaseName(): string {
    return this._databaseName;
  }

  override databaseType(): SupportedDatabasesType | string {
    return 'PG';
  }

  override id(): string {
    return this.tableName;
  }

  override properties(): Property[] {
    return this._properties;
  }

  override property(path: string): Property | null {
    return this.propertyMap.get(path) ?? null;
  }

  override async count(filter: Filter): Promise<number> {
    const { data } = await this.filterQuery(filter);
    return data.length;
  }

  override async find(
    filter: Filter,
    options: {
      limit?: number;
      offset?: number;
      sort?: {
        sortBy?: string;
        direction?: 'asc' | 'desc';
      };
    },
  ): Promise<BaseRecord[]> {
    const query = this.filterQuery(filter);
    if (options.limit) {
      query.limit(options.limit);
    }
    if (options.offset) {
      query.range(options.offset, options.limit);
    }
    if (options.sort?.sortBy) {
      const arg =
        options.sort.direction === 'asc'
          ? { ascending: true }
          : { ascending: false };
      query.order(options.sort.sortBy, arg);
    }

    const { data } = await query;
    const rows: any[] = data;

    return rows?.map((row) => new BaseRecord(row, this));
  }

  override async findOne(id: string): Promise<BaseRecord | null> {
    const { data } = await this.supabase
      .from(this.tableName)
      .select()
      .eq(this.idColumn, id);

    return data[0] ? this.build(data[0]) : null;
  }

  override async findMany(ids: (string | number)[]): Promise<BaseRecord[]> {
    const { data } = await this.supabase
      .from(this.tableName)
      .select()
      .in(this.idColumn, ids);

    return data?.map((r) => this.build(r));
  }

  override build(params: Record<string, any>): BaseRecord {
    return new BaseRecord(params, this);
  }

  override async create(params: Record<string, any>): Promise<ParamsType> {
    const { data } = await this.supabase
      .from(this.tableName)
      .insert(undefinedToNull(params))
      .select();

    return data;
  }

  override async update(
    id: string,
    params: Record<string, any>,
  ): Promise<ParamsType> {
    const { data } = await this.supabase
      .from(this.tableName)
      .update(undefinedToNull(params))
      .eq(this.idColumn, id)
      .select();

    return data;
  }

  override async delete(id: string): Promise<void> {
    await this.supabase.from(this.tableName).delete().eq(this.idColumn, id);
  }

  private filterQuery(filter: Filter | undefined) {
    const q = this.supabase.from(this.tableName).select();

    if (!filter) {
      return q;
    }

    const { filters } = filter;

    Object.entries(filters ?? {}).forEach(([key, filter]) => {
      if (typeof filter.value === 'object') {
        q.gte(key, filter.value.from);
        q.lte(key, filter.value.to);
      } else {
        q.eq(key, filter.value);
      }
    });

    return q;
  }
}
