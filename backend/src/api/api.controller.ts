import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller('api')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('auth/login')
  login(@Body() body: any) {
    return this.apiService.login(body);
  }

  @Post('auth/register')
  register(@Body() body: any) {
    return this.apiService.register(body);
  }

  @Get('users')
  getUsers(@Query('role') role?: string) {
    return this.apiService.getUsers(role);
  }

  @Post('admin/assign-teacher')
  assignTeacher(@Body() body: { studentId: string; teacherId: string }) {
    return this.apiService.assignTeacher(body.studentId, body.teacherId);
  }

  @Post('admin/change-role')
  changeRole(@Body() body: { userId: string; newRole: string }) {
    return this.apiService.changeRole(body.userId, body.newRole);
  }

  @Get('projects')
  getProjects(@Query('userId') userId: string, @Query('role') role: string) {
    return this.apiService.getProjects(userId, role);
  }

  @Post('projects')
  createProjectRequest(@Body() body: { studentId: string; title: string; teacherId: string }) {
    return this.apiService.createProjectRequest(body.studentId, body.title, body.teacherId);
  }

  @Post('projects/:id/approve')
  approveProject(@Param('id') id: string) {
    return this.apiService.approveProject(id);
  }

  @Post('projects/:id/reject')
  rejectProject(@Param('id') id: string) {
    return this.apiService.rejectProject(id);
  }

  @Post('projects/:id/change-title')
  requestTitleChange(@Param('id') id: string, @Body('proposedTitle') proposedTitle: string) {
    return this.apiService.requestTitleChange(id, proposedTitle);
  }

  @Post('projects/:id/approve-title')
  approveTitleChange(@Param('id') id: string) {
    return this.apiService.approveTitleChange(id);
  }

  @Post('chapters/:id/submit')
  submitChapter(@Param('id') id: string) {
    return this.apiService.submitChapter(id);
  }

  @Post('chapters/:id/approve')
  approveChapter(@Param('id') id: string) {
    return this.apiService.approveChapter(id);
  }

  @Post('chapters/:id/rework')
  reworkChapter(@Param('id') id: string) {
    return this.apiService.reworkChapter(id);
  }
}
