import { Module } from '@nestjs/common';
import * as AdminJSPrisma from './prisma';
import AdminJS from 'adminjs';
import { DMMFClass } from '@prisma/client/runtime';
import { ConfigModule } from '@nestjs/config';

import { AdminModule } from '@adminjs/nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './services/prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';
import { DatabaseService } from './database/database.service';
import uploadFeature from '@adminjs/upload';
import { SupabaseProvider } from './storage/supabase.storage';
import { componentLoader, Components } from './components';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseController } from './database/database.controller';
import { DatabaseModule } from './database/database.module';

const authenticate = async (email: string, password: string) => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
  );
  //Use signUp for register
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  let response = null;

  if (data) {
    DatabaseService.userTokenMapping[data.session.user.email] =
      data.session.access_token;

    response = { email, password };
  }

  if (error) {
    console.log('Login error', error);
    response = null;
  }

  return response;
};

AdminJS.registerAdapter({
  Resource: AdminJSPrisma.Resource,
  Database: AdminJSPrisma.Database,
});

const customBefore = (request) => {
  const supabaseWithAuth = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${
            DatabaseService.userTokenMapping[request.session.adminUser.email]
          }`,
        },
      },
    },
  );
  new DatabaseService(supabaseWithAuth, 'public');

  const supabaseWithAuthPermissionSchema = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${
            DatabaseService.userTokenMapping[request.session.adminUser.email]
          }`,
        },
      },
      db: {
        schema: 'permission_schema',
      },
    },
  );
  new DatabaseService(supabaseWithAuthPermissionSchema, 'permission_schema');

  return request;
};

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AdminModule.createAdminAsync({
      useFactory: () => {
        const prisma = new PrismaService();
        const dmmf = (prisma as any)._baseDmmf as DMMFClass;
        //console.debug('check ', dmmf.modelMap['Author']['documentation']);
        return {
          adminJsOptions: {
            branding: {
              companyName: 'Book Management',
              withMadeWithLove: false,
              // logo: appSettings[0]?.setting['logoUrl'],
            },
            // dashboard: {
            //   handler: async () => {},
            //   component: AdminJS.bundle('./components/dashboard/index.tsx'),
            // },
            rootPath: '/admin',
            resources: [
              {
                resource: {
                  model: dmmf.modelMap.Book,
                  client: prisma,
                },
                options: {
                  properties: {
                    createdBy: {
                      isVisible: {
                        edit: false,
                        show: false,
                        list: false,
                        filter: false,
                      },
                    },
                    image: {
                      isVisible: false,
                    },
                  },
                  actions: {
                    list: {
                      before: [customBefore],
                    },
                    edit: {
                      before: [customBefore],
                    },
                    show: {
                      before: [customBefore],
                    },
                    delete: {
                      before: [customBefore],
                    },
                    bulkDelete: {
                      before: [customBefore],
                    },
                    new: {
                      before: [customBefore],
                    },
                    search: {
                      before: [customBefore],
                    },
                  },
                },
                features: [
                  uploadFeature({
                    provider: new SupabaseProvider({
                      bucket: 'files',
                      storageUrl: process.env.STORAGE_URL,
                      serviceKey: process.env.SUPABASE_SERVICE_KEY,
                    }),
                    properties: {
                      key: 'image',
                    },
                    validation: {
                      mimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
                    },
                  }),
                ],
              },
              {
                resource: {
                  model: dmmf.modelMap.Author,
                  client: prisma,
                },
                options: {
                  properties: {
                    createdBy: {
                      isVisible: {
                        edit: false,
                        show: false,
                        list: false,
                        filter: false,
                      },
                    },
                    avatar: {
                      isVisible: false,
                    },
                  },
                  actions: {
                    list: {
                      before: [customBefore],
                    },
                    edit: {
                      before: [customBefore],
                    },
                    show: {
                      before: [customBefore],
                    },
                    delete: {
                      before: [customBefore],
                    },
                    bulkDelete: {
                      before: [customBefore],
                    },
                    new: {
                      before: [customBefore],
                    },
                    search: {
                      before: [customBefore],
                    },
                  },
                },
                features: [
                  uploadFeature({
                    provider: new SupabaseProvider({
                      bucket: 'avatar',
                      storageUrl: process.env.STORAGE_URL,
                      serviceKey: process.env.SUPABASE_SERVICE_KEY,
                    }),
                    properties: {
                      key: 'avatar',
                    },
                    validation: {
                      mimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
                    },
                  }),
                ],
              },
              {
                resource: {
                  model: dmmf.modelMap.notes,
                  client: prisma,
                },
                options: {
                  properties: {
                    createdBy: {
                      isVisible: {
                        edit: false,
                        show: false,
                        list: false,
                        filter: false,
                      },
                    },
                  },
                  actions: {
                    list: {
                      before: [customBefore],
                    },
                    edit: {
                      before: [customBefore],
                    },
                    show: {
                      before: [customBefore],
                    },
                    delete: {
                      before: [customBefore],
                    },
                    bulkDelete: {
                      before: [customBefore],
                    },
                    new: {
                      before: [customBefore],
                    },
                    search: {
                      before: [customBefore],
                    },
                  },
                },
              },
            ],
            componentLoader,
            assets: {
              styles: ['/style.css'],
            },
            pages: {
              ErDiagram: {
                component: Components.ErDiagram,
              },
              BucketExplorer: {
                component: Components.BucketExplorer,
              },
            },
          },
          auth: {
            authenticate,
            cookieName: 'adminjs',
            cookiePassword: 'secret',
          },
          sessionOptions: {
            resave: true,
            saveUninitialized: true,
            secret: 'secret',
          },
        };
      },
    }),
    DatabaseModule,
  ],
  controllers: [AppController, DatabaseController],
  providers: [AppService],
})
export class AppModule {}
