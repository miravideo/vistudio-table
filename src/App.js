import React, {Component} from "react";
import {observer} from 'mobx-react-lite';
import DataEditor, {GridCellKind} from "vistudio-table";
import styled from 'styled-components';
import {useLayer} from "react-laag";
import "vistudio-table/dist/index.css";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import {Cell} from "./base";

const ColumnAddButton = styled.div`
  width: 120px;
  display: flex;
  flex-direction: column;
  background-color: #f1f1f1;
  height: 100%;

  button {
    border: none;
    outline: none;
    height: 37px;
    width: 120px;
    font-size: 20px;
    background-color: #f7f7f8;
    color: #000000dd;
    border-bottom: 1px solid #e1e2e5;
    transition: background-color 200ms;
    cursor: pointer;

    :hover {
      background-color: #efeff1;
    }
  }
`;

const cover = (videoUrl) => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.addEventListener('canplay', () => {
      video.currentTime = 0.1;
    }, {once: true})
    video.src = videoUrl;
    video.addEventListener('seeked', () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL("image/jpeg")
      resolve(image)
      video.src = '';
    }, {once: true})
  })
}

const MenuItem = styled.div`
  color: rgba(0, 0, 0, 0.9);
  cursor: default;
  width: 200px;
  height: 35px;
  font-size: 14px;
  line-height: 35px;
  font-weight: 350;
  padding: 2px 10px;

  :hover {
    background-color: #f1f1f1;
  }

  label {
    font-size: 14px;
    font-weight: 300;
    float: right;
    opacity: 0.65;
    color: rgba(0, 0, 0, 0.9);
  }
`;

const MenuSepLine = styled.div`
  width: 100%;
  height: 1px;
  background-color: #f1f1f1;
  margin: 3px 0px;
`;

const Menu = styled.div`
  box-shadow: 1px 2px 5px 2px rgb(51 51 51 / 15%);
  background-color: white;
  font-family: 'Lato', 'Source Sans Pro', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
`;

const HeaderInput = styled.div`

input {
  box-sizing: border-box !important;
  outline: none !important;
  backgound: #FFF !important;
  border: 1px solid #66F !important;
  border-radius: 3px !important;
  box-shadow: 1px 2px 5px 2px rgb(51 51 51 / 15%);
  font-size: 13px !important;
  font-weight: 700 !important;
  font-family: Helvetica, Arial, sans-serif !important;
  padding: 0 5px !important;
  color: #333 !important;
}
`;

const Row = styled.div``;

export const App = observer(({store}) => {
  const getContent = React.useCallback((cell) => {
    const [col, row] = cell;
    const ck = store.columns.map(c => c.id)[col];
    const d = store.data[row] ? store.data[row][ck] : '';
    const align = store.align === 'auto' ? (isNaN(d) ? 'left' : 'right') : store.align;
    if (d?.type === 'video' || d?.type === 'image') {
      return {
        kind: GridCellKind.Image,
        allowOverlay: true,
        readonly: false,
        data: [d.value],
      }
    }
    return {
      kind: GridCellKind.Text,
      allowOverlay: true,
      readonly: false,
      contentAlign: 'left',
      displayData: d?.value || '',
      data: d?.value || '',
    };
  });

  const onEdited = React.useCallback((cell, newValue) => {
    const [col, row] = cell;
    const ck = store.columns.map(c => c.id)[col];
    if (newValue.kind === GridCellKind.Image) {
      if (!store.data[row][ck]) store.data[row][ck] = new Cell({value: '', type: 'image'})
      store.data[row][ck].value = newValue.data;
      if (newValue.data.length === 0) {
        store.data[row][ck].type = 'text'
      }
    } else if (newValue.kind === GridCellKind.Text) {
      if (!store.data[row][ck]) store.data[row][ck] = new Cell({value: ''})
      store.data[row][ck].value = newValue.data;
    }
    store.data = [...store.data]
    store.emitChange();
  })

  const onColMove = React.useCallback((startIndex, endIndex) => {
    const col = store.columns.splice(startIndex, 1)[0];
    store.columns.splice(endIndex, 0, col);
    store.reorder();
    store.columns = [...store.columns];
    store.emitChange();
  })

  const onRowMove = React.useCallback((startIndex, endIndex) => {
    const row = store.data.splice(startIndex, 1)[0];
    store.data.splice(endIndex, 0, row);
    store.emitChange();
  })

  const onFinishEdit = React.useCallback((newValue, movement) => {
    // console.log('onFinishEdit', newValue, movement, store.data);
  })

  const onPaste = React.useCallback((target, values) => {
    store.write(target, values);
    return true;
  })

  const onColResize = React.useCallback((column, newSize, col) => {
    store.columns[col].width = newSize;
    store.columns = [...store.columns];
    store.emitChange();
  })

  const onRowAppend = React.useCallback(() => {
    store.enlarge({col: store.columns.length, row: store.data.length + 1});
    store.emitChange();
  })

  const onColAppend = React.useCallback(() => {
    store.enlarge({col: store.columns.length + 1, row: store.data.length});
    store.emitChange();
  })

  const onCellMenu = React.useCallback((target, evt) => {
    if (!store.selection) return;
    evt.preventDefault();
    const r = store.selection?.current?.range || {x: -1, y: -1, width: 0, height: 0};
    //!store.selection?.rows?.length && !store.selection?.columns?.length &&
    if (target[0] >= 0 && target[1] >= 0 &&
        !(r.x <= target[0] && target[0] < r.x + r.width &&
            r.y <= target[1] && target[1] < r.y + r.height)) {
      const sel = {...store.selection};
      sel.rows.items = [];
      sel.columns.items = [];
      if (!sel.current) sel.current = {rangeStack: []};
      sel.current.cell = target;
      sel.current.range = {
        x: target[0], y: target[1], width: 1, height: 1
      };
      store.selection = sel;
    } else if (target[0] < 0 && !store.selection?.rows?.length && store.selection?.current.cell) {
      store.selection = undefined;
      return;
    }
    // show menu;
    store.menuShow(target[0], target[1]);
  })

  const onHeaderMenu = React.useCallback((col, evt) => {
    evt.preventDefault();
    store.selection = undefined;
    if (!store.selection?.columns?.length && store.selection?.current?.cell) {
      // store.selection = undefined;
      return;
    }
    store.menuShow(col, -1);
  })

  const onHeaderClick = React.useCallback((col, evt) => {
    evt.preventDefault();
    if (store.prevHeaderClick?.col === col && Date.now() - store.prevHeaderClick?.time < 600) {
      // console.log('onHeaderDbClick');
      store.headerInputShow(col, evt.bounds);
    }
    store.prevHeaderClick = { col, time: Date.now() };
  })

  const onColumnAdd = React.useCallback((evt) => {
    evt.preventDefault();
    store.columns.push({ title: '', id: store.id() });
    store.reorder();
    store.fillData();
    store.columns = [...store.columns];
  })

  // const onGroupMenu = React.useCallback((col, evt) => {
  //   evt.preventDefault();
  //   store.selection = undefined;
  //   if (!store.selection?.columns?.length && store.selection?.current?.cell) {
  //     store.selection = undefined;
  //     return;
  //   }
  //   store.showGroupMenu(col, -1, evt);
  // })

  const onSelect = React.useCallback((sel) => {
    store.selection = sel;
    store.emitSelect(sel)
    // console.log('onSelect', JSON.stringify(sel), sel);
  })

  const onVisibleChanged = React.useCallback((range) => {
    store.visibleRange = range;
    // console.log('onVisibleChanged', range);
  })

  const {renderLayer, layerProps} = useLayer({
    isOpen: store.showMenu !== undefined,
    triggerOffset: 3,
    onOutsideClick: () => {
      store.showMenu = undefined
    },
    trigger: {
      getBounds: () => ({
        bottom: (store.showMenu?.bounds.y ?? 0) + (store.showMenu?.bounds.height ?? 0),
        height: store.showMenu?.bounds.height ?? 0,
        left: store.showMenu?.bounds.x ?? 0,
        right: (store.showMenu?.bounds.x ?? 0) + (store.showMenu?.bounds.width ?? 0),
        top: store.showMenu?.bounds.y ?? 0,
        width: store.showMenu?.bounds.width ?? 0,
      }),
    },
    placement: store.showMenu?.position || "bottom-start",
    auto: true,
    possiblePlacements: ["bottom-start", "bottom-end", "top-start", "top-end"],
  });

  const {renderLayer: renderHeaderInput, layerProps: headerInputProps} = useLayer({
    isOpen: store.headerInput !== undefined,
    triggerOffset: 0,
    onOutsideClick: () => {
      // todo: hide when scroll
      // debounce, since evt could not stopPropagation
      if (Date.now() - store.headerInput?.time < 500) return;
      store.headerInput = undefined
    },
    trigger: {
      getBounds: () => ({
        bottom: (store.headerInput?.bounds.y ?? 0) + (store.headerInput?.bounds.height ?? 0),
        height: store.headerInput?.bounds.height ?? 0,
        left: store.headerInput?.bounds.x ?? 0,
        right: (store.headerInput?.bounds.x ?? 0) + (store.headerInput?.bounds.width ?? 0),
        top: store.headerInput?.bounds.y ?? 0,
        width: store.headerInput?.bounds.width ?? 0,
      }),
    },
    placement: "top-start",
    auto: true,
    possiblePlacements: ["top-start"],
  });

  const onDragOverCell = React.useCallback((cell) => {
    store.highLightCells = [{color: "#44BB0022", range: {x: cell[0], y: cell[1], width: 1, height: 1}}]
  })

  const onDrop = React.useCallback(async (cell, dataTransfer) => {
    if (dataTransfer === null) {
      return;
    }

    const {files} = dataTransfer;
    // This only supports one image, for simplicity.
    if (files.length < 1) {
      return;
    }

    const images = []
    for (const file of files) {
      const type = file.type.split('/')[0]
      let value = file.name;
      if (type === 'video') {
        value = await cover(URL.createObjectURL(file))
      } else if (type === 'image') {
        value = URL.createObjectURL(file);
      }

      images.push([{file: URL.createObjectURL(file), type, value}]);
    }

    if (images.length > 0) store.write(cell, images)

    store.highLightCells = [];
  })

  return (
      <div>
        <DataEditor width={store.width} height={store.height} ref={store.ref}
                    columns={store.columns} rows={store.data.length}
                    minColumnWidth={50} maxColumnWidth={350}
                    getCellContent={getContent} onCellEdited={onEdited}
                    onFinishedEditing={onFinishEdit} onPaste={onPaste}
                    onColumnMoved={onColMove} onColumnResize={onColResize}
                    onRowAppended={onRowAppend}
                    onRowMoved={onRowMove}
                    highlightRegions={store.highLightCells}
                    onDrop={onDrop}
                    onCellContextMenu={onCellMenu}
                    onHeaderClicked={onHeaderClick}
                    onHeaderContextMenu={onHeaderMenu}
                    // onGroupHeaderContextMenu={onGroupMenu}
                    onVisibleRegionChanged={onVisibleChanged}
                    onGridSelectionChange={onSelect} gridSelection={store.selection}
                    onDragOverCell={onDragOverCell}
                    trailingRowOptions={{hint: ""}}
                    smoothScrollX={true}
                    smoothScrollY={true}
                    rightElement={
                    <ColumnAddButton>
                      <button onClick={onColumnAdd}>+</button>
                    </ColumnAddButton>
                    }
                    rightElementProps={{
                      fill: false,
                      sticky: false,
                    }}
                    keybindings={{search: true}}
                    getCellsForSelection={true}
                    isDraggable={false} // 先disable，之后改为拖文件之后再动态打开
                    rowMarkers="both"/>
        {store.showMenu !== undefined &&
            renderLayer(
                <Menu
                    {...layerProps}
                    style={{...layerProps.style}}>
                  {store.showMenu.items.map((item, i) => (
                      <Row key={`a${i}`}>
                        {typeof (item) === 'string' ? (
                            <MenuSepLine></MenuSepLine>
                        ) : (
                            <MenuItem onClick={() => {
                              item.action();
                              store.showMenu = undefined;
                            }}>
                              {item.title}
                              {item.shortcut ? (<label>{item.shortcut}</label>) : ''}
                            </MenuItem>
                        )}
                      </Row>
                  ))}
                </Menu>
            )}
        {store.headerInput !== undefined &&
            renderHeaderInput(
                <HeaderInput
                    {...headerInputProps}
                    style={{...headerInputProps.style}}>
                  <input value={store.columns[store.headerInput.col].title} style={{
                    width: store.headerInput.bounds.width,
                    height: store.headerInput.bounds.height + 2
                  }} onChange={e => {
                    store.columns[store.headerInput.col].title = e.target.value;
                    store.columns = [...store.columns];
                  }} onBlur={e => {
                    store.headerInput = undefined;
                  }} onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      e.target.blur();
                    }
                  }} autoFocus={true}></input>
                </HeaderInput>
            )}
      </div>
  );
});