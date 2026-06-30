import { VirtualFile, ConsoleLog } from '../../core/types';

export interface WorkspaceState {
  files: VirtualFile[];
  sandboxId: string;
  addressPath: string;
  logs: ConsoleLog[];
  isSwRegistered: boolean;
  registerError: string | null;
  selectedFilePath: string | null;
  viewMode: 'preview' | 'code';
  iframeTitle: string;
  isDragging: boolean;
  showFileTree: boolean;
  showConsole: boolean;
  hasUploaded: boolean;
}

export const initialWorkspaceState: WorkspaceState = {
  files: [],
  sandboxId: '',
  addressPath: 'index.html',
  logs: [],
  isSwRegistered: false,
  registerError: null,
  selectedFilePath: null,
  viewMode: 'preview',
  iframeTitle: '',
  isDragging: false,
  showFileTree: true,
  showConsole: false,
  hasUploaded: false,
};

export type WorkspaceAction =
  | { type: 'SET_FILES'; payload: VirtualFile[] }
  | { type: 'SET_SANDBOX_ID'; payload: string }
  | { type: 'SET_ADDRESS_PATH'; payload: string }
  | { type: 'SET_LOGS'; payload: ConsoleLog[] }
  | { type: 'ADD_LOG'; payload: ConsoleLog }
  | { type: 'CLEAR_LOGS' }
  | { type: 'SET_SW_REGISTERED'; payload: boolean }
  | { type: 'SET_REGISTER_ERROR'; payload: string | null }
  | { type: 'SELECT_FILE'; payload: string | null }
  | { type: 'SET_VIEW_MODE'; payload: 'preview' | 'code' }
  | { type: 'SET_IFRAME_TITLE'; payload: string }
  | { type: 'SET_DRAGGING'; payload: boolean }
  | { type: 'SET_SHOW_FILE_TREE'; payload: boolean }
  | { type: 'SET_SHOW_CONSOLE'; payload: boolean }
  | { type: 'SET_HAS_UPLOADED'; payload: boolean }
  | { type: 'RESET_WORKSPACE' };

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction
): WorkspaceState {
  switch (action.type) {
    case 'SET_FILES':
      return { ...state, files: action.payload };
    case 'SET_SANDBOX_ID':
      return { ...state, sandboxId: action.payload };
    case 'SET_ADDRESS_PATH':
      return { ...state, addressPath: action.payload };
    case 'SET_LOGS':
      return { ...state, logs: action.payload };
    case 'ADD_LOG':
      return { ...state, logs: [...state.logs, action.payload] };
    case 'CLEAR_LOGS':
      return { ...state, logs: [] };
    case 'SET_SW_REGISTERED':
      return { ...state, isSwRegistered: action.payload };
    case 'SET_REGISTER_ERROR':
      return { ...state, registerError: action.payload };
    case 'SELECT_FILE':
      return { ...state, selectedFilePath: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_IFRAME_TITLE':
      return { ...state, iframeTitle: action.payload };
    case 'SET_DRAGGING':
      return { ...state, isDragging: action.payload };
    case 'SET_SHOW_FILE_TREE':
      return { ...state, showFileTree: action.payload };
    case 'SET_SHOW_CONSOLE':
      return { ...state, showConsole: action.payload };
    case 'SET_HAS_UPLOADED':
      return { ...state, hasUploaded: action.payload };
    case 'RESET_WORKSPACE':
      return initialWorkspaceState;
    default:
      return state;
  }
}
