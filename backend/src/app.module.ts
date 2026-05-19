import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { FiltersModule } from './filters/filters.module';
import { SearchModule } from './search/search.module';
import { UploadModule } from './upload/upload.module';
import { ApiModule } from './api/api.module';

@Module({
    imports: [
        PrismaModule, 
        FiltersModule, 
        SearchModule, 
        UploadModule, 
        ApiModule,
        ServeStaticModule.forRoot({
            rootPath: join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
            serveStaticOptions: { index: false }
        }),
    ],
})
export class AppModule { }
