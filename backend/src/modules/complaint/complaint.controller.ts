import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ComplaintStatus, UserRole } from '../../constants/enums';
import { ComplaintService } from './complaint.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { HandleComplaintDto } from './dto/handle-complaint.dto';

@Controller('complaints')
@UseGuards(AuthGuard)
export class ComplaintController {
  constructor(private readonly complaint: ComplaintService) {}

  @Get()
  list(@CurrentUser() user: { sub: string; role: UserRole }, @Query('status') status?: ComplaintStatus) {
    return this.complaint.list(user, status);
  }

  @Get(':id')
  detail(@CurrentUser() user: { sub: string; role: UserRole }, @Param('id') id: string) {
    return this.complaint.detail(user, id);
  }

  @Post()
  create(@CurrentUser() user: { sub: string; role: UserRole }, @Body() dto: CreateComplaintDto) {
    return this.complaint.create(user, dto);
  }

  @Patch(':id/handle')
  handle(@CurrentUser() user: { sub: string; role: UserRole }, @Param('id') id: string, @Body() dto: HandleComplaintDto) {
    return this.complaint.handle(user, id, dto);
  }
}
