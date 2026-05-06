import { Controller, Get, Query } from '@nestjs/common';
import { FiltersService } from './filters.service';

@Controller('filters')
export class FiltersController {
    constructor(private readonly filtersService: FiltersService) { }

    @Get()
    getFilters(
        @Query('semester') semester?: string,
        @Query('teacher') teacher?: string,
    ) {
        return this.filtersService.getFilters(semester, teacher);
    }
}
