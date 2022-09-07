import React from "react";
import ReactDOM from "react-dom";
import { App, getData, reloadData } from "./App.js";
import Store from "./store";

const VERSION = '$VERSION';

const innerSize = (element) => {
  const computed = window.getComputedStyle(element);
  const paddingVer = parseInt(computed.paddingTop) + parseInt(computed.paddingBottom);
  const paddingHor = parseInt(computed.paddingLeft) + parseInt(computed.paddingRight);
  const width = element.clientWidth - paddingHor;
  const height = element.clientHeight - paddingVer;
  return { width, height };
}

class MiraTable {
  constructor(container, options) {
    this.version = VERSION;
    this.options = options || {};
    const { width, height } = innerSize(container);
    if (!this.options.width) this.options.width = width;
    if (!this.options.height) this.options.height = height;
    this.store = new Store(this.options);
    ReactDOM.render(<App store={this.store}/>, container);
  }

  resize(width, height) {
    [this.store.width, this.store.height] = [width, height];
  }

  get width() {
    return this.store.width;
  }

  get height() {
    return this.store.height;
  }

  get data() {
    const data = this.store.rowData();
    while (data[data.length-1].every(x => x === '')) {
      data.splice(data.length-1, 1);
    }
    return data;
  }

  set data(data) {
    this.store.columns = [];
    this.store.data = [];
    return this.store.write([0, 0], data);
  }

  on(event, callback) {
    this.store.on(event, callback);
  }

  off(event, callback) {
    this.store.off(event, callback);
  }

  once(event, callback) {
    this.store.once(event, callback);
  }
}

export default (container, options) => {
  return new MiraTable(container, options);
}