import EventEmitter from "eventemitter3";

export class Cell extends EventEmitter {
  constructor(opt) {
    super()
    const {value, file, type} = opt
    this.value = value;
    this.file = file;
    this.type = type || 'text';
  }
}