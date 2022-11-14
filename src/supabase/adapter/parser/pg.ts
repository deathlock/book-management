import { PropertyType } from 'adminjs';
import KnexF, { Knex } from 'knex';
import { Property } from '../adapter/Property';
import { DatabaseInfo } from '../info/DatabaseInfo';
import { ResourceInfo } from '../info/ResourceInfo';
import { Parser } from '../typing/Parser';
import axios from 'axios';
import { SupabaseClient } from '@supabase/supabase-js';

export const pgParser: Parser = {
  parse: async (connection, dbObj) => {
    const knex = KnexF({ client: 'pg', connection: dbObj });
    const tableNames1 = await getTableNames(knex, dbObj.database);
    console.log('check tables', tableNames1);

    const supabaseURL = Object.values(connection)[0];
    const supabaseKey = Object.values(connection)[1];

    const supabaseDB = await axios.get(
      `${supabaseURL}/rest/v1/?apikey=${supabaseKey}`,
    );

    if (!supabaseDB.data.definitions) {
      console.log('No tables found');
      return;
    }
    const propertyMap = new Map<string, Property[]>();

    const tableNames = Array.from(Object.keys(supabaseDB.data.definitions));

    Object.values(supabaseDB.data.definitions).map((el: object, key) => {
      const required = el['required'];
      const properties = el['properties'];
      const columnMap = new Map<string, object>();

      const cloumnNames = Array.from(Object.keys(properties));
      Object.values(properties).map((col: object, key) => {
        columnMap.set(cloumnNames[key], col);
      });

      const props: Property[] = [];
      columnMap.forEach((prop, column) => {
        console.log('props', prop);
        const foreign = prop['description']
          ? prop['description'].split('=')
          : '';
        let foreignTable = '';
        let foreignKey = '';
        if (foreign && foreign[1]) {
          foreignTable = foreign[1]
            .match(/'(.*?)'/g)[0]
            .replace(/["']+/g, ' ')
            .trim();
        }
        if (foreign && foreign[2]) {
          foreignKey = foreign[2]
            .match(/'(.*?)'/g)[0]
            .replace(/["']+/g, ' ')
            .trim();
        }
        const isPrimary = prop['description']
          ? prop['description']?.includes('<pk/>')
          : false;
        props.push(
          new Property(
            column,
            false,
            true,
            !isPrimary,
            null,
            required.includes(column),
            prop['type'] === 'set',
            foreignTable,
            foreignKey,
            ensureType(prop['type'])
              ? ensureType(prop['type'])
              : ensureType(prop['format'])
              ? ensureType(prop['format'])
              : 'string',
            isPrimary,
            true,
          ),
        );
      });

      propertyMap.set(tableNames[key], props);
    });

    const resources = await getResources(connection, tableNames, propertyMap);

    const resourceMap = new Map<string, ResourceInfo>();
    resources.forEach((r) => {
      resourceMap.set(r.tableName, r);
    });

    return new DatabaseInfo('Supabase', resourceMap);
  },
};

async function getTableNames(
  knex: Knex,
  databaseName: string,
): Promise<string[]> {
  const query = await knex.raw(`SELECT table_name
  FROM information_schema.tables
 WHERE  table_type='BASE TABLE' AND table_schema = 'public'`);

  const [res] = await query;
  if (!res[0]) {
    console.warn(`no tables in database ${databaseName}`);
    return [];
  }
  console.log('check', res[0]);
  const key = Object.keys(res[0])[0];
  return res.map((r: any) => r[key]);
}

async function getResources(
  connection: SupabaseClient,
  tableNames: string[],
  propertyMap: Map<string, Property[]>,
): Promise<ResourceInfo[]> {
  return Promise.all(
    tableNames.map(async (tableName) => {
      return new ResourceInfo(
        connection,
        tableName,
        propertyMap.get(tableName),
      );
    }),
  );
}

function ensureType(dataType: string): PropertyType {
  switch (dataType) {
    case 'char':
    case 'varchar':
    case 'binary':
    case 'varbinary':
    case 'tinyblob':
    case 'blob':
    case 'mediumblob':
    case 'longblob':
    case 'enum':
    case 'jsonb':
    case 'set':
    case 'time':
    case 'year':
      return 'string';

    case 'tinytext':
    case 'text':
    case 'mediumtext':
    case 'longtext':
      return 'textarea';

    case 'bit':
    case 'smallint':
    case 'mediumint':
    case 'int':
    case 'integer':
    case 'bigint':
      return 'number';

    case 'float':
    case 'double':
    case 'decimal':
    case 'dec':
      return 'float';

    case 'bool':
    case 'boolean':
      return 'boolean';

    case 'date':
      return 'date';

    case 'datetime':
    case 'timestamp':
      return 'datetime';

    default:
      // console.warn(
      //   `Unexpected type: ${dataType} ${columnType} fallback to string`,
      // );
      return 'string';
  }
}
