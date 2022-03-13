import classnames from 'classnames'
import { createEffect, createSignal, onCleanup, For } from 'solid-js'
import { v4 as generateId } from 'uuid'

import Fab from '../Fab/Fab'
import TextField from '../TextField'
import TodoCard from '../TodoCard'
import Switch from '../Switch'

import styles from './TodoList.module.css'
import TodoEditPanel from '../TodoEditPanel'
import { TodoItem } from '../../types/TodoItem'

export default function TodoList() {
  const [getTodoItems, setTodoItems] = createSignal<TodoItem[]>([])
  const [getEnterMultiple, setUseMultipleEntries] = createSignal(false)
  const [getInputValue, setInputValue] = createSignal('')
  const [getIsFocused, setIsFocused] = createSignal(false)
  const [getInputIsOpen, setInputIsOpen] = createSignal(false)
  const [getInputIsExiting, setInputIsExiting] = createSignal(false)
  const [getSelectedItemId, setSelectedItemId] = createSignal<string>()

  const getSelectedItem = () =>
    getTodoItems().find((item) => item.id === getSelectedItemId())

  const getIncompleteItems = () =>
    getTodoItems().filter((item) => !item.isCompleted)
  const getCompletedItems = () =>
    getTodoItems().filter((item) => item.isCompleted)

  const addTodoItem = (title: string) => {
    setTodoItems([
      ...getTodoItems(),
      {
        id: generateId(),
        title,
        isCompleted: false,
        dateCreated: new Date(),
        dateCompleted: undefined,
      },
    ])
    setInputValue('')
  }

  const closeAddTodoItemPrompt = () => {
    setInputIsExiting(true)
  }

  const removeTodoItem = (id: string) => {
    setTodoItems(getTodoItems().filter((item) => item.id !== id))
  }

  const completeTodoItem = (id: string) => {
    const todoItems = () =>
      getTodoItems().map((item) => ({
        ...item,
        isCompleted: item.id === id ? !item.isCompleted : item.isCompleted,
        dateCompleted: new Date(),
      }))

    setTodoItems(todoItems())
  }

  const updateTodoItem = (
    id: string,
    fieldName: keyof TodoItem,
    value: string
  ) => {
    const todoItems = () =>
      getTodoItems().map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [fieldName]: value,
          }
        }

        return item
      })

    setTodoItems(todoItems())
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && getInputValue() !== '') {
      addTodoItem(getInputValue())

      if (!getEnterMultiple()) {
        closeAddTodoItemPrompt()
      }
    }
  }

  createEffect(() => {
    if (getInputIsOpen() && getIsFocused() && !getInputIsExiting()) {
      document.addEventListener('keydown', handleKeyDown)
    }
    onCleanup(() => document.removeEventListener('keydown', handleKeyDown))
  })

  return (
    <>
      <div className={styles['todo-list']}>
        {getInputIsOpen() && (
          <div
            className={classnames(styles['overlay'], {
              [styles['overlay-leave']]: getInputIsExiting(),
            })}
            onClick={() => setInputIsExiting(true)}
          />
        )}
        <div className={styles['lists']}>
          <div className={styles['incomplete-list']}>
            <For each={getIncompleteItems()}>
              {(item) => (
                <TodoCard
                  id={item.id}
                  title={item.title}
                  isCompleted={item.isCompleted}
                  onDelete={removeTodoItem}
                  onComplete={completeTodoItem}
                  onClick={(id) => () => setSelectedItemId(id)}
                />
              )}
            </For>
          </div>
          {getCompletedItems().length && (
            <div className={styles['complete-list']}>
              <h2 className={styles['complete-list-heading']}>Done</h2>
              <For each={getCompletedItems()}>
                {(item) => (
                  <TodoCard
                    id={item.id}
                    title={item.title}
                    isCompleted={item.isCompleted}
                    onDelete={removeTodoItem}
                    onComplete={completeTodoItem}
                    onClick={(id) => () => setSelectedItemId(id)}
                  />
                )}
              </For>
            </div>
          )}
        </div>
        {getInputIsOpen() ? (
          <div
            className={'fixed right-8 bottom-8'}
            onAnimationEnd={() => {
              if (getInputIsExiting()) {
                setInputIsOpen(false)
                setInputIsExiting(false)
              }
            }}
          >
            {!getInputIsExiting() && (
              <div className={styles['switch-container']}>
                <Switch
                  isChecked={getEnterMultiple()}
                  onClick={() => setUseMultipleEntries(!getEnterMultiple())}
                  label="Enter multiple"
                  labelIsOnLeft
                />
              </div>
            )}
            <TextField
              fullWidth
              classes={{
                root: styles['text-field-container'],
                input: classnames(styles['text-field-input'], {
                  [styles['text-field-input-leave']]: getInputIsExiting(),
                }),
              }}
              label={getInputIsExiting() ? '' : 'Title'}
              value={getInputValue()}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => {
                setInputValue(e.currentTarget.value ?? '')
              }}
            />
          </div>
        ) : (
          <Fab onClick={() => setInputIsOpen(true)} icon="fa-solid fa-plus" />
        )}
      </div>
      {getSelectedItem() && (
        <TodoEditPanel
          item={getSelectedItem()!}
          updateTodoItem={updateTodoItem}
          onClose={() => setSelectedItemId(undefined)}
        />
      )}
    </>
  )
}
