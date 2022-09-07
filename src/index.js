import React from "react";
import ReactDOM from "react-dom";
import { App, getData, reloadData } from "./App.js";
import Store from "./store";

const VERSION = '$VERSION';

class MiraTable {
  constructor(container, options) {
    this.version = VERSION;
    this.options = options;
    this.store = new Store(this.options.data);
    ReactDOM.render(<App store={this.store} />, container);
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