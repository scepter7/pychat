<template>
  <div :class="mainClass">
    <chat-message-header
        :time="receivingFile.time"
        :user-id="receivingFile.userId"
    />
    <table>
      <tbody>
      <tr>
        <th>Name:</th>
        <td>{{receivingFile.fileName}}</td>
      </tr>
      <tr>
        <th>Size:</th>
        <td>{{size}}</td>
      </tr>
      <tr>
        <th>Status:</th>
        <td>{{status}}</td>
      </tr>
      <tr v-if="receivingFile.error">
        <th>Error:</th>
        <td>{{receivingFile.error}}</td>
      </tr>
      <tr v-if="receivingFile.anchor">
        <th>Download:</th>
        <td><a class="green-btn" :href="receivingFile.anchor" :download="receivingFile.fileName">Save</a></td>
      </tr>

      <tr v-if="isError">
        <th>
          Retry
        </th>
        <td><i class="icon-repeat" @click="retry"></i></td>
      </tr>
      </tbody>
    </table>
    <app-progress-bar v-if="showProgress"  class="progress-wrap-file" :upload="receivingFile.upload"/>
    <div class="yesNo" v-if="showYesNo">
      <input type="button" value="Accept" @click="accept" class="green-btn">
      <input type="button" value="Decline" @click="decline" class="red-btn">
    </div>
  </div>
</template>
<script lang="ts">
  import {Component, Prop, Vue} from "vue-property-decorator";
  import {Getter} from 'vuex-class';
  import {ReceivingFile, FileTransferStatus} from "../../types/model";
  import {bytesToSize} from "../../utils/utils";
  import AppProgressBar from "../ui/AppProgressBar";
  import ChatMessageHeader from "./ChatMessageHeader";
  import {webrtcApi} from '../../utils/singletons';

  @Component({
    components: {ChatMessageHeader, AppProgressBar}
  })
  export default class ChatReceivingFile extends Vue {
    @Prop() receivingFile: ReceivingFile;
    @Getter myId: number;
    FileTransferStatus = FileTransferStatus;

    get showYesNo(): boolean {
      return this.receivingFile.status === FileTransferStatus.NOT_DECIDED_YET;
    }
    get size(): string {
      return bytesToSize(this.receivingFile.upload.total);
    }

    get showProgress(): boolean {
      return FileTransferStatus.IN_PROGRESS === this.receivingFile.status;
    }

    get isError(): boolean {
      return this.receivingFile.status === FileTransferStatus.ERROR;
    }

    get status(): string {
      switch (this.receivingFile.status) {
        case FileTransferStatus.ERROR:
          return 'Error';
        case FileTransferStatus.IN_PROGRESS:
          return 'Downloading...';
        case FileTransferStatus.DECLINED_BY_OPPONENT:
          return 'Declined by opponent';
        case FileTransferStatus.DECLINED_BY_YOU:
          return 'Declined by you';
        case FileTransferStatus.FINISHED:
          return 'Finished';
        case FileTransferStatus.NOT_DECIDED_YET:
          return 'Waiting for approval';
      }
    }

    get mainClass(): string {
      if (this.receivingFile.userId === this.myId) {
        return 'message-self';
      } else {
        return 'message-others';
      }
    }

    retry() {
      webrtcApi.retryFile(this.receivingFile.connId, this.receivingFile.opponentWsId);
    }

    accept() {
      webrtcApi.acceptFile(this.receivingFile.connId, this.receivingFile.opponentWsId);
    }

    decline() {
      webrtcApi.declineFile(this.receivingFile.connId, this.receivingFile.opponentWsId);
    }


  }
</script>

<style lang="sass" scoped>

  .icon-repeat
    cursor: pointer

  a
    width: calc(100% - 50px)
    display: block
    text-align: center
    margin-left: 10px
    margin-right: 10px
  table
    width: 100%
    text-align: left
    th
      color: #79aeb6
      font-weight: bold
      padding-left: 5px
    td
      text-overflow: ellipsis
      max-width: 250px
      overflow: hidden
      width: 100%
      padding-left: 10px

  .progress-wrap-file /deep/ .progress-wrap
    width: calc(100% - 40px)
  .yesNo
    padding-top: 15px
    padding-bottom: 5px
    display: flex
    justify-content: space-around
    input[type=button]
      width: 100%
      &:first-child
        margin-right: 10px
</style>