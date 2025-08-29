import { Module } from '@nestjs/common';
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

@Module({
  imports: [ConfigModule, AuthModule, UsersModule, CompaniesModule, CatalogsModule, PatientsModule, CosmobiologyModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
