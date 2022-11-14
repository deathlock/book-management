import { SupabaseClient } from '@supabase/supabase-js';
import { Property } from '../adapter/Property';

export class ResourceInfo {
  public idProperty: Property;
  constructor(
    public readonly connection: SupabaseClient,
    public readonly tableName: string,
    public readonly properties: Property[],
  ) {
    let key = -1;
    properties.map((p, k) => {
      if (p.isId()) {
        key = k;
      }
    });

    if (key > -1) {
      this.idProperty = properties[key];
    } else {
      throw new Error(`table ${tableName} has no primary key`);
    }
  }
}
