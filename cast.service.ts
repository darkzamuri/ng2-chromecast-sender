import { Injectable, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';

declare var chrome: any;

@Injectable()
export class CastService {
    ngZone: any;

    // make receiver state publicly accessable
    private receiverWatch: any = new Subject();
    receiver$: any = this.receiverWatch.asObservable();

    session: any = null;
    namespace: any = process.env.NAMESPACE;
    applicationId: string = process.env.APPID;
    initialized: boolean = false;
    receiver: any = {};

    constructor(zone: NgZone, private route: ActivatedRoute, private r: Router) {
        this.ngZone = zone;
     }

    isCastAvailable() {
        if (!this.initialized) {
            window['__onGCastApiAvailable'] = function (loaded: any, errorInfo: any) {
                if (loaded) {
                    this.initializeCastApi();
                } else {
                    console.log(errorInfo);
                }
            }.bind(this);
        } else {
            this.receiverFound();
        }
    }

    initializeCastApi() {
        let sessionRequest = new chrome.cast.SessionRequest(this.applicationId);
        let apiConfig = new chrome.cast.ApiConfig(sessionRequest, this.sessionListener.bind(this), this.receiverListener.bind(this));
        chrome.cast.initialize(apiConfig, this.onInitSuccess.bind(this), this.onError.bind(this));
    }

    updateReceiver(data: any) {
        this.receiverWatch.next(data);
    }

    getReceiverState() {
        return this.receiver;
    }

    sessionListener(e: any) {
        this.session = e;
        if (this.session.sessionId) {
            let example = { status: this.session.statusText, castName: e.receiver.friendlyName };
            this.updateReceiver(example);
            this.addListeners();
        }
    }

    addListeners() {
        this.session.addUpdateListener(this.sessionUpdateListener.bind(this));
        this.session.addMessageListener(this.namespace, this.receiverMessage);
    }

    receiverListener(e: any) {
        if (e === chrome.cast.ReceiverAvailability.AVAILABLE) {
            this.initialized = true;
            this.receiverFound();
        }
        else {
            this.initialized = false;
        }
    }

    receiverFound() {
        this.updateReceiver({});
    }

    onInitSuccess(e: any) { }

    onSuccess(message: any, init: boolean) {
        if (init) { this.addListeners(); }
        this.updateReceiver({});
    }

    onError(message: any) {
        console.log('onError: ' + JSON.stringify(message));
        this.updateReceiver({});
    }

    sessionUpdateListener(isAlive: any) {
        if (!isAlive) {
            this.session = null;
        }
        this.updateReceiver({});
    }

    receiverMessage(namespace: any, message: any) {
        console.log('receiverMessage: ' + message);
    }

    stopApp() {
        this.session.stop(this.onStopAppSuccess, this.onError.bind(this));
    }

    onStopAppSuccess() {
        console.log('onStopAppSuccess');
        location.reload();
    }

    requestSession(message:any) {
        this.updateReceiver({});
        chrome.cast.requestSession((e: any) => {
            this.session = e;
            if(message) {
                this.session.sendMessage(this.namespace, message, this.onSuccess('Message sent: ' + message, true), this.onError.bind(this));
            }
            this.updateReceiver({});
        }, this.onError.bind(this));
    }

    sendMessage(message: any) {
        if (this.session !== null) {
            this.session.sendMessage(this.namespace, message, this.onSuccess('Message sent: ' + message, false), this.onError);
        }
        else {
            this.requestSession(message);
        }
    }

}