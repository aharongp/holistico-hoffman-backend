import { IsArray, IsString } from 'class-validator';

export class UpdateUserPermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissionKeys!: string[];
}
