import { Injectable } from '@angular/core';
import { CastService } from './cast.service';

@Injectable()
export class MessageService {

    constructor(public castService: CastService) {
        castService.receiver$.subscribe((data: any) => {
            this.updateReceiver(data);
        });
    }

    updateReceiver(data: any) {
        console.log(data);
    }

    sendMessage(message: any) {
        this.castService.sendMessage(message);
    }

    stopCasting() {
        this.castService.stopApp();
    }
}
