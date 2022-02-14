import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NFTBlockTaskService } from './nft-block-task.service';
import {
  NFTBlockTask,
  NFTBlockTaskSchema,
} from './schemas/nft-block-task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NFTBlockTask.name, schema: NFTBlockTaskSchema },
    ]),
  ],
  providers: [NFTBlockTaskService],
  exports: [NFTBlockTaskService],
})
export class NFTBlockTaskModule {}
