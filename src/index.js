import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App.js";
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
    const { width, height } = innerSize(container);
    this.options = {width, height, ...(options || {})};
    if (this.options.transpose && this.options.data) {
      this.options.data = this.transpose(this.options.data);
    }
    this.store = new Store(this.options);
    ReactDOM.render(<App store={this.store}/>, container);

    if (!document.getElementById('portal')) {
      const portal = document.createElement('div');
      portal.id = 'portal';
      portal.style.position = 'fixed';
      portal.style.left = '0';
      portal.style.top = '0';
      portal.style.zIndex = 9999;
      document.body.append(portal);
    }
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
    return this.options.transpose ? this.transpose(data) : data;
  }

  set data(data) {
    this.store.columns = [];
    this.store.data = [];
    return this.store.write([0, 0], 
      this.options.transpose ? this.transpose(data) : data, 
      !!this.options.emitOnSet);
  }

  transpose(data) {
    return data[0].map((col, i) => {
      return data.map((row) => {
        return row[i];
      })
    });
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