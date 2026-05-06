import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    async upload(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Файл не знайдено');
        }

        const name = file.originalname;

        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            try {
                return await this.uploadService.handleExcelUpload(file.buffer);
            } catch (error) {
                console.error('Excel parse error:', error);
                throw new InternalServerErrorException(
                    'Помилка парсингу Excel файлу. Перевірте структуру.',
                );
            }
        } else if (name.endsWith('.pdf')) {
            throw new BadRequestException(
                'Обробка PDF ще в процесі розробки. Використовуйте Excel.',
            );
        } else {
            throw new BadRequestException('Непідтримуваний формат файлу');
        }
    }
}
