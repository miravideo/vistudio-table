import EventEmitter from "eventemitter3";

const isImageUrl = (url) => {
  return /\.(jpg|jpeg|png|gif|bmp)$/i.test(url);
}

export class Cell extends EventEmitter {
  constructor(opt) {
    super()
    let {value, file, type} = opt
    this.value = value;
    this.file = file;

    if (!type && isImageUrl(this.value)) {
      type = 'image'
    }

    this.type = type || 'text';


  }
}