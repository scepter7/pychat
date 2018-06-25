import loggerFactory from './loggerFactory';
import {Store} from 'vuex';
import Api from './api';
import MessageHandler from './MesageHandler';
import {AddMessagePayload, MessageLocation, SetRoomsUsers} from '../types/types';
import {MessageModel, RoomDictModel, RoomModel, RootState, SexModel, UserDictModel, UserModel} from '../types/model';
import {Logger} from 'lines-logger';
import {
  AddInviteMessage,
  AddOnlineUserMessage,
  AddRoomMessage,
  DeleteMessage,
  DeleteRoomMessage,
  EditMessage, InviteUserMessage,
  LeaveUserMessage,
  LoadMessages,
  RemoveOnlineUserMessage
} from '../types/messages';
import {MessageModelDto, RoomDto, SexModelDto, UserDto} from '../types/dto';
import {getMessageById} from './utils';


export default class ChannelsHandler extends MessageHandler {
  private logger: Logger;
  private store: Store<RootState>;
  private api: Api;
  private handlers = {
    loadMessages(lm: LoadMessages) {
      if (lm.content.length > 0) {
        let oldMessages: MessageModel[] = this.store.state.roomsDict[lm.roomId].messages;
        let oldMessagesDist = {};
        oldMessages.forEach(m => {
          oldMessagesDist[m.id] = true;
        });
        let newMesages: MessageModelDto[] = lm.content.filter(i => !oldMessagesDist[i.id]);
        let messages: MessageModel[] = newMesages.map(this.getMessage.bind(this));
        this.store.commit('addMessages', {messages, roomId: lm.roomId});
      } else {
        this.store.commit('setAllLoaded', lm.roomId);
      }
    },
    deleteMessage(message: DeleteMessage) {
      let existingMessage = getMessageById(this.store.state, message.roomId, message.id);
      if (existingMessage) {
        this.logger.log('Deleting message {}', message)();
        let newBody: MessageModel = this.getMessage(message);
        newBody.deleted = true;
        this.store.commit('deleteMessage', newBody);
      } else {
        this.logger.log('Unable to find message {} to delete it', message)();
      }
      this.store.commit('deleteMessage', message);
    },
    editMessage(message: EditMessage) {
      let existingMessage = getMessageById(this.store.state, message.roomId, message.id);
      if (existingMessage) {
        this.logger.log('Editing message {}', message)();
        this.store.commit('editMessage', this.getMessage(message));
      } else {
        this.logger.log('Unable to find message {} to edit it', message)();
      }
    },
    addOnlineUser(message: AddOnlineUserMessage) {
      if (!this.store.state.allUsersDict[message.userId]) {
        let newVar: UserModel = this.convertUser(message);
        this.store.commit('addUser', newVar);
      }
      this.store.commit('setOnline', [...message.content]);
    },
    removeOnlineUser(message: RemoveOnlineUserMessage) {
      this.store.commit('setOnline', message.content);
    },
    printMessage(inMessage: EditMessage) {
      let r: RoomModel = this.store.state.roomsDict[inMessage.roomId];
      if (r && r.messages.find(m => m.id === inMessage.id)) {
        this.logger.log('Skipping printing message {}, because it\'s already in list', inMessage.id)();
      } else {
        let message: MessageModel = this.getMessage(inMessage);
        this.logger.log('Adding message to storage {}', message)();
        let room = this.store.state.roomsDict[message.roomId];
        let index = 0;
        for (; index < room.messages.length; index++) {
          if (room.messages[index].time > message.time) {
            break;
          }
        }
        this.store.commit('addMessage', {message, index} as AddMessagePayload);
      }

    },
    deleteRoom(message: DeleteRoomMessage) {
      if (this.store.state.roomsDict[message.roomId]) {
        this.store.commit('deleteRoom', message.roomId);
      } else {
        this.logger.error('Unable to find room {} to delete', message.roomId)();
      }
    },
    leaveUser(message: LeaveUserMessage) {
      if (this.store.state.roomsDict[message.roomId]) {
        let m: SetRoomsUsers = {
          roomId: message.roomId,
          users: message.users
        };
        this.store.commit('setRoomsUsers', m);
      } else {
        this.logger.error('Unable to find room {} to kick user', message.roomId)();
      }
    },
    addRoom(message: AddRoomMessage) {
      let r: RoomModel = {
        id: message.roomId,
        volume: message.volume,
        notifications: message.notifications,
        name: message.name,
        messages: [],
        allLoaded: true,
        users: message.users
      };
      this.store.commit('addRoom', r);
    },
    inviteUser(message: InviteUserMessage) {
      this.store.commit('setRoomsUsers', {roomId: message.roomId, users: message.users} as SetRoomsUsers);
    },
    addInvite(message: AddInviteMessage) {
      let r: RoomModel = {
        id: message.roomId,
        volume: message.volume,
        notifications: message.notifications,
        name: message.name,
        messages: [],
        allLoaded: true,
        users: message.users
      };
      this.store.commit('addRoom', r);
    },
  };

  constructor(store: Store<RootState>, api: Api) {
    super();
    this.store = store;
    this.api = api;
    this.logger = loggerFactory.getLoggerColor('chat', '#940500');
  }

  protected getMethodHandlers() {
    return this.handlers;
  }

  public setUsers(users: UserDto[]) {
    this.logger.log('set users {}', users)();
    let um: UserDictModel = {};
    users.forEach(u => {
      um[u.userId] = this.convertUser(u);
    });
    this.store.commit('setUsers', um);
  }

  private convertSex(dto: SexModelDto): SexModel {
    return <SexModel>SexModel[dto];
  }

  private convertUser(u: UserDto): UserModel {
    return {
      user: u.user,
      id: u.userId,
      sex: this.convertSex(u.sex),
    };
  }

  private getMessage(message: EditMessage): MessageModel {
    return {
      id: message.id,
      time: message.time,
      files: message.files || null,
      content: message.content || null,
      symbol: message.symbol || null,
      edited: message.edited || null,
      roomId: message.roomId,
      userId: message.userId,
      giphy: message.giphy || null,
      deleted: message.deleted || null
    };
  }


  public setRooms(rooms: RoomDto[]) {
    this.logger.debug('Setting rooms')();
    let storeRooms: RoomDictModel = {};
    let roomsDict: RoomDictModel = this.store.state.roomsDict;
    rooms.forEach((newRoom: RoomDto) => {
      let oldRoom = roomsDict[newRoom.roomId];
      let rm: RoomModel = {
        id: newRoom.roomId,
        messages: oldRoom ? oldRoom.messages : [],
        name: newRoom.name,
        notifications: newRoom.notifications,
        users: [...newRoom.users],
        volume: newRoom.volume,
        allLoaded: oldRoom ? oldRoom.allLoaded : false
      };
      storeRooms[rm.id] = rm;
    });
    this.store.commit('setRooms', storeRooms);
  }

  public setOnline(online: number[]) {
    this.store.commit('setOnline', [...online]);
  }


}