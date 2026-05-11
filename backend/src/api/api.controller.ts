import { Controller, Post, Get, Delete, Patch, Body, Param, Query } from '@nestjs/common';
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
  assignTeacher(@Body() body: { studentId: string; teacherId: string; poolId: string }) {
    return this.apiService.assignTeacher(body.studentId, body.teacherId, body.poolId);
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
  createProjectRequest(@Body() body: { studentId: string; title: string; teacherId: string; poolId: string }) {
    return this.apiService.createProjectRequest(body.studentId, body.title, body.teacherId, body.poolId);
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

  // --- Pools ---
  @Get('admin/pools')
  getPools() {
    return this.apiService.getPools();
  }

  @Post('admin/pools')
  createPool(@Body() body: { name: string; year: number; semester: string; workType: string; groupPatterns: string }) {
    return this.apiService.createPool(body.name, body.year, body.semester, body.workType, body.groupPatterns);
  }

  @Post('admin/pools/:id/teachers')
  addTeacherToPool(
    @Param('id') poolId: string,
    @Body() body: { teacherId: string; capacity: number }
  ) {
    return this.apiService.addTeacherToPool(poolId, body.teacherId, body.capacity);
  }

  @Delete('admin/pools/:id/teachers/:teacherId')
  removeTeacherFromPool(
    @Param('id') poolId: string,
    @Param('teacherId') teacherId: string
  ) {
    return this.apiService.removeTeacherFromPool(poolId, teacherId);
  }

  @Patch('admin/pools/:id/teachers/:teacherId')
  updateTeacherCapacity(
    @Param('id') poolId: string,
    @Param('teacherId') teacherId: string,
    @Body('capacity') capacity: any
  ) {
    return this.apiService.addTeacherToPool(poolId, teacherId, Number(capacity));
  }

  @Delete('admin/pools/:id')
  deletePool(@Param('id') poolId: string) {
    return this.apiService.deletePool(poolId);
  }

  // --- Student Pool Endpoints ---
  @Get('student/pools')
  getAvailablePoolsForStudent(@Query('studentId') studentId: string) {
    return this.apiService.getAvailablePoolsForStudent(studentId);
  }

  @Get('student/pools/:id/teachers')
  getTeachersInPool(@Param('id') poolId: string) {
    return this.apiService.getTeachersInPool(poolId);
  }
}
