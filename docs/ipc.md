# IPC (Inter-Process Communication) в Atlas

IPC — это механизм общения между процессами Electron. В Atlas IPC вдохновлён VS Code и состоит из нескольких слоёв.

## Архитектура IPC

```
┌─────────────────────────────────────────────────────────────────┐
│                        IPC Layers                                │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: Services                                               │
│  ILogger.info() → ProxyChannel → IChannel.call()                │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Channels                                               │
│  ChannelServer / ChannelClient / ProxyChannel                    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Protocol                                               │
│  ElectronServerProtocol / ElectronClientProtocol                 │
│  MessagePortProtocol                                            │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Transport                                              │
│  ipcRenderer.send/on  (main ↔ renderer)                         │
│  MessagePort.postMessage  (main ↔ shared, renderer ↔ shared)    │
└─────────────────────────────────────────────────────────────────┘
```

## Layer 1: Transport (транспорт)

### ipcRenderer / ipcMain (Main ↔ Renderer)

Это стандартный Electron API:

```ts
// Main process
ipcMain.on('channel', (event, data) => { ... });
webContents.send('channel', data);

// Renderer (в preload)
ipcRenderer.send('channel', data);
ipcRenderer.on('channel', (event, data) => { ... });
```

В Atlas используется **через preload**:
```ts
window.app.ipcSend('app:message', data);
window.app.ipcOn('app:message', callback);
```

### MessagePort (Main ↔ Shared, Renderer ↔ Shared)

`MessagePort` — более низкоуровневый механизм, позволяет прямое соединение между процессами без участия main:

```ts
const { port1, port2 } = new MessageChannelMain();
port1.postMessage(data);
port2.onmessage = (event) => { ... };
```

## Layer 2: Protocol (протокол)

Протокол оборачивает transport в единый интерфейс:

```ts
interface IMessagePassingProtocol {
  send(message: any): void;
  readonly onMessage: Event<any>;
}
```

### ElectronServerProtocol (main side)

```ts
class ElectronServerProtocol implements IMessagePassingProtocol {
  constructor(private webContents: WebContents) {}

  send(message: any): void {
    this.webContents.send('app:message', message);
  }

  // Слушает ipcMain.on('app:message', ...)
}
```

### ElectronClientProtocol (renderer side)

```ts
class ElectronClientProtocol implements IMessagePassingProtocol {
  send(message: any): void {
    window.app.ipcSend('app:message', message);
  }

  // Слушает window.app.ipcOn('app:message', ...)
}
```

### MessagePortProtocol

```ts
class MessagePortProtocol implements IMessagePassingProtocol {
  constructor(private port: MessagePort) {}

  send(message: any): void {
    this.port.postMessage(message);
  }

  // Слушает port.onmessage
}
```

## Layer 3: Channels (каналы)

### ChannelServer

Принимает соединения по протоколу, маршрутизирует запросы:

```ts
const server = new ChannelServer(protocol);
server.registerChannel('logger', loggerChannel);
server.registerChannel('nodeProcess', nodeProcessChannel);
```

### ChannelClient

Отправляет запросы и возвращает Promises / Events:

```ts
const client = new ChannelClient(protocol);
const loggerChannel = client.getChannel('logger');

// call → Promise
const result = await loggerChannel.call('info', 'Hello');

// listen → Event
const event = loggerChannel.listen('onDidChange');
event(data => console.log(data));
```

### ProxyChannel

**Магия:** автоматически превращает объект в канал и обратно:

#### fromService (серверная сторона)

```ts
const logger = {
  info: (msg: string) => { ... },
  error: (msg: string) => { ... },
  onDidChange: Event<string>,
};

const channel = ProxyChannel.fromService(logger);
server.registerChannel('logger', channel);
```

`fromService` автоматически:
- Находит методы, начинающиеся с `on` + заглавная буква (`onDidChange`) → делает их Event
- Все остальные методы → делает callable

#### toService (клиентская сторона)

```ts
const channel = client.getChannel('logger');
const loggerProxy = ProxyChannel.toService<ILogger>(channel);

// Вызов метода → отправка через IPC
await loggerProxy.info('Hello');

// Подписка на событие → listen через IPC
loggerProxy.onDidChange(msg => console.log(msg));
```

## Layer 4: Services

На верхнем уровне вы работаете с сервисами, не зная о IPC:

```ts
// Main process
const logger = new FileLogger(logsHome);
server.registerChannel('logger', ProxyChannel.fromService(logger));

// Renderer
const loggerProxy = ProxyChannel.toService<ILogger>(
  main-process-service.getChannel('logger')
);

// Использование — выглядит как обычный вызов
await loggerProxy.info('Hello from renderer!');
```

## IPC Flow полностью

### Renderer вызывает метод main-сервиса

```
Renderer                          Main Process
  │                                   │
  │ loggerProxy.info('Hello')         │
  ├──────────────────────────────────>│
  │                                   │
  │ ProxyChannel.toService            │
  │   → channel.call('info', 'Hello') │
  │     → ChannelClient               │
  │       → protocol.send({           │
  │           id: 1,                  │
  │           type: 'call',           │
  │           channelName: 'logger',  │
  │           name: 'info',           │
  │           arg: 'Hello'            │
  │         })                        │
  │           → ipcRenderer.send      │
  │             ('app:message', msg)  │
  │                                   │
  │                                   │ ipcMain.on('app:message')
  │                                   │   → ElectronServerProtocol
  │                                   │     → ChannelServer
  3-5ms                            │       → channel.call('info', 'Hello')
  │                                   │         → FileLogger.info('Hello')
  │                                   │
  │                                   │ Ответ:
  │                                   │ protocol.send({
  │                                   │   id: 1, type: 'reply', data: undefined
  │                                   │ })
  │<──────────────────────────────────┤
  │                                   │
  │ ChannelClient получает 'reply'    │
  │   → Promise.resolve(undefined)    │
```

### Renderer подписывается на событие main-сервиса

```
Renderer                          Main Process
  │                                   │
  │ loggerProxy.onDidChange(callback) │
  ├──────────────────────────────────>│
  │                                   │
  │ ProxyChannel.toService            │
  │   → channel.listen('onDidChange') │
  │     → ChannelClient               │
  │       → protocol.send({           │
  │           id: 2,                  │
  │           type: 'listen',         │
  │           channelName: 'logger',  │
  │           name: 'onDidChange'     │
  │         })                        │
  │                                   │
  │                                   │ ChannelServer.onListen
  │                                   │   → channel.listen(...)
  │                                   │     → FileLogger.onDidChange
  │                                   │       → event.on(data => {
  │                                   │           protocol.send({
  │                                   │             id: 2,
  │                                   │             type: 'event',
  │                                   │             data
  │                                   │           })
  │                                   │         })
  │<──────────────────────────────────┤ (каждый раз при событии)
  │                                   │
  │ ChannelClient получает 'event'    │
  │   → Emitter.fire(data)            │
  │     → callback(data)              │
```

## IPC между Main и Shared Process

```
Main Process                     Shared Process
  │                                   │
  │ utilityProcess.fork()             │
  ├──────────────────────────────────>│
  │                                   │
  │ MessageChannelMain                │
  │ { port1, port2 }                  │
  │                                   │
  │ process.postMessage(              │
  │   'app:init', [port1]             │
  │ )                                 │
  ├──────────────────────────────────>│ parentPort.on('message')
  │                                   │   → SharedProcessProtocol(port)
  │                                   │     → ChannelServer(protocol)
  │                                   │
  ◄───────────────────────────────────┤ (port2 в main)
```

## IPC между Renderer и Shared Process

```
Renderer          Main Process          Shared Process
   │                   │                      │
   │ window.app        │                      │
   │ ipcSend(          │                      │
   │   'app:request    │                      │
   │    SharedProcess  │                      │
   │    Port', nonce)  │                      │
   ├──────────────────>│                      │
   │                   │                      │
   │                   │ sharedProcess.       │
   │                   │ createConnection()   │
   │                   │ MessageChannelMain   │
   │                   ├─────────────────────>│
   │                   │                      │
   │                   │ webContents.send(    │
   │                   │   'app:receive...',  │
   │                   │   nonce, [port2]     │
   │                   │ )                    │
   │<──────────────────┤                      │
   │                   │                      │
   │ preload:          │                      │
   │ window.postMessage│                      │
   │ ({type:           │                      │
   │  'app:shared...'},│                      │
   │ '*', [port2])     │                      │
   │                   │                      │
   │ SharedProcess     │                      │
   │ Service получает  │                      │
   │ port2             │                      │
   ├─────────────────────────────────────────>│
   │                   │                      │
   │ MessagePortClient │                      │
   │ → ChannelClient   │                      │
   │   → channel.call()│                      │
   │                   │                      │
```

После этого renderer и shared process общаются **напрямую** через MessagePort.

## Формат сообщений

### Запрос (Request)

```ts
interface IRawRequest {
  id: number;           // уникальный ID запроса
  type: "call" | "listen" | "dispose";
  channelName: string;  // имя канала ("logger", "nodeProcess")
  name: string;         // имя метода / события ("info", "onDidChange")
  arg?: any;            // аргументы
}
```

### Ответ (Response)

```ts
interface IRawResponse {
  id: number;
  type: "reply" | "error" | "event";
  data?: any;
  error?: { message: string; stack?: string };
}
```

### Примеры

**Вызов метода:**
```json
// Request
{ "id": 1, "type": "call", "channelName": "logger", "name": "info", "arg": "Hello" }

// Response
{ "id": 1, "type": "reply", "data": null }
```

**Подписка на событие:**
```json
// Request
{ "id": 2, "type": "listen", "channelName": "logger", "name": "onDidChange" }

// Response (каждое событие)
{ "id": 2, "type": "event", "data": "new log message" }
```

**Отмена подписки:**
```json
{ "id": 2, "type": "dispose", "channelName": "", "name": "" }
```

## Каналы

| Канал | Где регистрируется | Что делает |
|-------|-------------------|------------|
| `logger` | Main (`initChannels`) | Логирование |
| `nodeProcess` | Main (`initChannels`) | Запуск процессов |
| `nativeHost` | Main (`initChannels`) | OS интеграция |

## Где находятся файлы IPC

| Файл | Назначение |
|------|------------|
| `src/core/ipc/ipc.ts` | Интерфейсы: `IChannel`, `IServerChannel`, `IMessagePassingProtocol` |
| `src/core/ipc/ipc-server.ts` | `ChannelServer` — маршрутизация запросов |
| `src/core/ipc/ipc-client.ts` | `ChannelClient` — отправка запросов |
| `src/core/ipc/proxy-channel.ts` | `ProxyChannel` — автоматическая сериализация сервисов |
| `src/core/ipc/electron-main/ipc.electron.ts` | `ElectronIPCServer` — multi-connection сервер |
| `src/core/ipc/electron-browser/ipc.electron.ts` | `ElectronIPCClient` — клиент renderer |
| `src/core/ipc/common/ipc.mp.ts` | `MessagePortProtocol` — протокол над MessagePort |
| `src/core/ipc/electron-browser/ipc.mp.ts` | `MessagePortClient` — клиент MessagePort |
