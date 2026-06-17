import { Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { CatalogsModule } from './modules/catalogs/catalogs.module';
import { PatientsModule } from './modules/patients/patients.module';
import { CosmobiologyModule } from './modules/cosmobiology/cosmobiology.module';
import { PrismaModule } from './prisma/prisma.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import type { ServeStaticModuleOptions } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';

const resolveStaticAssetConfigs = (): ServeStaticModuleOptions[] => {
  const candidates = [
    join(process.cwd(), 'assets'),
    join(process.cwd(), 'src', 'assets'),
    join(process.cwd(), 'dist', 'assets'),
  ];

  const seen = new Set<string>();

  return candidates
    .filter((candidate) => {
      if (!existsSync(candidate)) {
        return false;
      }
      if (seen.has(candidate)) {
        return false;
      }
      seen.add(candidate);
      return true;
    })
    .map((rootPath) => ({
      rootPath,
      serveRoot: '/assets',
      serveStaticOptions: {
        index: false,
        fallthrough: false,
      },
    }));
};

const createStaticAssetModules = (): DynamicModule[] => {
  const configs = resolveStaticAssetConfigs();
  if (configs.length === 0) {
    return [];
  }
  return [ServeStaticModule.forRoot(...configs)];
};

@Module({
  imports: [
    ...createStaticAssetModules(),
    ConfigModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    CatalogsModule,
    PatientsModule,
    CosmobiologyModule,
    PrismaModule,
    DashboardModule,
    PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
