import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { ApprovalGuard } from '../auth/guard/approval.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Images')
@Controller('images')
@UseGuards(JwtAuthGuard, ApprovalGuard)
@ApiBearerAuth('access-token')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload an image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (invalid file type or size)',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate folder name if provided
    const allowedFolders = ['products', 'categories', 'profiles', 'banners'];
    if (folder && !allowedFolders.includes(folder)) {
      throw new BadRequestException(
        `Invalid folder. Allowed values: ${allowedFolders.join(', ')}`,
      );
    }

    const result = await this.cloudinaryService.uploadImage(file, folder);

    // Return only essential fields to the frontend
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      folder: result.folder,
    };
  }
}
