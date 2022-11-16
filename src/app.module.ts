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
    const supabaseWithAuth = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        },
      },
    );
    new DatabaseService(supabaseWithAuth);

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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AdminModule.createAdminAsync({
      useFactory: async () => {
        const prisma = new PrismaService();
        const dmmf = (prisma as any)._baseDmmf as DMMFClass;

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
                  },
                },
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
                  },
                },
              },
            ],
            assets: {
              styles: ['/style.css'],
            },
          },
          auth: {
            authenticate,
            cookieName: 'adminjs',
            cookiePassword: 'secret',
          },
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
