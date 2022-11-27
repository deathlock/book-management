import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { rejects } from 'assert';
import { resolve } from 'path';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  @Get('/getBuckets')
  async getBuckets() {
    const { data } = await DatabaseService.storageClient.listBuckets();
    return data;
    // const storageData = [];
    // const { data } = await DatabaseService.storageClient.listBuckets();
    // data.map(async (bucket) => {
    //   const { data, error } = await DatabaseService.storageClient
    //     .from(bucket.name)
    //     .list();
    //   const bucketData = {};
    //   bucketData['name'] = bucket.name;
    //   bucketData['type'] = 'bucket';
    //   bucketData['content'] = [];
    //   data.map(async (content) => {
    //     const { data, error } = await DatabaseService.storageClient
    //       .from(bucket.name)
    //       .list(content.name);
    //     if (!content.id) {
    //       bucketData['content'].push({
    //         name: content.name,
    //         type: 'folder',
    //         content: data,
    //       });
    //     }
    //   });
    //   storageData.push(bucketData);
    //   console.log('check data', bucketData);
    // });
  }

  @Post('/getContents')
  async getContents(@Body() buckets) {
    const finalObj = {};

    const contentPromises = buckets.bucketName.map(async (el) => {
      const { data } = await DatabaseService.storageClient.from(el.name).list();
      finalObj[el.name] = data;
    });
    Promise.all(contentPromises).then(() => {
      // console.debug('check', result);
      console.log('check', finalObj);
    });
  }
}
