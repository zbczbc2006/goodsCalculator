interface Window {
  electron: { readonly versions: NodeJS.ProcessVersions }
  goods: { readonly get: function; readonly set: function }
  readonly preloadApi
  ipcRenderer: any
  // ipcRenderer: NodeJS.EventEmitter
}
