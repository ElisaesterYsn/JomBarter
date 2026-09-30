import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** Public — no auth required. Used to populate category pickers in the UI. */
  @Get()
  @ApiOperation({ summary: 'List all active categories' })
  async findAll() {
    const categories = await this.categoriesService.findAll();
    return { categories };
  }
}
