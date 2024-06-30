'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const todoList = document.getElementById('todo-list');
  const newTaskInput = document.getElementById('new-task-input');
  const addTaskButton = document.getElementById('add-task-button');

  const editIcon = `<svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M225.9,74.78,181.21,30.09a14,14,0,0,0-19.8,0L38.1,153.41a13.94,13.94,0,0,0-4.1,9.9V208a14,14,0,0,0,14,14H92.69a13.94,13.94,0,0,0,9.9-4.1L225.9,94.58a14,14,0,0,0,0-19.8ZM94.1,209.41a2,2,0,0,1-1.41.59H48a2,2,0,0,1-2-2V163.31a2,2,0,0,1,.59-1.41L136,72.48,183.51,120ZM217.41,86.1,192,111.51,144.49,64,169.9,38.58a2,2,0,0,1,2.83,0l44.68,44.69a2,2,0,0,1,0,2.83Z"></path></svg>`;
  const editingIcon = `<svg class="editing-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg>`;
  const pinIcon = `<svg class="pin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M235.32,81.37,174.63,20.69a16,16,0,0,0-22.63,0L98.37,74.49c-10.66-3.34-35-7.37-60.4,13.14a16,16,0,0,0-1.29,23.78L85,159.71,42.34,202.34a8,8,0,0,0,11.32,11.32L96.29,171l48.29,48.29A16,16,0,0,0,155.9,224c.38,0,.75,0,1.13,0a15.93,15.93,0,0,0,11.64-6.33c19.64-26.1,17.75-47.32,13.19-60L235.33,104A16,16,0,0,0,235.32,81.37ZM224,92.69h0l-57.27,57.46a8,8,0,0,0-1.49,9.22c9.46,18.93-1.8,38.59-9.34,48.62L48,100.08c12.08-9.74,23.64-12.31,32.48-12.31A40.13,40.13,0,0,1,96.81,91a8,8,0,0,0,9.25-1.51L163.32,32,224,92.68Z"></path></svg>`;
  const pinnedIcon = `<svg class="pinned-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M224,176a8,8,0,0,1-8,8H136v56a8,8,0,0,1-16,0V184H40a8,8,0,0,1,0-16h9.29L70.46,48H64a8,8,0,0,1,0-16H192a8,8,0,0,1,0,16h-6.46l21.17,120H216A8,8,0,0,1,224,176Z"></path></svg>`;
  const deleteIcon = `<svg class="delete-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>`;

  const tasks = [];

  function addTask(taskText, pinned = false) {
    const taskItem = document.createElement('li');
    taskItem.innerHTML = `
      <input type="checkbox" class="done-chkbx" title="Mark done">
      <span>${taskText}</span>
      <div>
        <button class="edit-btn" title="Edit">${editIcon}</button>
        <button class="pin-btn" title="Pin">${pinIcon}</button>
        <button class="delete-btn" title="Delete">${deleteIcon}</button>
      </div>
    `;

    const task = {
      element: taskItem,
      text: taskText,
      pinned,
      originalIndex: tasks.length
    };

    tasks.push(task);

    if (pinned) {
      taskItem.classList.add('pinned');
      todoList.insertBefore(taskItem, todoList.firstChild);
    } else {
      todoList.appendChild(taskItem);
    }

    const checkbox = taskItem.querySelector('.done-chkbx');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        vscode.postMessage({ command: 'addCompletedTask', task: taskText });
        taskItem.remove();
      }
    });

    taskItem.scrollIntoView({ behavior: 'smooth' });
  }

  function handleAddTask() {
    const task = newTaskInput.value.trim();
    if (task !== '') {
      addTask(task);
      newTaskInput.value = '';
    }
  }

  newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  });

  function deleteTask(taskItem) {
    const index = tasks.findIndex(task => task.element === taskItem);
    if (index !== -1) {
      tasks.splice(index, 1);
    }
    todoList.removeChild(taskItem);
  }

  function toggleTaskDone(checkbox, taskItem) {
    const taskSpan = checkbox.nextElementSibling;
    if (checkbox.checked) {
      taskSpan.style.textDecoration = 'line-through';
      taskSpan.style.color = 'var(--disabledForeground)';
    } else {
      taskSpan.style.textDecoration = 'none';
      taskSpan.style.color = 'var(--foreground)';
    }
  }

  function pinTask(taskItem) {
    const isPinned = taskItem.classList.contains('pinned');
    if (!isPinned) {
      taskItem.classList.add('pinned');
      todoList.insertBefore(taskItem, todoList.firstChild);
      const pinButton = taskItem.querySelector('.pin-btn');
      pinButton.innerHTML = pinnedIcon;
      pinButton.title = "Unpin";

      const index = tasks.findIndex(task => task.element === taskItem);
      if (index !== -1) {
        tasks[index].pinned = true;
      }
    }
  }

  function unpinTask(taskItem) {
    taskItem.classList.remove('pinned');
    const pinButton = taskItem.querySelector('.pin-btn');
    pinButton.innerHTML = pinIcon;
    pinButton.title = "Pin";

    const index = tasks.findIndex(task => task.element === taskItem);
    if (index !== -1) {
      tasks[index].pinned = false;
      const originalIndex = tasks[index].originalIndex;
      
      todoList.removeChild(taskItem);
      let nextTaskIndex = tasks.findIndex((task, i) => !task.pinned && i > originalIndex);
      if (nextTaskIndex === -1) {
        todoList.appendChild(taskItem);
      } else {
        todoList.insertBefore(taskItem, tasks[nextTaskIndex].element);
      }
    }
  }

  function editTask(taskItem) {
    const taskSpan = taskItem.querySelector('span:not(.pin-icon)');
    taskSpan.classList.add('editing');
    const originalText = taskSpan.textContent;
    taskSpan.contentEditable = true;
    taskSpan.focus();

    const editButton = taskItem.querySelector('.edit-btn');
    editButton.innerHTML = editingIcon;
    editButton.title = "Editing";

    function finishEditing() {
      taskSpan.contentEditable = false;
      taskSpan.classList.remove('editing');
      editButton.title = "Edit";
      editButton.innerHTML = editIcon;

      if (taskSpan.textContent.trim() === '') {
        deleteTask(taskItem);
      }
      taskSpan.removeEventListener('blur', finishEditing);
    }

    taskSpan.addEventListener('blur', finishEditing);
    taskSpan.addEventListener('keypress', function handleKeyPress(e) {
      if (e.key === 'Enter') {
        finishEditing();
      }
    });
  }

  addTaskButton.addEventListener('click', handleAddTask);

  todoList.addEventListener('click', (e) => {
    const taskItem = e.target.closest('li');
    if (e.target.closest('.delete-btn')) {
      deleteTask(taskItem);
    } else if (e.target.closest('.pin-btn')) {
      if (taskItem.classList.contains('pinned')) {
        unpinTask(taskItem);
      } else {
        pinTask(taskItem);
      }
    } else if (e.target.closest('.edit-btn')) {
      editTask(taskItem);
    } else if (e.target.type === 'checkbox') {
      toggleTaskDone(e.target, taskItem);
    }
  });
});
