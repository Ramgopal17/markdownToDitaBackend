let globalState = {
  data: [],
};

let taskList = [];

function getData() {
  return globalState.data;
}

function addData(newData) {
  globalState.data.push(newData);
}

function resetDitaMapData() {
  globalState.data = [];
}

function addTask(newTask) {
  taskList.push(newTask);
}

function getTaskList() {
  return taskList;
}

function resetTaskList() {
  taskList = [];
}

module.exports = {
  getData,
  addData,
  resetDitaMapData,
  addTask,
  getTaskList,
  resetTaskList,
};
