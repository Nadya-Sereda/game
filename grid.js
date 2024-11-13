import { Cell } from "./cell.js";
import { deepClone } from "./utils.js";
//import { Sprite } from "sprite.js";

export class Grid {
  isGameBlocked = false;
  isLevelStop = false;
  cells = [];
  cellSelected = null;
  cellsSelected = [];
  sprite = [];
  neighborArr = [
    [-1, 0],
    [1, 0],
    [0, 1],
    [0, -1]
  ];
  dropStates;
  count = 0;
  
  constructor(canvas, matrix, rowsCount, columnsCount) {
    this.canvas = canvas;
    this.matrix = matrix;
    this.columnsCount = columnsCount;
    this.rowsCount = rowsCount;
    this.createCells(); 
  }

  createCells() {
    for(let row = 0; row < this.matrix.length; row++) {
      for(let column = 0; column < this.matrix[0].length; column++) {
        this.createCell(row, column, this.matrix[row][column]);
      }
    }
  }

  createCell(row, column, value) {
    const cell = new Cell(this.canvas, row, column, value, this.handleCell);
    this.cells.push(cell);
  }

  handleCell = (row, column) => {
    if (this.isGameBlocked) return
    const totalScore = document.querySelector('.total-count').innerText = this.count;

    this.cellSelected = this.findCellBy(row, column);
    this.findNeighbor(this.cellSelected.row, this.cellSelected.column, this.cellSelected);
    
    if (this.cellsSelected.length > 0) {
      for (let i = 0; i < this.cellsSelected.length; i++) {
        this.findNextNeighbor(this.cellsSelected[i].row, this.cellsSelected[i].column, this.cellsSelected[i])
      }
  
      for (let i = 0; i < this.cellsSelected.length; i++) {
        this.deleteElement(this.cellsSelected[i]);
      }

      this.dropStates = deepClone(this.matrix);
     
      //const event = new CustomEvent('drop');
      //this.canvas.dispatchEvent(event);
  //
      this.dropElements();
      this.drop();
    }
  }

  findCellBy(row, column) {
    return this.cells.find(cell => cell.row === row && cell.column === column);
  }

  findNeighbor(row, column, cell) {
    for (let i = 0; i < this.neighborArr.length; i++) {
      let item = this.findCellBy(row + this.neighborArr[i][0], column + this.neighborArr[i][1]);
      if (item) {
        let id = item.cellElement.id;
        let elem = this.cellsSelected.find(element => element === item);
        if (cell.cellElement.id == id && elem === undefined) {
          this.cellsSelected.push(item);
          this.findNextNeighbor(item.row, item.column, item);
        }
      } 
    }
    let elem = this.cellsSelected.find(element => element === cell);
    if (this.cellsSelected.length > 0 && elem === undefined) {
      this.cellsSelected.push(cell);
    }
  }

  findNextNeighbor(row, column, cell) {
    for (let i = 0; i < this.neighborArr.length; i++) {
      let item2 = this.findCellBy(row + this.neighborArr[i][0], column + this.neighborArr[i][1]);
      if (item2) {
        let id = item2.cellElement.id;
        let elem = this.cellsSelected.find(element => element === item2);
        if (cell.cellElement.id == id && elem === undefined) {
          this.cellsSelected.push(item2);
        }
      } 
    }
  }

  deleteElement(item) {
    this.matrix[item.row][item.column] = null;
  }

  cloneMatrix() {
    this.dropStates.push(deepClone(this.matrix));
  }

  dropElements() {
    for (let column = 0; column < this.columnsCount; column++) {
      this.dropElementsInColumn(column);
    }
  }

  dropElementsInColumn(column) {
    let emptyIndex;
    for (let row = this.rowsCount - 1; row >= 0; row--) {
      if (this.matrix[row][column] === null) {
        emptyIndex = row;
        break;
      }
    }
    if (emptyIndex === undefined) return
    
    for (let row = emptyIndex - 1; row >= 0; row--) {
      if (this.matrix[row][column] !== null) {
        this.matrix[emptyIndex][column] = this.matrix[row][column];
        this.matrix[row][column] = null;
        emptyIndex--;
      }
    }
  }

  countDeletedElement(count) {
    let currentCount = 5 * this.cellsSelected.length * this.cellsSelected.length;
    this.count += currentCount;
    return this.count;
  }

  async isColumnEmpty() {
    let emptyIndex;
    for (let column = 0; column < this.columnsCount; column++) {
      if (this.matrix[this.rowsCount - 1][column] === 0) {
        emptyIndex = column;
        break
      }
    }
    if (emptyIndex === undefined) return
    this.deleteColumn(emptyIndex, this.matrix);
    this.moveColumns(emptyIndex);
    this.moveColumns2();
  }

  async moveColumns(column) {
    const animations = [];
    this.cells.forEach((item) => {
      if (item && item.column > column) {
        const position = {row: item.row, column: item.column - 1};
        const cellAnimation = this.moveCellTo(item, position);
        animations.push(cellAnimation);
      }
    });
    await Promise.all(animations);
  }

  async moveColumns2() {
    const animations = [];
    for (let column = 0; column < this.columnsCount; column++) {
      if (this.matrix[this.rowsCount - 1][column] === 0) {
        this.cells.forEach((item) => {
          if (item && item.column > column) {
            const position = {row: item.row, column: item.column - 1};
            const cellAnimation = this.moveCellTo(item, position);
            animations.push(cellAnimation);
          }
        });
        this.deleteColumn(column, this.matrix);
      }
    }
    await Promise.all(animations);
  }

  deleteColumn(column, grid) {
    grid = grid.forEach(item => item.splice(column, 1));
    this.columnsCount = this.columnsCount - 1;
  }
  
  async moveCellTo(cell, position) {
    cell.setPosition(position.row, position.column);
    await cell.waitForTransitionEnd();
  }

  async drop() {
    this.isGameBlocked = true;
    await this.removeCell(this.dropStates);
    await this.dropCells(this.dropStates);
    this.count = this.countDeletedElement(this.count);
    this.isColumnEmpty();
    this.dropStates = null;
    this.updateMatrix();
    this.cellsSelected = [];
    this.isGameBlocked = false;
    this.levelStop();
      if(this.isLevelStop) {
        await this.finaleLevel();
        this.cells = [];
        console.log(this.cells)
        const count = this.count;
        const event = new CustomEvent('newLevelStart', {
          detail: {
            count
          }
        });
        this.canvas.dispatchEvent(event);
      }
  }

  async removeCell(grid) {
    const animations = [];
    for (let row = 0; row < grid.length; row++) {
      for (let column = 0; column < grid.length; column++) {
        if (grid[row][column] === null) {
          const cell = this.findCellBy(row, column);
          const cellAnimation = cell.remove();
          this.removeCellFromArrayBy(row, column);
          animations.push(cellAnimation);
        }
      }
    }
    await Promise.all(animations);
  }

  removeCellFromArrayBy(row, column) {
    this.cells = this.cells.filter(cell => cell.row !== row || cell.column !== column);
  }

  async dropCells(grid) {
    const animations = [];
    for (let column = 0; column < grid.length; column++) {
      const columnArr = grid.map(elementsInRow => elementsInRow[column]);
      if (columnArr.includes(null)) {
        const columnAnimation =  this.dropCellsInColumn(columnArr, column);
        animations.push(columnAnimation);
      }
    }
    await Promise.all(animations);
  }

  async dropCellsInColumn(arr, column) {
    const animations = [];
    const columnArr = arr.filter(num => num !== 0).length;
    const fin = arr.length - columnArr + 1;
    for (let row = arr.length - 1; row >= fin; row--) {
      if (arr[row] === null && arr[row - 1] !== null) {
        const cell = this.findCellBy(row - 1, column);
        let countEmpty = 0;
        while (arr[row + countEmpty] === null) {
          countEmpty += 1;
        }
        let pos = {row: cell.row + countEmpty, column: column}
        const cellAnimation = this.moveCellTo(cell, pos);
        arr[row + countEmpty - 1] = arr[row - 1];
        arr[row - 1] = null;
        animations.push(cellAnimation);
      }
    }
    await Promise.all(animations);
  }

  updateMatrix() {
    for(let row = 0; row < this.rowsCount; row++) {
      for(let column = 0; column < this.columnsCount; column++) {
        if (this.matrix[row][column] === null) {
          this.matrix[row][column] = 0;
        }
      }
    }
  }

  levelStop() {
    for(let row = 0; row < this.rowsCount; row++) {
      for(let column = this.columnsCount - 1; column >= 0; column--) {
        let item = this.findCellBy(row, column);
        if (item) {
          for (let i = 0; i < this.neighborArr.length; i++) {
            let item2 = this.findCellBy(row + this.neighborArr[i][0], column + this.neighborArr[i][1]);
            if (item2 && item.cellElement.id === item2.cellElement.id) {
              this.isLevelStop = false;
              return;
            }
          }
        }
      }
    }
    this.isLevelStop = true;
  }

   async finaleLevel() {
    const animations = [];
    const cellAnimation = this.cells.forEach(cell => cell.remove())
    //this.cells.forEach(cell => cell.cellElement.classList.add('fin'))
    animations.push(cellAnimation);
    await Promise.all(animations);
  }

  //removeAllCells() {
  //  let child = this.canvas.lastElementChild;
//
  //  while (child) {
  //    console.log(child)
  //    child.cell.remove()
  //    child = this.canvas.lastElementChild;
  //  }
  //  this.cells = [];
  //}
}