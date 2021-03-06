import Xhr from './Xhr';
import {CONNECTION_ERROR, RESPONSE_SUCCESS} from './consts';
import {UploadFile} from '../types/types';
import {MessageModelDto} from '../types/dto';
import {DefaultMessage, ViewUserProfileDto} from '../types/messages';
import MessageHandler from './MesageHandler';
import loggerFactory from './loggerFactory';
import {Logger} from 'lines-logger';
import Http from './Http';
import {sub} from './sub';

export default class Api extends MessageHandler {
  private readonly  xhr: Http;
  protected readonly handlers: { [p: string]: SingleParamCB<DefaultMessage> } = {
    internetAppear: this.internetAppear
  };

  private internetAppear(m: DefaultMessage) {
    if (this.retryFcb) {
      this.retryFcb();
    }
  }

  private retryFcb: Function = null;

  protected readonly logger: Logger;

  constructor(xhr: Http) {
    super();
    sub.subscribe('lan', this);
    this.logger = loggerFactory.getLoggerColor('api', 'red');
    this.xhr = xhr;
  }

  public login(form: HTMLFormElement, cb: ErrorCB<string>) {
    this.xhr.doPost<any>({
      url: '/auth',
      formData: new FormData(form),
      cb
    });
  }


  public sendLogs(issue: string, browser: string, cb: SingleParamCB<string> = null) {
    this.xhr.doPost<string>({
      url: '/report_issue',
      params: {issue, browser},
      cb: this.getResponseSuccessCB(cb),
    });
  }

  public search(data: string, room: number, offset: number, cb: ErrorCB<MessageModelDto[]>): XMLHttpRequest {
   return this.xhr.doPost<MessageModelDto[]>({
      url: '/search_messages',
      params: {data, room, offset},
      isJsonDecoded: true,
      cb
    });
  }

  public changePassword(old_password: string, password: string, cb: SingleParamCB<string>) {
    return this.xhr.doPost<MessageModelDto[]>({
      url: '/change_password',
      params: {old_password, password},
      cb: this.getResponseSuccessCB(cb)
    });
  }

  public logout(cb: SingleParamCB<string>, registration_id: string = null) {
    this.xhr.doPost({
      url: '/logout',
      params: {registration_id},
      cb: (d, e) => {
        if (e) {
          e = `Error while logging out ${e}`;
        }
        cb(e);
      }
    });
  }

  public sendRestorePassword(form: HTMLFormElement, cb: SingleParamCB<string>) {
    this.xhr.doPost({
      url: '/send_restore_password',
      formData: new FormData(form),
      cb: this.getResponseSuccessCB(cb)
    });
  }

  public register(form: HTMLFormElement, cb: ErrorCB<string>) {
    this.xhr.doPost<string>({
      url: '/register',
      formData: new FormData(form),
      cb
    });
  }

  public googleAuth(token, cb) {
    this.xhr.doPost({
      url: '/google-auth',
      params: {
        token
      },
      cb,
    });
  }

  public facebookAuth(token, cb) {
    this.xhr.doPost({
      url: '/facebook-auth',
      params: {
        token
      },
      cb,
    });
  }

  public statistics(cb) {
    this.xhr.doGet('/statistics', cb, true);
  }

  public loadGoogle(cb) {
    this.xhr.loadJs('https://apis.google.com/js/platform.js', cb);
  }

  public loadFacebook(cb) {
    this.xhr.loadJs('//connect.facebook.net/en_US/sdk.js', cb);
  }

  public loadRecaptcha(cb) {
    this.xhr.loadJs('https://www.google.com/recaptcha/api.js', cb);
  }


  public registerFCB(registration_id: string, agent: string, is_mobile: boolean, cb: SingleParamCB<string> = undefined) {
    this.xhr.doPost({
      url: '/register_fcb',
      params: {
        registration_id,
        agent,
        is_mobile
      },
      cb: this.getResponseSuccessCB(d => {
        if (d === CONNECTION_ERROR) {
          this.retryFcb = () => {
            this.registerFCB(registration_id, agent, is_mobile);
          };
        } else {
          this.retryFcb = null;
        }
        if (cb) {
          cb(d);
        }
      })
    });
  }


  public validateUsername(username: string, cb: SingleParamCB<string>) {
    this.xhr.doPost({
      url: '/validate_user',
      params: {username},
      cb: this.getResponseSuccessCB(cb)
    });
  }

  private getResponseSuccessCB(cb: SingleParamCB<string>) {
    return (data, error) => {
      if (!cb) {
      } else if (error) {
        cb(error);
      } else if (data === RESPONSE_SUCCESS) {
        cb(null);
      } else if (data) {
        cb(data);
      } else {
        cb('Unknown error');
      }
    };
  }

  public sendRoomSettings(roomName, volume, notifications, roomId, cb: SingleParamCB<string>) {
    this.xhr.doPost( {
      url: '/save_room_settings',
      params: {roomName, volume, notifications, roomId},
      cb: this.getResponseSuccessCB(cb)
    });
  }

  public uploadProfileImage(file: Blob, cb: SingleParamCB<string>) {
    let fd = new FormData();
    fd.append('file', file);
    this.xhr.doPost<string>( {
      url: '/upload_profile_image',
      formData: fd,
      cb: this.getResponseSuccessCB(cb)
    });
  }

  public showProfile(id: number, cb: ErrorCB<ViewUserProfileDto>) {
    this.xhr.doGet<ViewUserProfileDto>(`/profile/${id}`, cb, true);
  }


  public uploadFiles(files: UploadFile[], cb: ErrorCB<number[]>, progress: Function) {
    let fd = new FormData();
    files.forEach(function(sd) {
      fd.append(sd.type + sd.symbol, sd.file, sd.file.name);
    });
    this.xhr.doPost<number[]>({
      url: '/upload_file',
      isJsonDecoded: true,
      formData: fd,
      process: r => {
        r.upload.addEventListener('progress', progress);
      },
      cb});
  }

  public validateEmail(email: string, cb: SingleParamCB<string>) {
    this.xhr.doPost({
      url: '/validate_email',
      params: {email},
      cb: this.getResponseSuccessCB(cb)
    });
  }

  public verifyToken(token: string, cb) {
    this.xhr.doPost({
      url: '/verify_token',
      isJsonDecoded: true,
      params: {token},
      cb: (d: any, e) => {
        if (e) {
          cb(null, e);
        } else if (d && d.message === RESPONSE_SUCCESS) {
          cb(d.restoreUser);
        } else {
          cb(null, d.message);
        }
      }
    });
  }

  acceptToken(token: string, password: string, cb) {
    this.xhr.doPost({
      url: '/accept_token',
      params: {token, password},
      cb: this.getResponseSuccessCB(cb)
    });
  }
}