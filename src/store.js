import md5 from 'md5';
import {makeObservable, observable} from 'mobx';
import React from "react";
import EventEmitter from "eventemitter3";
import {Cell} from "./base";

function parseCopiedTextTo2DArray(text) {
  // 状态枚举
  const State = {
    NORMAL: 'normal',
    IN_QUOTE: 'in_quo',
    IN_QUOTE_ESCAPE: 'in_quo_esc',
  };

  // 状态变量
  let state = State.NORMAL;
  let row = [];
  let cell = '';
  const result = [];

  // 状态转移函数
  function transition(char) {
    switch (state) {
      case State.NORMAL:
        if (char === '"') {
          state = State.IN_QUOTE;
        } else if (char === '\t') {
          row.push(cell);
          cell = '';
        } else if (char === '\r') {
        } else if (char === '\n') {
          row.push(cell);
          result.push(row);
          row = [];
          cell = '';
        } else {
          cell += char;
        }
        break;
      case State.IN_QUOTE:
        if (char === '"') {
          state = State.IN_QUOTE_ESCAPE;
        } else {
          cell += char;
        }
        break;
      case State.IN_QUOTE_ESCAPE:
        if (char === '"') {
          cell += char;
          state = State.IN_QUOTE;
        } else if (char === '\t') {
          row.push(cell);
          cell = '';
          state = State.NORMAL;
        } else if (char === '\r') {
        } else if (char === '\n') {
          row.push(cell);
          result.push(row);
          row = [];
          cell = '';
          state = State.NORMAL;
        } else {
          cell += '"' + char;
          state = State.NORMAL;
        }
        break;
    }
  }

  // 处理文本
  for (const char of Array.from(text)) {
    transition(char);
  }

  // 处理剩余的单元格和行
  if (cell !== '') row.push(cell);
  if (row.length > 0) result.push(row);

  return result;
}

class Store extends EventEmitter {
  constructor(opt) {
    super();
    const { width, height, data, columns,} = opt;
    this._id = 0;
    this.data = [];
    this.columns = columns || [];
    this.width = width || 100;
    this.height = height || 100;
    this.selection = undefined;
    this.showMenu = undefined;
    this.headerInput = undefined;
    this.visibleRange = undefined;
    this.align = opt.align || 'auto';
    this.ref = React.createRef();

    this.highLightCells = []
    if (data && Array.isArray(data) && data.length > 0) {
      // init data
      this.write([0, 0], data);
    }

    makeObservable(this, {
      align: observable,
      width: observable,
      height: observable,
      columns: observable,
      data: observable,
      selection: observable,
      showMenu: observable,
      headerInput: observable,
      highLightCells: observable
    });
  }

  emitSelect(sel) {
    this.emit('select', {select: sel})
  }

  emitChange(emit=true) {
    const checksum = this.checksum();
    if (emit && this.lastCheckSum && checksum !== this.lastCheckSum) {
      this.emit('change');
    }
    this.lastCheckSum = checksum;
  }

  checksum() {
    return md5(`${this.data}`);
  }

  getRow(rowIdx=0) {
    const items = [];
    const cols = {};
    this.columns.map(c => cols[c.id] = c);
    for (let ck in this.data[rowIdx]) {
      const value = {value: this.data[rowIdx][ck]};
      value.columnInfo = cols[ck];
      items.push(value);
    }
    return items;
  }

  // async showGroupMenu(col, row, {bounds, group}) {
  //   const y = (row > this.visibleRange.y + (this.visibleRange.height * 0.5)) ? 'top' : 'bottom';
  //   const x = 'start';
  //   const items = [];
  //   if (`${this.columns[col].group}`.includes('Scene')) {
  //     items.push({ title: 'Duplicate Scene', action: () => {
  //       this.emit('duplicateScene', col)
  //     }});
  //     items.push({ title: 'Set Duration', action: () => {
  //       this.emit('setDuration', col)
  //     }});
  //   }

  //   if (items.length > 0) this.showMenu = { bounds, position: `${y}-${x}`, items };
  // }

  headerInputShow(col) {
    const bounds = this.ref.current.getBounds(col, 0);
    this.headerInput = { col, bounds, time: Date.now() };
  }

  menuShow(col, row) {
    const bounds = this.ref.current.getBounds(col, row);
    const y = (row > this.visibleRange.y + (this.visibleRange.height * 0.5)) ? 'top' : 'bottom';
    const x = /*(col > this.visibleRange.x + (this.visibleRange.width * 0.5)) ? 'end' : */'start';
    let items = [];
    items.push({ title: 'Copy', shortcut: 'Ctrl+C', action: () => {
      if (!this.selection) return;
      const data = this.getSelectionData();
      const text = data.map(row => row.join('\t')).join('\r\n');
      // console.log(`copied\n${text}`);
      navigator.clipboard.writeText(text);
    } });
    items.push({ title: 'Paste', shortcut: 'Ctrl+V', action: async () => {
      const text = await navigator.clipboard.readText();
      const data = parseCopiedTextTo2DArray(text);
      // console.log('paste', data, text);
      this.write([col, row], data);
    } });
    if (col < 0) {
      items = [];
      items.push('-');
      items.push({ title: 'Delete row', action: () => {
        this.data.splice(row, 1);
        this.data = [...this.data];
      }});
      items.push({ title: 'Insert new row above', action: () => {
        this.data.splice(row, 0, this.newRow());
        this.data = [...this.data];
      }});
      items.push({ title: 'Insert new row below', action: () => {
        this.data.splice(row + 1, 0, this.newRow());
        this.data = [...this.data];
      }});
    } else if (row < 0) {
      items = [];
      // if (this.columns[col].node.conf.type === 'text') {
      //   items.push({ title: 'Set Text', action: () => {
      //       this.emit('setText', this.columns[col])
      //   }});
      // }
      items.push('-');
      items.push({ title: 'Delete column', action: () => {
        const del = this.columns.splice(col, 1);
        this.columns = [...this.columns];
        if (del && del[0]) {
          this.data.map(row => {
            if (row[del[0].id] !== undefined) delete row[del[0].id];
          });
          this.data = [...this.data];
        }
      }});
      items.push({ title: 'Insert new column to left', action: () => {
        this.columns.splice(col, 0, { title: '', id: this.id() });
        this.reorder();
        this.fillData();
        this.columns = [...this.columns];
      }});
      items.push({ title: 'Insert new column to right', action: () => {
        this.columns.splice(col + 1, 0, { title: '', id: this.id() });
        this.reorder();
        this.fillData();
        this.columns = [...this.columns];
      }});
    }
    if (items.length > 0) this.showMenu = { bounds, position: `${y}-${x}`, items };
  }

  enlarge(size) {
    let addCols = false;
    if (size.col > this.columns.length) {
      for (let i of new Array(size.col - this.columns.length)) {
        this.columns.push({ title: '', id: this.id()});
      }
      this.reorder();
      addCols = true;
    }

    if (size.row > this.data.length) {
      for (let i of new Array(size.row - this.data.length)) {
        const d = {};
        this.columns.map(x => d[x.id] = '');
        this.data.push(d);
      }
    }

    if (addCols) this.fillData();
    // 在fillData后再来改cols，否则有数据未填充会报错
    this.columns = [...this.columns];
  }

  id(prefix='c') {
    return `${prefix}${++this._id}`;
  }

  write(target, values, emitChange=true) {
    const change = [];
    const maxCols = Math.max(...values.map(x => x.length));
    this.enlarge({ col: target[0] + maxCols, row: target[1] + values.length });
    const cids = this.columns.map(c => c.id);
    for (let row=0; row < values.length; row++) {
      for (let col=0; col < values[row].length; col++) {
        // const ck = target[0] + col;
        const ck = cids[target[0] + col];
        const value = values[row][col].value !== undefined ? values[row][col] : {value: values[row][col]}
        this.data[target[1] + row][ck] = new Cell(value);
        change.push({cell: [target[0] + col, target[1] + row]});
      }
    }
    if (this.ref?.current) this.ref.current.updateCells(change);
    this.emitChange(emitChange);
    return change;
  }

  getSelectionData() {
    let data = [];
    if (this.selection.rows.length > 0) {
      this.selection.rows.items.map(([start, end]) => {
        data = data.concat(this.rowData(start, end));
      });
    } else if (this.selection.columns.length > 0) {
      let cids = [];
      this.selection.columns.items.map(([start, end]) => {
        cids = cids.concat(this.columns.slice(start, end).map(x => x.id));
      });
      data = this.data.map(row => {
        return cids.map(id => row[id]);
      });
    } else if (this.selection?.current?.range) {
      const r = this.selection.current.range;
      for (let i = r.y; i < r.y + r.height; i++) {
        const row = [];
        for (let j = r.x; j < r.x + r.width; j++) {
          row.push(this.data[i][this.columns[j].id]);
        }
        data.push(row);
      }
    }
    return data;
  }

  rowData(start=undefined, end=undefined) {
    const data = [];
    for (let row of this.data.slice(start, end)) {
      data.push(this.columns.map(x => row[x.id]));
    }
    return data;
  }

  newRow() {
    const d = {};
    this.columns.map(x => d[x.id] = '');
    return d;
  }

  fillData() {
    this.data.map(row => {
      this.columns.map(x => row[x.id] = (row[x.id] !== undefined ? row[x.id] : new Cell({value: ''})));
    });
    this.data = [...this.data]; // trigger update
  }

  reorder() {
    // for (let i = 0; i < this.columns.length; i++) {
    //   this.columns[i].title = this.colKey(i);
    // }
  }

  colKey(n) {
    const nums26 = Array.from('ABCDEFGHIJKLMNOPQRSTVUWXYZ');
    const arr = [];
    while (n >= 0) {
      let res = n % 26;
      arr.unshift(nums26[res]);
      n = parseInt(n / 26) - 1;
    }
    return arr.join('');
  }
}

export default Store;
