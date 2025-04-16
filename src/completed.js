"use strict";

/*
  <body class="sidebar">
      <ul class="todo-list" id="todo-list"></ul>
      <script nonce="${nonce}" src="${mainUri}"></script>
  </body>
*/

document.addEventListener('DOMContentLoaded', () => {

  console.log("Hi there.");

  const todoList = document.getElementById('todo-list');
  const icons = {
    kebab: `<svg class="three-dots-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M128,96a32,32,0,1,0,32,32A32,32,0,0,0,128,96Zm0,48a16,16,0,1,1,16-16A16,16,0,0,1,128,144Zm0-64A32,32,0,1,0,96,48,32,32,0,0,0,128,80Zm0-48a16,16,0,1,1-16,16A16,16,0,0,1,128,32Zm0,144a32,32,0,1,0,32,32A32,32,0,0,0,128,176Zm0,48a16,16,0,1,1,16-16A16,16,0,0,1,128,224Z"></path></svg>`,
    delete: `<svg class="delete-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>`,
  };
  const vscode = acquireVsCodeApi();
  let workspaceTasks = [];
  let completedCount = 0;


  function adjustMarginForScrollbar() {
    const hasScrollbar = todoList.scrollHeight > todoList.clientHeight; // Check if scrollbar is present
    const listItems = todoList.querySelectorAll('li');

    listItems.forEach((item) => {
      if (hasScrollbar) {
        item.style.marginRight = '5px';
      }
      else {
        item.style.marginRight = '0';
      }
    });
  }

  function displayLists() {
    // Used in debugging
    console.log("}\nworkspaceTasks (completed View):{");
    for (let i = 0; i < workspaceTasks.length; i++) {
      console.log(workspaceTasks[i]);
    }
    console.log("}");
  }

  function addTask(taskText){
    let workspaceTask = { index: completedCount };
    const taskItem = document.createElement('li');

    console.log(`IN HERE with task text: '${taskText}'`);

    taskItem.innerHTML = `
      <input type="checkbox" class="done-chkbx" title="Mark done">
      <span class="task-txt">${taskText}</span>
      <div class="btns">
      <button class="three-dots-btn">${icons.kebab}</button>
      <button class="delete-btn" title="Delete">${icons.delete}</button>
      </div>
      `;

    adjustMarginForScrollbar();
    const taskSpan = taskItem.querySelector('.task-txt');
    const checkbox = taskItem.querySelector('.done-chkbx');
    const delet = taskItem.querySelector('.delete-btn');
    workspaceTask['text'] = taskText;

    taskSpan.style.textDecoration = 'line-through';
    taskSpan.style.color = 'var(--disabledForeground)';
    checkbox.checked = true;

    todoList.appendChild(taskItem);
    workspaceTasks.push(workspaceTask);
    completedCount++;
    displayLists();
    vscode.postMessage({ command: 'updateWorkspaceState', tasks: workspaceTasks });
  }

  window.addEventListener('message', event => {
    const message = event.data;

    if (message.command === 'moveToCompleted') {
      console.log('Just entered completed.js\n');
      
      const taskText = message.task;
      addTask(taskText);
    }

    if(message.command === 'restoreTasks'){
      message.tasks.forEach(task => {
        addTask(task.text);
      });
    }

  });

  function deleteTask(taskItem, isTransferred = false) {
    
    
    console.log('=============================');
    displayLists();
    console.log(`taskItem: ${taskItem}`);
    console.log(`Workspace Tasks len: ${workspaceTasks.length}\n0th task: `);
    console.log(workspaceTasks[0]);
    console.log('=============================');
    
    let task;
    
    for(let i=0; i<workspaceTasks.length; i++){
      if(workspaceTasks[i].text === taskItem.querySelector('.task-txt').textContent){
        task = workspaceTasks[i];
        workspaceTasks.splice(i,1);
        break;
      }
    }
    
    displayLists( );

    console.log(task);
    const taskText = task.text;
    let command;
    isTransferred ? command = "removeFromCompleted" : command = "deleteTaskNotification";
    vscode.postMessage({command: command, task: taskText});
    
    todoList.removeChild(taskItem);
    adjustMarginForScrollbar();

    if (workspaceTasks.length === 0) {
      console.log("RESETING INDEX DAWG");
      completedCount = 0;
    }

    vscode.postMessage({ command: 'updateWorkspaceState', tasks: workspaceTasks });

  }

  function toggleTaskUndone(checkbox, taskItem) {
    const taskSpan = checkbox.nextElementSibling;

    if (!checkbox.checked) {
      console.log(`taskItem: ${ taskItem }`);
      const task = taskItem;
      for (let i = 0; i < workspaceTasks.length; i++) {
        if (workspaceTasks[i].element === taskItem) {
          taskItem = workspaceTasks[i];
          console.log(`Leaving completed list view with text: ${ taskItem.text } `);
          vscode.postMessage({
            command: "removeFromCompleted",
            task: {
              text: taskItem.text, // Task text
            },
          });
          break;
        }
      }
      deleteTask(task, true);
    }

    vscode.postMessage({ command: 'updateWorkspaceState', tasks: workspaceTasks });
  }

  todoList.addEventListener('click', (e) => {
    const taskItem = e.target.closest('li');
    if (!taskItem) {
      return;
    }
    if (e.target.closest('.delete-btn')) {
      deleteTask(taskItem);
    }
    else if (e.target.type === 'checkbox') {
      toggleTaskUndone(e.target, taskItem);
    }
  });
});