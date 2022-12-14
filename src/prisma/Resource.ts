/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
import { BaseResource, Filter, BaseRecord, flat } from 'adminjs';
import { PrismaClient } from '@prisma/client';
import { DMMF, DMMFClass } from '@prisma/client/runtime';

import { Property } from './Property';
import { lowerCase } from './utils/helpers';
import { ModelManager, Enums } from './types';
import { convertFilter, convertParam } from './utils/converters';
import { DatabaseService } from 'src/database/database.service';
import { PrismaService } from 'src/services/prisma/prisma.service';

export class Resource extends BaseResource {
  private client: PrismaClient;

  private model: DMMF.Model;

  private enums: Enums;

  private manager: ModelManager;

  private propertiesObject: Record<string, any>;

  private dmmf: DMMFClass;

  constructor(args: { model: DMMF.Model; client: PrismaClient }) {
    super(args);

    const { model, client } = args;

    this.model = model;
    this.client = client;
    const prisma = new PrismaService();
    this.dmmf = (prisma as any)._baseDmmf as DMMFClass;
    this.enums = (this.client as any)._baseDmmf.datamodelEnumMap;
    this.manager = this.client[lowerCase(model.name)];
    this.propertiesObject = this.prepareProperties();
  }

  public databaseName(): string {
    return 'prisma';
  }

  public databaseType(): string {
    return (this.client as any)._engineConfig.activeProvider ?? 'database';
  }

  public id(): string {
    return this.model.name;
  }

  public properties(): Array<Property> {
    return [...Object.values(this.propertiesObject)];
  }

  public property(path: string): Property | null {
    return this.propertiesObject[path] ?? null;
  }

  public build(params: Record<string, any>): BaseRecord {
    return new BaseRecord(flat.unflatten(params), this);
  }

  public async count(filter: Filter): Promise<number> {
    const query = this.filterQuery(filter);
    const { data } = await query;
    const results: any[] = data || [];
    return results.length;
  }

  public async find(
    filter: Filter,
    params: Record<string, any> = {},
  ): Promise<Array<BaseRecord>> {
    const { limit = 10, offset = 0, sort = {} } = params;

    const query = this.filterQuery(filter);

    if (sort?.sortBy) {
      const arg =
        sort.direction === 'asc' ? { ascending: true } : { ascending: false };
      query.order(sort.sortBy, arg);
    }
    query.order('id', { ascending: true });

    query.range(offset, offset + limit - 1);

    const { data } = await query;

    const results: any[] = data || [];

    return results.map(
      (result) => new BaseRecord(this.prepareReturnValues(result), this),
    );
  }

  public async findOne(id: string | number): Promise<BaseRecord | null> {
    const idProperty = this.properties().find((property) => property.isId());
    if (!idProperty) return null;

    const DbConnection = await DatabaseService.supabaseClient[
      this.dmmf.modelMap[this.model.name]['documentation'] ?? 'public'
    ];
    const { data } = await DbConnection.from(this.model.name)
      .select()
      .eq(idProperty.path(), convertParam(idProperty, this.model.fields, id));

    const result = data.length > 0 ? data[0] : [];
    return new BaseRecord(this.prepareReturnValues(result), this);
  }

  public async findMany(
    ids: Array<string | number>,
  ): Promise<Array<BaseRecord>> {
    const idProperty = this.properties().find((property) => property.isId());
    if (!idProperty) return [];
    const DbConnection = await DatabaseService.supabaseClient[
      this.dmmf.modelMap[this.model.name]['documentation'] ?? 'public'
    ];
    const { data } = await DbConnection.from(this.model.name)
      .select()
      .in(
        idProperty.path(),
        ids.map((id) => convertParam(idProperty, this.model.fields, id)),
      );

    const results: any[] = data || [];
    return results.map(
      (result) => new BaseRecord(this.prepareReturnValues(result), this),
    );
  }

  public async create(
    params: Record<string, any>,
  ): Promise<Record<string, any>> {
    const DbConnection = await DatabaseService.supabaseClient[
      this.dmmf.modelMap[this.model.name]['documentation'] ?? 'public'
    ];

    const userDetails = await DbConnection.auth.getUser();

    params['createdBy'] = userDetails.data.user.id;
    const preparedParams = this.prepareParams(params);
    const { data } = await DbConnection.from(this.model.name)
      .insert(preparedParams)
      .select()
      .maybeSingle();

    const result = data;

    return this.prepareReturnValues(result);
  }

  public async update(
    pk: string | number,
    params: Record<string, any> = {},
  ): Promise<Record<string, any>> {
    const idProperty = this.properties().find((property) => property.isId());
    if (!idProperty) return {};

    const preparedParams = this.prepareParams(params);

    const DbConnection = await DatabaseService.supabaseClient[
      this.dmmf.modelMap[this.model.name]['documentation'] ?? 'public'
    ];

    const result = await DbConnection.from(this.model.name)
      .update(preparedParams)
      .eq(idProperty.path(), convertParam(idProperty, this.model.fields, pk));

    return this.prepareReturnValues(result);
  }

  public async delete(id: string | number): Promise<void> {
    const idProperty = this.properties().find((property) => property.isId());
    if (!idProperty) return;

    const DbConnection = await DatabaseService.supabaseClient[
      this.dmmf.modelMap[this.model.name]['documentation'] ?? 'public'
    ];

    await DbConnection.from(this.model.name)
      .delete()
      .eq(idProperty.path(), convertParam(idProperty, this.model.fields, id));
  }

  public static isAdapterFor(args: {
    model: DMMF.Model;
    client: PrismaClient;
  }): boolean {
    const { model, client } = args;
    return (
      !!model?.name &&
      !!model?.fields.length &&
      !!client?.[lowerCase(model.name)]
    );
  }

  private prepareProperties(): { [propertyPath: string]: Property } {
    const { fields = [] } = this.model;

    return fields.reduce((memo, field) => {
      if (
        field.isReadOnly ||
        (field.relationName && !field.relationFromFields?.length)
      ) {
        return memo;
      }

      const property = new Property(
        field,
        Object.keys(memo).length,
        this.enums,
      );
      memo[property.path()] = property;

      return memo;
    }, {});
  }

  private prepareParams(params: Record<string, any>): Record<string, any> {
    const preparedParams: Record<string, any> = {};

    for (const property of this.properties()) {
      const param = flat.get(params, property.path());
      const key = property.path();

      // eslint-disable-next-line no-continue
      if (param === undefined) continue;

      const type = property.type();
      const foreignColumnName = property.foreignColumnName();

      if (type === 'reference' && foreignColumnName) {
        preparedParams[foreignColumnName] = convertParam(
          property,
          this.model.fields,
          param,
        );

        // eslint-disable-next-line no-continue
        continue;
      }

      if (property.isArray()) {
        preparedParams[key] = param
          ? param.map((p) => convertParam(property, this.model.fields, p))
          : param;
      } else {
        preparedParams[key] = convertParam(property, this.model.fields, param);
      }
    }

    return preparedParams;
  }

  private prepareReturnValues(
    params: Record<string, any>,
  ): Record<string, any> {
    const preparedValues: Record<string, any> = {};

    for (const property of this.properties()) {
      const param = flat.get(params, property.path());
      const key = property.path();

      if (param !== undefined && property.type() !== 'reference') {
        preparedValues[key] = param;
        // eslint-disable-next-line no-continue
        continue;
      }

      const foreignColumnName = property.foreignColumnName();
      // eslint-disable-next-line no-continue
      if (!foreignColumnName) continue;

      preparedValues[key] = params[foreignColumnName];
    }

    return preparedValues;
  }

  private filterQuery(filter: Filter | undefined) {
    const DbConnection =
      DatabaseService.supabaseClient[
        this.dmmf.modelMap[this.model.name]['documentation'] ?? 'public'
      ];

    const q = DbConnection.from(this.model.name).select();

    if (!filter) {
      return q;
    }

    const { filters } = filter;

    Object.entries(filters ?? {}).forEach(([key, filter]) => {
      if (typeof filter.value === 'object') {
        console.log('in if', filter.value);
        q.gte(key, filter.value.from);
        q.lte(key, filter.value.to);
      } else {
        console.log('in else', filter.value);
        q.eq(key, filter.value);
      }
    });

    return q;
  }
}
