import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    InternalServerErrorException,
    Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage, diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { UploadService } from './upload.service';

import { join } from 'path';

// Ensure uploads directory exists
const uploadDir = join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: uploadDir,
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                const ext = extname(originalName);
                cb(null, `${uniqueSuffix}${ext}`);
            }
        })
    }))
    async upload(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Файл не знайдено');
        }

        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

        if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
            try {
                const fileUrl = `/uploads/${file.filename}`;
                return await this.uploadService.handleExcelUpload(file.path, originalName, fileUrl);
            } catch (error) {
                console.error('Excel parse error:', error);
                throw new InternalServerErrorException(
                    'Помилка парсингу Excel файлу. Перевірте структуру.',
                );
            }
        } else if (originalName.endsWith('.pdf')) {
            throw new BadRequestException(
                'Обробка PDF ще в процесі розробки. Використовуйте Excel.',
            );
        } else {
            throw new BadRequestException('Непідтримуваний формат файлу');
        }
    }

    @Post('document')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: uploadDir,
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                cb(null, `${uniqueSuffix}${ext}`);
            }
        })
    }))
    async uploadDocument(
        @UploadedFile() file: Express.Multer.File,
        @Body('projectId') projectId: string,
    ) {
        if (!file) {
            throw new BadRequestException('Файл не знайдено');
        }
        if (!projectId) {
            throw new BadRequestException('Не вказано projectId');
        }

        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const fileUrl = `/uploads/${file.filename}`;
        return this.uploadService.saveDocument(projectId, originalName, fileUrl);
    }
}
