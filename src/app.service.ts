import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    console.log('success');
    return { message: 'Server is working!' };
  }
}
