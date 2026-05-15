/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

import type { ILogger } from "@platform/logger/common/logger";
import type { VSBufferReadable, VSBufferReadableStream } from "@core/base/buffer";

import * as fs from "node:fs";
import { tmpdir } from "node:os";
import assert from "node:assert";
import { Buffer } from "node:buffer";
import { URI } from "@platform/common/uri/uri";
import { joinPath } from "@core/base/resources";
import { Promises } from "@platform/files/node/pfs";
import { DisposableStore } from "@core/base/lifecycle";
import { isLinux, isWindows } from "@core/base/platform";
import { basename, dirname, join, posix } from "node:path";
import { afterEach, beforeEach, describe, it } from "vitest";
import { createReadStream, existsSync, promises, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { bufferToReadable, bufferToStream, streamToBuffer, streamToBufferReadableStream, VSBuffer } from "@core/base/buffer";

import type { FileOperationEvent, IFileAtomicOptions, IFileAtomicReadOptions, IFileStat, IFileStatWithMetadata, IReadFileOptions, IStat } from "../../common/files";

import { FileService } from "../../node/file-service";
import { DiskFileSystemProvider } from "../../node/disk-file-system-provider";
import { etag, FileOperation, FileOperationError, FileOperationResult, FilePermission, FileSystemProviderCapabilities, hasFileAtomicReadCapability, hasOpenReadWriteCloseCapability, NotModifiedSinceFileOperationError, TooLargeFileOperationError } from "../../common/files";

function getByName(root: IFileStat, name: string): IFileStat | undefined {
  if (root.children === undefined) {
    return undefined;
  }

  return root.children.find(child => child.name === name);
}

function createMockLogger(): ILogger {
  return {
    _serviceBrand: undefined,
    critical: () => {},
    debug: () => {},
    error: () => {},
    info: () => {},
    trace: () => {},
    warning: () => {},
  } as ILogger;
}

function toLineByLineReadable(content: string): VSBufferReadable {
  let chunks = content.split("\n");
  chunks = chunks.map((chunk, index) => {
    if (index === 0) {
      return chunk;
    }

    return `\n${chunk}`;
  });

  return {
    read(): VSBuffer | null {
      const chunk = chunks.shift();
      if (typeof chunk === "string") {
        return VSBuffer.fromString(chunk);
      }

      return null;
    },
  };
}

export class TestDiskFileSystemProvider extends DiskFileSystemProvider {
  totalBytesRead: number = 0;

  private invalidStatSize: boolean = false;
  private smallStatSize: boolean = false;
  private readonly: boolean = false;

  private _testCapabilities!: FileSystemProviderCapabilities;
  override get capabilities(): FileSystemProviderCapabilities {
    if (!this._testCapabilities) {
      this._testCapabilities
        = FileSystemProviderCapabilities.FileReadWrite
          | FileSystemProviderCapabilities.FileOpenReadWriteClose
          | FileSystemProviderCapabilities.FileReadStream
          | FileSystemProviderCapabilities.Trash
          | FileSystemProviderCapabilities.FileFolderCopy
          | FileSystemProviderCapabilities.FileWriteUnlock
          | FileSystemProviderCapabilities.FileAtomicRead
          | FileSystemProviderCapabilities.FileAtomicWrite
          | FileSystemProviderCapabilities.FileAtomicDelete
          | FileSystemProviderCapabilities.FileClone
          | FileSystemProviderCapabilities.FileAppend
          | FileSystemProviderCapabilities.FileRealpath;

      if (isLinux) {
        this._testCapabilities |= FileSystemProviderCapabilities.PathCaseSensitive;
      }
    }

    return this._testCapabilities;
  }

  override set capabilities(capabilities: FileSystemProviderCapabilities) {
    this._testCapabilities = capabilities;
  }

  setInvalidStatSize(enabled: boolean): void {
    this.invalidStatSize = enabled;
  }

  setSmallStatSize(enabled: boolean): void {
    this.smallStatSize = enabled;
  }

  setReadonly(readonly: boolean): void {
    this.readonly = readonly;
  }

  override async stat(resource: URI): Promise<IStat> {
    const res = await super.stat(resource);

    if (this.invalidStatSize) {
      (res as any).size = String(res.size) as any; // for https://github.com/microsoft/vscode/issues/72909
    }
    else if (this.smallStatSize) {
      (res as any).size = 1;
    }
    else if (this.readonly) {
      (res as any).permissions = FilePermission.Readonly;
    }

    return res;
  }

  override async read(fd: number, pos: number, data: Uint8Array, offset: number, length: number): Promise<number> {
    const bytesRead = await super.read(fd, pos, data, offset, length);

    this.totalBytesRead += bytesRead;

    return bytesRead;
  }

  override async readFile(resource: URI, options?: IFileAtomicReadOptions): Promise<Uint8Array> {
    const res = await super.readFile(resource, options);

    this.totalBytesRead += res.byteLength;

    return res;
  }
}

describe("disk File Service", () => {
  const testSchema = "test";

  let service: FileService;
  let fileProvider: TestDiskFileSystemProvider;
  let testProvider: TestDiskFileSystemProvider;

  let testDir: string;

  const disposables = new DisposableStore();

  beforeEach(async () => {
    service = new FileService(createMockLogger());

    fileProvider = new TestDiskFileSystemProvider();
    disposables.add(service.registerProvider("file", fileProvider));

    testProvider = new TestDiskFileSystemProvider();
    disposables.add(service.registerProvider(testSchema, testProvider));

    testDir = fs.mkdtempSync(join(tmpdir(), "atlas-diskfileservice-"));

    const sourceDir = join(__dirname, "fixtures", "service");

    await Promises.copy(sourceDir, testDir, { preserveSymlinks: false });
  });

  afterEach(() => {
    disposables.clear();

    return Promises.rm(testDir);
  });

  it("createFolder", async () => {
    let event: FileOperationEvent | undefined;
    disposables.add(service.onDidRunOperation(e => event = e));

    const parent = await service.resolve(URI.file(testDir));

    const newFolderResource = URI.file(join(parent.resource.fsPath, "newFolder"));

    const newFolder = await service.createFolder(newFolderResource);

    assert.strictEqual(newFolder.name, "newFolder");
    assert.strictEqual(existsSync(newFolder.resource.fsPath), true);

    assert.ok(event);
    assert.strictEqual(event.resource.fsPath, newFolderResource.fsPath);
    assert.strictEqual(event.operation, FileOperation.CREATE);
    assert.strictEqual(event.target!.resource.fsPath, newFolderResource.fsPath);
    assert.strictEqual(event.target!.isDirectory, true);
  });

  it("createFolder: creating multiple folders at once", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const multiFolderPaths = ["a", "couple", "of", "folders"];
    const parent = await service.resolve(URI.file(testDir));

    const newFolderResource = URI.file(join(parent.resource.fsPath, ...multiFolderPaths));

    const newFolder = await service.createFolder(newFolderResource);

    const lastFolderName = multiFolderPaths[multiFolderPaths.length - 1];
    assert.strictEqual(newFolder.name, lastFolderName);
    assert.strictEqual(existsSync(newFolder.resource.fsPath), true);

    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, newFolderResource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.CREATE);
    assert.strictEqual(event!.target!.resource.fsPath, newFolderResource.fsPath);
    assert.strictEqual(event!.target!.isDirectory, true);
  });

  it("exists", async () => {
    let exists = await service.exists(URI.file(testDir));
    assert.strictEqual(exists, true);

    exists = await service.exists(URI.file(`${testDir}something`));
    assert.strictEqual(exists, false);
  });

  it("resolve - file", async () => {
    const resource = URI.file(join(__dirname, "fixtures", "resolver", "index.html"));
    const resolved = await service.resolve(resource);

    assert.strictEqual(resolved.name, "index.html");
    assert.strictEqual(resolved.isFile, true);
    assert.strictEqual(resolved.isDirectory, false);
    assert.strictEqual(resolved.readonly, false);
    assert.strictEqual(resolved.isSymbolicLink, false);
    assert.strictEqual(resolved.resource.toString(), resource.toString());
    assert.strictEqual(resolved.children, undefined);
    assert.ok(resolved.mtime! > 0);
    assert.ok(resolved.ctime! > 0);
    assert.ok(resolved.size! > 0);
  });

  it("resolve - directory", async () => {
    const testsElements = ["examples", "other", "index.html", "site.css"];

    const resource = URI.file(join(__dirname, "fixtures", "resolver"));
    const result = await service.resolve(resource);

    assert.ok(result);
    assert.strictEqual(result.resource.toString(), resource.toString());
    assert.strictEqual(result.name, "resolver");
    assert.ok(result.children);
    assert.ok(result.children.length > 0);
    assert.ok(result.isDirectory);
    assert.strictEqual(result.readonly, false);
    assert.ok(result.mtime! > 0);
    assert.ok(result.ctime! > 0);
    assert.strictEqual(result.children.length, testsElements.length);

    assert.ok(result.children.every((entry) => {
      return testsElements.includes(basename(entry.resource.fsPath));
    }));

    result.children.forEach((value) => {
      assert.ok(basename(value.resource.fsPath));
      if (["examples", "other"].includes(basename(value.resource.fsPath))) {
        assert.ok(value.isDirectory);
        assert.strictEqual(value.mtime, undefined);
        assert.strictEqual(value.ctime, undefined);
      }
      else if (basename(value.resource.fsPath) === "index.html") {
        assert.ok(!value.isDirectory);
        assert.ok(!value.children);
        assert.strictEqual(value.mtime, undefined);
        assert.strictEqual(value.ctime, undefined);
      }
      else if (basename(value.resource.fsPath) === "site.css") {
        assert.ok(!value.isDirectory);
        assert.ok(!value.children);
        assert.strictEqual(value.mtime, undefined);
        assert.strictEqual(value.ctime, undefined);
      }
      else {
        assert.fail(`Unexpected value ${basename(value.resource.fsPath)}`);
      }
    });
  });

  it("resolve - directory - with metadata", async () => {
    const testsElements = ["examples", "other", "index.html", "site.css"];

    const result = await service.resolve(URI.file(join(__dirname, "fixtures", "resolver")), { resolveMetadata: true });

    assert.ok(result);
    assert.strictEqual(result.name, "resolver");
    assert.ok(result.children);
    assert.ok(result.children.length > 0);
    assert.ok(result.isDirectory);
    assert.ok(result.mtime > 0);
    assert.ok(result.ctime > 0);
    assert.strictEqual(result.children.length, testsElements.length);

    assert.ok(result.children.every((entry) => {
      return testsElements.includes(basename(entry.resource.fsPath));
    }));

    assert.ok(result.children.every(entry => entry.etag.length > 0));

    result.children.forEach((value) => {
      assert.ok(basename(value.resource.fsPath));
      if (["examples", "other"].includes(basename(value.resource.fsPath))) {
        assert.ok(value.isDirectory);
        assert.ok(value.mtime > 0);
        assert.ok(value.ctime > 0);
      }
      else if (basename(value.resource.fsPath) === "index.html") {
        assert.ok(!value.isDirectory);
        assert.ok(!value.children);
        assert.ok(value.mtime > 0);
        assert.ok(value.ctime > 0);
      }
      else if (basename(value.resource.fsPath) === "site.css") {
        assert.ok(!value.isDirectory);
        assert.ok(!value.children);
        assert.ok(value.mtime > 0);
        assert.ok(value.ctime > 0);
      }
      else {
        assert.fail(`Unexpected value ${basename(value.resource.fsPath)}`);
      }
    });
  });

  it("resolve - directory with resolveTo", async () => {
    const resolved = await service.resolve(URI.file(testDir), { resolveTo: [URI.file(join(testDir, "deep"))] });
    assert.strictEqual(resolved.children!.length, 8);

    const deep = getByName(resolved, "deep")!;
    assert.strictEqual(deep.children!.length, 4);
  });

  it("resolve - directory - resolveTo single directory", async () => {
    const resolverFixturesPath = URI.file(join(__dirname, "fixtures", "resolver")).fsPath;
    const result = await service.resolve(URI.file(resolverFixturesPath), { resolveTo: [URI.file(join(resolverFixturesPath, "other/deep"))] });

    assert.ok(result);
    assert.ok(result.children);
    assert.ok(result.children.length > 0);
    assert.ok(result.isDirectory);

    const children = result.children;
    assert.strictEqual(children.length, 4);

    const other = getByName(result, "other");
    assert.ok(other);
    assert.ok(other.children!.length > 0);

    const deep = getByName(other, "deep");
    assert.ok(deep);
    assert.ok(deep.children!.length > 0);
    assert.strictEqual(deep.children!.length, 4);
  });

  it("resolve directory - resolveTo multiple directories", () => {
    return testResolveDirectoryWithTarget(false);
  });

  it("resolve directory - resolveTo with a URI that has query parameter (https://github.com/microsoft/vscode/issues/128151)", () => {
    return testResolveDirectoryWithTarget(true);
  });

  async function testResolveDirectoryWithTarget(withQueryParam: boolean): Promise<void> {
    const resolverFixturesPath = URI.file(join(__dirname, "fixtures", "resolver")).fsPath;
    const result = await service.resolve(URI.file(resolverFixturesPath).with({ query: withQueryParam ? "test" : undefined }), {
      resolveTo: [
        URI.file(join(resolverFixturesPath, "other/deep")).with({ query: withQueryParam ? "test" : undefined }),
        URI.file(join(resolverFixturesPath, "examples")).with({ query: withQueryParam ? "test" : undefined }),
      ],
    });

    assert.ok(result);
    assert.ok(result.children);
    assert.ok(result.children.length > 0);
    assert.ok(result.isDirectory);

    const children = result.children;
    assert.strictEqual(children.length, 4);

    const other = getByName(result, "other");
    assert.ok(other);
    assert.ok(other.children!.length > 0);

    const deep = getByName(other, "deep");
    assert.ok(deep);
    assert.ok(deep.children!.length > 0);
    assert.strictEqual(deep.children!.length, 4);

    const examples = getByName(result, "examples");
    assert.ok(examples);
    assert.ok(examples.children!.length > 0);
    assert.strictEqual(examples.children!.length, 4);
  }

  it("resolve directory - resolveSingleChildFolders", async () => {
    const resolverFixturesPath = join(__dirname, "fixtures", "resolver", "other");
    const result = await service.resolve(URI.file(resolverFixturesPath), { resolveSingleChildDescendants: true });

    assert.ok(result);
    assert.ok(result.children);
    assert.ok(result.children.length > 0);
    assert.ok(result.isDirectory);

    const children = result.children;
    assert.strictEqual(children.length, 1);

    const deep = getByName(result, "deep");
    assert.ok(deep);
    assert.ok(deep.children!.length > 0);
    assert.strictEqual(deep.children!.length, 4);
  });

  it("resolves", async () => {
    const res = await service.resolveAll([
      { resource: URI.file(testDir), options: { resolveTo: [URI.file(join(testDir, "deep"))] } },
      { resource: URI.file(join(testDir, "deep")) },
    ]);

    const r1 = res[0].stat!;
    assert.strictEqual(r1.children!.length, 8);

    const deep = getByName(r1, "deep")!;
    assert.strictEqual(deep.children!.length, 4);

    const r2 = res[1].stat!;
    assert.strictEqual(r2.children!.length, 4);
    assert.strictEqual(r2.name, "deep");
  });

  it("resolve / realpath - folder symbolic link", async () => {
    const link = URI.file(join(testDir, "deep-link"));
    await promises.symlink(join(testDir, "deep"), link.fsPath, "junction");

    const resolved = await service.resolve(link);
    assert.strictEqual(resolved.children!.length, 4);
    assert.strictEqual(resolved.isDirectory, true);
    assert.strictEqual(resolved.isSymbolicLink, true);

    const realpath = await service.realpath(link);
    assert.ok(realpath);
    assert.strictEqual(basename(realpath.fsPath), "deep");
  });

  (isWindows ? it.skip /* windows: cannot create file symbolic link without elevated context */ : it)("resolve - file symbolic link", async () => {
    const link = URI.file(join(testDir, "lorem.txt-linked"));
    await promises.symlink(join(testDir, "lorem.txt"), link.fsPath);

    const resolved = await service.resolve(link);
    assert.strictEqual(resolved.isDirectory, false);
    assert.strictEqual(resolved.isSymbolicLink, true);
  });

  it("resolve - symbolic link pointing to nonexistent file does not break", async () => {
    await promises.symlink(join(testDir, "foo"), join(testDir, "bar"), "junction");

    const resolved = await service.resolve(URI.file(testDir));
    assert.strictEqual(resolved.isDirectory, true);
    assert.strictEqual(resolved.children!.length, 9);

    const resolvedLink = resolved.children?.find(child => child.name === "bar" && child.isSymbolicLink);
    assert.ok(resolvedLink);

    assert.ok(!resolvedLink?.isDirectory);
    assert.ok(!resolvedLink?.isFile);
  });

  it("stat - file", async () => {
    const resource = URI.file(join(__dirname, "fixtures", "resolver", "index.html"));
    const resolved = await service.stat(resource);

    assert.strictEqual(resolved.name, "index.html");
    assert.strictEqual(resolved.isFile, true);
    assert.strictEqual(resolved.isDirectory, false);
    assert.strictEqual(resolved.readonly, false);
    assert.strictEqual(resolved.isSymbolicLink, false);
    assert.strictEqual(resolved.resource.toString(), resource.toString());
    assert.ok(resolved.mtime > 0);
    assert.ok(resolved.ctime > 0);
    assert.ok(resolved.size > 0);
  });

  it("stat - directory", async () => {
    const resource = URI.file(join(__dirname, "fixtures", "resolver"));
    const result = await service.stat(resource);

    assert.ok(result);
    assert.strictEqual(result.resource.toString(), resource.toString());
    assert.strictEqual(result.name, "resolver");
    assert.ok(result.isDirectory);
    assert.strictEqual(result.readonly, false);
    assert.ok(result.mtime > 0);
    assert.ok(result.ctime > 0);
  });

  // The executable bit does not exist on Windows so use a condition not skip
  if (!isWindows) {
    it("stat - executable", async () => {
      const nonExecutable = URI.file(join(__dirname, "fixtures", "executable", "non_executable"));
      let resolved = await service.stat(nonExecutable);
      assert.strictEqual(resolved.isFile, true);
      assert.strictEqual(resolved.executable, false);

      const executable = URI.file(join(__dirname, "fixtures", "executable", "executable"));
      resolved = await service.stat(executable);
      assert.strictEqual(resolved.isFile, true);
      assert.strictEqual(resolved.executable, true);
    });
  }

  it("deleteFile (non recursive)", async () => {
    return testDeleteFile(false, false);
  });

  it("deleteFile (recursive)", async () => {
    return testDeleteFile(false, true);
  });

  (isLinux /* trash is unreliable on Linux */ ? it.skip : it)("deleteFile (useTrash)", async () => {
    return testDeleteFile(true, false);
  });

  async function testDeleteFile(useTrash: boolean, recursive: boolean): Promise<void> {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const resource = URI.file(join(testDir, "deep", "conway.js"));
    const source = await service.resolve(resource);

    assert.strictEqual(await service.canDelete(source.resource, { useTrash, recursive }), true);
    await service.del(source.resource, { useTrash, recursive });

    assert.strictEqual(existsSync(source.resource.fsPath), false);

    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.DELETE);

    let error: Error | undefined;
    try {
      await service.del(source.resource, { useTrash, recursive });
    }
    catch (e) {
      error = e;
    }

    assert.ok(error);
    assert.strictEqual((<FileOperationError>error).fileOperationResult, FileOperationResult.FILE_NOT_FOUND);
  }

  (isWindows ? it.skip /* windows: cannot create file symbolic link without elevated context */ : it)("deleteFile - symbolic link (exists)", async () => {
    const target = URI.file(join(testDir, "lorem.txt"));
    const link = URI.file(join(testDir, "lorem.txt-linked"));
    await promises.symlink(target.fsPath, link.fsPath);

    const source = await service.resolve(link);

    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    assert.strictEqual(await service.canDelete(source.resource), true);
    await service.del(source.resource);

    assert.strictEqual(existsSync(source.resource.fsPath), false);

    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, link.fsPath);
    assert.strictEqual(event!.operation, FileOperation.DELETE);

    assert.strictEqual(existsSync(target.fsPath), true); // target the link pointed to is never deleted
  });

  (isWindows ? it.skip /* windows: cannot create file symbolic link without elevated context */ : it)("deleteFile - symbolic link (pointing to nonexistent file)", async () => {
    const target = URI.file(join(testDir, "foo"));
    const link = URI.file(join(testDir, "bar"));
    await promises.symlink(target.fsPath, link.fsPath);

    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    assert.strictEqual(await service.canDelete(link), true);
    await service.del(link);

    assert.strictEqual(existsSync(link.fsPath), false);

    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, link.fsPath);
    assert.strictEqual(event!.operation, FileOperation.DELETE);
  });

  it("deleteFolder (recursive)", async () => {
    return testDeleteFolderRecursive(false, false);
  });

  it("deleteFolder (recursive, atomic)", async () => {
    return testDeleteFolderRecursive(false, { postfix: ".vsctmp" });
  });

  (isLinux /* trash is unreliable on Linux */ ? it.skip : it)("deleteFolder (recursive, useTrash)", async () => {
    return testDeleteFolderRecursive(true, false);
  });

  async function testDeleteFolderRecursive(useTrash: boolean, atomic: IFileAtomicOptions | false): Promise<void> {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const resource = URI.file(join(testDir, "deep"));
    const source = await service.resolve(resource);

    assert.strictEqual(await service.canDelete(source.resource, { recursive: true, useTrash, atomic }), true);
    await service.del(source.resource, { recursive: true, useTrash, atomic });

    assert.strictEqual(existsSync(source.resource.fsPath), false);
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.DELETE);
  }

  it("deleteFolder (non recursive)", async () => {
    const resource = URI.file(join(testDir, "deep"));
    const source = await service.resolve(resource);

    assert.ok((await service.canDelete(source.resource)) instanceof Error);

    let error;
    try {
      await service.del(source.resource);
    }
    catch (e) {
      error = e;
    }

    assert.ok(error);
  });

  it("deleteFolder empty folder (recursive)", () => {
    return testDeleteEmptyFolder(true);
  });

  it("deleteFolder empty folder (non recursive)", () => {
    return testDeleteEmptyFolder(false);
  });

  async function testDeleteEmptyFolder(recursive: boolean): Promise<void> {
    const { resource } = await service.createFolder(URI.file(join(testDir, "deep", "empty")));

    await service.del(resource, { recursive });

    assert.strictEqual(await service.exists(resource), false);
  }

  it("move", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const source = URI.file(join(testDir, "index.html"));
    const sourceContents = readFileSync(source.fsPath);

    const target = URI.file(join(dirname(source.fsPath), "other.html"));

    assert.strictEqual(await service.canMove(source, target), true);
    const renamed = await service.move(source, target);

    assert.strictEqual(existsSync(renamed.resource.fsPath), true);
    assert.strictEqual(existsSync(source.fsPath), false);
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, source.fsPath);
    assert.strictEqual(event!.operation, FileOperation.MOVE);
    assert.strictEqual(event!.target!.resource.fsPath, renamed.resource.fsPath);

    const targetContents = readFileSync(target.fsPath);

    assert.strictEqual(sourceContents.byteLength, targetContents.byteLength);
    assert.strictEqual(sourceContents.toString(), targetContents.toString());
  });

  it("move - across providers (buffered => buffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testMoveAcrossProviders();
  });

  it("move - across providers (unbuffered => unbuffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testMoveAcrossProviders();
  });

  it("move - across providers (buffered => unbuffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testMoveAcrossProviders();
  });

  it("move - across providers (unbuffered => buffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testMoveAcrossProviders();
  });

  it("move - across providers - large (buffered => buffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testMoveAcrossProviders("lorem.txt");
  });

  it("move - across providers - large (unbuffered => unbuffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testMoveAcrossProviders("lorem.txt");
  });

  it("move - across providers - large (buffered => unbuffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testMoveAcrossProviders("lorem.txt");
  });

  it("move - across providers - large (unbuffered => buffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testMoveAcrossProviders("lorem.txt");
  });

  async function testMoveAcrossProviders(sourceFile = "index.html"): Promise<void> {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const source = URI.file(join(testDir, sourceFile));
    const sourceContents = readFileSync(source.fsPath);

    const target = URI.file(join(dirname(source.fsPath), "other.html")).with({ scheme: testSchema });

    assert.strictEqual(await service.canMove(source, target), true);
    const renamed = await service.move(source, target);

    assert.strictEqual(existsSync(renamed.resource.fsPath), true);
    assert.strictEqual(existsSync(source.fsPath), false);
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, source.fsPath);
    assert.strictEqual(event!.operation, FileOperation.COPY);
    assert.strictEqual(event!.target!.resource.fsPath, renamed.resource.fsPath);

    const targetContents = readFileSync(target.fsPath);

    assert.strictEqual(sourceContents.byteLength, targetContents.byteLength);
    assert.strictEqual(sourceContents.toString(), targetContents.toString());
  }

  it("move - multi folder", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const multiFolderPaths = ["a", "couple", "of", "folders"];
    const renameToPath = join(...multiFolderPaths, "other.html");

    const source = URI.file(join(testDir, "index.html"));

    assert.strictEqual(await service.canMove(source, URI.file(join(dirname(source.fsPath), renameToPath))), true);
    const renamed = await service.move(source, URI.file(join(dirname(source.fsPath), renameToPath)));

    assert.strictEqual(existsSync(renamed.resource.fsPath), true);
    assert.strictEqual(existsSync(source.fsPath), false);
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, source.fsPath);
    assert.strictEqual(event!.operation, FileOperation.MOVE);
    assert.strictEqual(event!.target!.resource.fsPath, renamed.resource.fsPath);
  });

  it("move - directory", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const source = URI.file(join(testDir, "deep"));

    assert.strictEqual(await service.canMove(source, URI.file(join(dirname(source.fsPath), "deeper"))), true);
    const renamed = await service.move(source, URI.file(join(dirname(source.fsPath), "deeper")));

    assert.strictEqual(existsSync(renamed.resource.fsPath), true);
    assert.strictEqual(existsSync(source.fsPath), false);
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, source.fsPath);
    assert.strictEqual(event!.operation, FileOperation.MOVE);
    assert.strictEqual(event!.target!.resource.fsPath, renamed.resource.fsPath);
  });

  it("move - directory - across providers (buffered => buffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testMoveFolderAcrossProviders();
  });

  it("move - directory - across providers (unbuffered => unbuffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testMoveFolderAcrossProviders();
  });

  it("move - directory - across providers (buffered => unbuffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testMoveFolderAcrossProviders();
  });

  it("move - directory - across providers (unbuffered => buffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);
    setCapabilities(testProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testMoveFolderAcrossProviders();
  });

  async function testMoveFolderAcrossProviders(): Promise<void> {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const source = URI.file(join(testDir, "deep"));
    const sourceChildren = readdirSync(source.fsPath);

    const target = URI.file(join(dirname(source.fsPath), "deeper")).with({ scheme: testSchema });

    assert.strictEqual(await service.canMove(source, target), true);
    const renamed = await service.move(source, target);

    assert.strictEqual(existsSync(renamed.resource.fsPath), true);
    assert.strictEqual(existsSync(source.fsPath), false);
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, source.fsPath);
    assert.strictEqual(event!.operation, FileOperation.COPY);
    assert.strictEqual(event!.target!.resource.fsPath, renamed.resource.fsPath);

    const targetChildren = readdirSync(target.fsPath);
    assert.strictEqual(sourceChildren.length, targetChildren.length);
    for (let i = 0; i < sourceChildren.length; i++) {
      assert.strictEqual(sourceChildren[i], targetChildren[i]);
    }
  }

  it("move - MIX CASE", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const source = await service.resolve(URI.file(join(testDir, "index.html")), { resolveMetadata: true });
    assert.ok(source.size > 0);

    const renamedResource = URI.file(join(dirname(source.resource.fsPath), "INDEX.html"));
    assert.strictEqual(await service.canMove(source.resource, renamedResource), true);
    let renamed = await service.move(source.resource, renamedResource);

    assert.strictEqual(existsSync(renamedResource.fsPath), true);
    assert.strictEqual(basename(renamedResource.fsPath), "INDEX.html");
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, source.resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.MOVE);
    assert.strictEqual(event!.target!.resource.fsPath, renamedResource.fsPath);

    renamed = await service.resolve(renamedResource, { resolveMetadata: true });
    assert.strictEqual(source.size, renamed.size);
  });

  it("move - same file", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const source = await service.resolve(URI.file(join(testDir, "index.html")), { resolveMetadata: true });
    assert.ok(source.size > 0);

    assert.strictEqual(await service.canMove(source.resource, URI.file(source.resource.fsPath)), true);
    let renamed = await service.move(source.resource, URI.file(source.resource.fsPath));

    assert.strictEqual(existsSync(renamed.resource.fsPath), true);
    assert.strictEqual(basename(renamed.resource.fsPath), "index.html");
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, source.resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.MOVE);
    assert.strictEqual(event!.target!.resource.fsPath, renamed.resource.fsPath);

    renamed = await service.resolve(renamed.resource, { resolveMetadata: true });
    assert.strictEqual(source.size, renamed.size);
  });

  it("move - same file #2", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const source = await service.resolve(URI.file(join(testDir, "index.html")), { resolveMetadata: true });
    assert.ok(source.size > 0);

    const targetParent = URI.file(testDir);
    const target = targetParent.with({ path: posix.join(targetParent.path, posix.basename(source.resource.path)) });

    assert.strictEqual(await service.canMove(source.resource, target), true);
    let renamed = await service.move(source.resource, target);

    assert.strictEqual(existsSync(renamed.resource.fsPath), true);
    assert.strictEqual(basename(renamed.resource.fsPath), "index.html");
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, source.resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.MOVE);
    assert.strictEqual(event!.target!.resource.fsPath, renamed.resource.fsPath);

    renamed = await service.resolve(renamed.resource, { resolveMetadata: true });
    assert.strictEqual(source.size, renamed.size);
  });

  it("move - source parent of target", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    let source = await service.resolve(URI.file(join(testDir, "index.html")), { resolveMetadata: true });
    const originalSize = source.size;
    assert.ok(originalSize > 0);

    assert.ok((await service.canMove(URI.file(testDir), URI.file(join(testDir, "binary.txt"))) instanceof Error));

    let error;
    try {
      await service.move(URI.file(testDir), URI.file(join(testDir, "binary.txt")));
    }
    catch (e) {
      error = e;
    }

    assert.ok(error);
    assert.ok(!event!);

    source = await service.resolve(source.resource, { resolveMetadata: true });
    assert.strictEqual(originalSize, source.size);
  });

  it("move - FILE_MOVE_CONFLICT", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    let source = await service.resolve(URI.file(join(testDir, "index.html")), { resolveMetadata: true });
    const originalSize = source.size;
    assert.ok(originalSize > 0);

    assert.ok((await service.canMove(source.resource, URI.file(join(testDir, "binary.txt"))) instanceof Error));

    let error;
    try {
      await service.move(source.resource, URI.file(join(testDir, "binary.txt")));
    }
    catch (e) {
      error = e;
    }

    assert.strictEqual(error.fileOperationResult, FileOperationResult.FILE_MOVE_CONFLICT);
    assert.ok(!event!);

    source = await service.resolve(source.resource, { resolveMetadata: true });
    assert.strictEqual(originalSize, source.size);
  });

  it("move - overwrite folder with file", async () => {
    let createEvent: FileOperationEvent;
    let moveEvent: FileOperationEvent;
    let deleteEvent: FileOperationEvent;
    disposables.add(service.onDidRunOperation((e) => {
      if (e.operation === FileOperation.CREATE) {
        createEvent = e;
      }
      else if (e.operation === FileOperation.DELETE) {
        deleteEvent = e;
      }
      else if (e.operation === FileOperation.MOVE) {
        moveEvent = e;
      }
    }));

    const parent = await service.resolve(URI.file(testDir));
    const folderResource = URI.file(join(parent.resource.fsPath, "conway.js"));
    const f = await service.createFolder(folderResource);
    const source = URI.file(join(testDir, "deep", "conway.js"));

    assert.strictEqual(await service.canMove(source, f.resource, true), true);
    const moved = await service.move(source, f.resource, true);

    assert.strictEqual(existsSync(moved.resource.fsPath), true);
    assert.ok(statSync(moved.resource.fsPath).isFile);
    assert.ok(createEvent!);
    assert.ok(deleteEvent!);
    assert.ok(moveEvent!);
    assert.strictEqual(moveEvent!.resource.fsPath, source.fsPath);
    assert.strictEqual(moveEvent!.target!.resource.fsPath, moved.resource.fsPath);
    assert.strictEqual(deleteEvent!.resource.fsPath, folderResource.fsPath);
  });

  it("copy", async () => {
    await doTestCopy();
  });

  it("copy - unbuffered (FileSystemProviderCapabilities.FileReadWrite)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    await doTestCopy();
  });

  it("copy - unbuffered large (FileSystemProviderCapabilities.FileReadWrite)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    await doTestCopy("lorem.txt");
  });

  it("copy - buffered (FileSystemProviderCapabilities.FileOpenReadWriteClose)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    await doTestCopy();
  });

  it("copy - buffered large (FileSystemProviderCapabilities.FileOpenReadWriteClose)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    await doTestCopy("lorem.txt");
  });

  function setCapabilities(provider: TestDiskFileSystemProvider, capabilities: FileSystemProviderCapabilities): void {
    provider.capabilities = capabilities;
    if (isLinux) {
      provider.capabilities |= FileSystemProviderCapabilities.PathCaseSensitive;
    }
  }

  async function doTestCopy(sourceName: string = "index.html") {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const source = await service.resolve(URI.file(join(testDir, sourceName)));
    const target = URI.file(join(testDir, "other.html"));

    assert.strictEqual(await service.canCopy(source.resource, target), true);
    const copied = await service.copy(source.resource, target);

    assert.strictEqual(existsSync(copied.resource.fsPath), true);
    assert.strictEqual(existsSync(source.resource.fsPath), true);
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, source.resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.COPY);
    assert.strictEqual(event!.target!.resource.fsPath, copied.resource.fsPath);

    const sourceContents = readFileSync(source.resource.fsPath);
    const targetContents = readFileSync(target.fsPath);

    assert.strictEqual(sourceContents.byteLength, targetContents.byteLength);
    assert.strictEqual(sourceContents.toString(), targetContents.toString());
  }

  it("copy - overwrite folder with file", async () => {
    let createEvent: FileOperationEvent;
    let copyEvent: FileOperationEvent;
    let deleteEvent: FileOperationEvent;
    disposables.add(service.onDidRunOperation((e) => {
      if (e.operation === FileOperation.CREATE) {
        createEvent = e;
      }
      else if (e.operation === FileOperation.DELETE) {
        deleteEvent = e;
      }
      else if (e.operation === FileOperation.COPY) {
        copyEvent = e;
      }
    }));

    const parent = await service.resolve(URI.file(testDir));
    const folderResource = URI.file(join(parent.resource.fsPath, "conway.js"));
    const f = await service.createFolder(folderResource);
    const source = URI.file(join(testDir, "deep", "conway.js"));

    assert.strictEqual(await service.canCopy(source, f.resource, true), true);
    const copied = await service.copy(source, f.resource, true);

    assert.strictEqual(existsSync(copied.resource.fsPath), true);
    assert.ok(statSync(copied.resource.fsPath).isFile);
    assert.ok(createEvent!);
    assert.ok(deleteEvent!);
    assert.ok(copyEvent!);
    assert.strictEqual(copyEvent!.resource.fsPath, source.fsPath);
    assert.strictEqual(copyEvent!.target!.resource.fsPath, copied.resource.fsPath);
    assert.strictEqual(deleteEvent!.resource.fsPath, folderResource.fsPath);
  });

  it("copy - MIX CASE same target - no overwrite", async () => {
    let source = await service.resolve(URI.file(join(testDir, "index.html")), { resolveMetadata: true });
    const originalSize = source.size;
    assert.ok(originalSize > 0);

    const target = URI.file(join(dirname(source.resource.fsPath), "INDEX.html"));

    const canCopy = await service.canCopy(source.resource, target);

    let error;
    let copied: IFileStatWithMetadata;
    try {
      copied = await service.copy(source.resource, target);
    }
    catch (e) {
      error = e;
    }

    if (isLinux) {
      assert.ok(!error);
      assert.strictEqual(canCopy, true);

      assert.strictEqual(existsSync(copied!.resource.fsPath), true);
      assert.ok(readdirSync(testDir).includes("INDEX.html"));
      assert.strictEqual(source.size, copied!.size);
    }
    else {
      assert.ok(error);
      assert.ok(canCopy instanceof Error);

      source = await service.resolve(source.resource, { resolveMetadata: true });
      assert.strictEqual(originalSize, source.size);
    }
  });

  it("copy - MIX CASE same target - overwrite", async () => {
    let source = await service.resolve(URI.file(join(testDir, "index.html")), { resolveMetadata: true });
    const originalSize = source.size;
    assert.ok(originalSize > 0);

    const target = URI.file(join(dirname(source.resource.fsPath), "INDEX.html"));

    const canCopy = await service.canCopy(source.resource, target, true);

    let error;
    let copied: IFileStatWithMetadata;
    try {
      copied = await service.copy(source.resource, target, true);
    }
    catch (e) {
      error = e;
    }

    if (isLinux) {
      assert.ok(!error);
      assert.strictEqual(canCopy, true);

      assert.strictEqual(existsSync(copied!.resource.fsPath), true);
      assert.ok(readdirSync(testDir).includes("INDEX.html"));
      assert.strictEqual(source.size, copied!.size);
    }
    else {
      assert.ok(error);
      assert.ok(canCopy instanceof Error);

      source = await service.resolve(source.resource, { resolveMetadata: true });
      assert.strictEqual(originalSize, source.size);
    }
  });

  it("copy - MIX CASE different target - overwrite", async () => {
    const source1 = await service.resolve(URI.file(join(testDir, "index.html")), { resolveMetadata: true });
    assert.ok(source1.size > 0);

    const renamed = await service.move(source1.resource, URI.file(join(dirname(source1.resource.fsPath), "CONWAY.js")));
    assert.strictEqual(existsSync(renamed.resource.fsPath), true);
    assert.ok(readdirSync(testDir).includes("CONWAY.js"));
    assert.strictEqual(source1.size, renamed.size);

    const source2 = await service.resolve(URI.file(join(testDir, "deep", "conway.js")), { resolveMetadata: true });
    const target = URI.file(join(testDir, basename(source2.resource.path)));

    assert.strictEqual(await service.canCopy(source2.resource, target, true), true);
    const res = await service.copy(source2.resource, target, true);
    assert.strictEqual(existsSync(res.resource.fsPath), true);
    assert.ok(readdirSync(testDir).includes("conway.js"));
    assert.strictEqual(source2.size, res.size);
  });

  it("copy - same file", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const source = await service.resolve(URI.file(join(testDir, "index.html")), { resolveMetadata: true });
    assert.ok(source.size > 0);

    assert.strictEqual(await service.canCopy(source.resource, URI.file(source.resource.fsPath)), true);
    let copied = await service.copy(source.resource, URI.file(source.resource.fsPath));

    assert.strictEqual(existsSync(copied.resource.fsPath), true);
    assert.strictEqual(basename(copied.resource.fsPath), "index.html");
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, source.resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.COPY);
    assert.strictEqual(event!.target!.resource.fsPath, copied.resource.fsPath);

    copied = await service.resolve(source.resource, { resolveMetadata: true });
    assert.strictEqual(source.size, copied.size);
  });

  it("copy - same file #2", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const source = await service.resolve(URI.file(join(testDir, "index.html")), { resolveMetadata: true });
    assert.ok(source.size > 0);

    const targetParent = URI.file(testDir);
    const target = targetParent.with({ path: posix.join(targetParent.path, posix.basename(source.resource.path)) });

    assert.strictEqual(await service.canCopy(source.resource, URI.file(target.fsPath)), true);
    let copied = await service.copy(source.resource, URI.file(target.fsPath));

    assert.strictEqual(existsSync(copied.resource.fsPath), true);
    assert.strictEqual(basename(copied.resource.fsPath), "index.html");
    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, source.resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.COPY);
    assert.strictEqual(event!.target!.resource.fsPath, copied.resource.fsPath);

    copied = await service.resolve(source.resource, { resolveMetadata: true });
    assert.strictEqual(source.size, copied.size);
  });

  it("cloneFile - basics", () => {
    return testCloneFile();
  });

  it("cloneFile - via copy capability", () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose | FileSystemProviderCapabilities.FileFolderCopy);

    return testCloneFile();
  });

  it("cloneFile - via pipe", () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testCloneFile();
  });

  async function testCloneFile(): Promise<void> {
    const source1 = URI.file(join(testDir, "index.html"));
    const source1Size = (await service.resolve(source1, { resolveMetadata: true })).size;

    const source2 = URI.file(join(testDir, "lorem.txt"));
    const source2Size = (await service.resolve(source2, { resolveMetadata: true })).size;

    const targetParent = URI.file(testDir);

    // same path is a no-op
    await service.cloneFile(source1, source1);

    // simple clone to existing parent folder path
    const target1 = targetParent.with({ path: posix.join(targetParent.path, `${posix.basename(source1.path)}-clone`) });

    await service.cloneFile(source1, URI.file(target1.fsPath));

    assert.strictEqual(existsSync(target1.fsPath), true);
    assert.strictEqual(basename(target1.fsPath), "index.html-clone");

    let target1Size = (await service.resolve(target1, { resolveMetadata: true })).size;

    assert.strictEqual(source1Size, target1Size);

    // clone to same path overwrites
    await service.cloneFile(source2, URI.file(target1.fsPath));

    target1Size = (await service.resolve(target1, { resolveMetadata: true })).size;

    assert.strictEqual(source2Size, target1Size);
    assert.notStrictEqual(source1Size, target1Size);

    // clone creates missing folders ad-hoc
    const target2 = targetParent.with({ path: posix.join(targetParent.path, "foo", "bar", `${posix.basename(source1.path)}-clone`) });

    await service.cloneFile(source1, URI.file(target2.fsPath));

    assert.strictEqual(existsSync(target2.fsPath), true);
    assert.strictEqual(basename(target2.fsPath), "index.html-clone");

    const target2Size = (await service.resolve(target2, { resolveMetadata: true })).size;

    assert.strictEqual(source1Size, target2Size);
  }

  it("readFile - small file - default", () => {
    return testReadFile(URI.file(join(testDir, "small.txt")));
  });

  it("readFile - small file - buffered", () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testReadFile(URI.file(join(testDir, "small.txt")));
  });

  it("readFile - small file - buffered / readonly", () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose | FileSystemProviderCapabilities.Readonly);

    return testReadFile(URI.file(join(testDir, "small.txt")));
  });

  it("readFile - small file - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testReadFile(URI.file(join(testDir, "small.txt")));
  });

  it("readFile - small file - unbuffered / readonly", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.Readonly);

    return testReadFile(URI.file(join(testDir, "small.txt")));
  });

  it("readFile - small file - streamed", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return testReadFile(URI.file(join(testDir, "small.txt")));
  });

  it("readFile - small file - streamed / readonly", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream | FileSystemProviderCapabilities.Readonly);

    return testReadFile(URI.file(join(testDir, "small.txt")));
  });

  it("readFile - large file - default", async () => {
    return testReadFile(URI.file(join(testDir, "lorem.txt")));
  });

  it("readFile - large file - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testReadFile(URI.file(join(testDir, "lorem.txt")));
  });

  it("readFile - large file - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testReadFile(URI.file(join(testDir, "lorem.txt")));
  });

  it("readFile - large file - streamed", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return testReadFile(URI.file(join(testDir, "lorem.txt")));
  });

  it("readFile - atomic (emulated on service level)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return testReadFile(URI.file(join(testDir, "lorem.txt")), { atomic: true });
  });

  it("readFile - atomic (natively supported)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite & FileSystemProviderCapabilities.FileAtomicRead);

    return testReadFile(URI.file(join(testDir, "lorem.txt")), { atomic: true });
  });

  async function testReadFile(resource: URI, options?: IReadFileOptions): Promise<void> {
    const content = await service.readFile(resource, options);

    assert.strictEqual(content.value.toString(), readFileSync(resource.fsPath).toString());
  }

  it("readFileStream - small file - default", () => {
    return testReadFileStream(URI.file(join(testDir, "small.txt")));
  });

  it("readFileStream - small file - buffered", () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testReadFileStream(URI.file(join(testDir, "small.txt")));
  });

  it("readFileStream - small file - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testReadFileStream(URI.file(join(testDir, "small.txt")));
  });

  it("readFileStream - small file - streamed", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return testReadFileStream(URI.file(join(testDir, "small.txt")));
  });

  async function testReadFileStream(resource: URI): Promise<void> {
    const content = await service.readFileStream(resource);

    assert.strictEqual((await streamToBuffer(content.value)).toString(), readFileSync(resource.fsPath).toString());
  }

  it("readFile - Files are intermingled #38331 - default", async () => {
    return testFilesNotIntermingled();
  });

  it("readFile - Files are intermingled #38331 - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testFilesNotIntermingled();
  });

  it("readFile - Files are intermingled #38331 - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testFilesNotIntermingled();
  });

  it("readFile - Files are intermingled #38331 - streamed", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return testFilesNotIntermingled();
  });

  async function testFilesNotIntermingled() {
    const resource1 = URI.file(join(testDir, "lorem.txt"));
    const resource2 = URI.file(join(testDir, "some_utf16le.css"));

    // load in sequence and keep data
    const value1 = await service.readFile(resource1);
    const value2 = await service.readFile(resource2);

    // load in parallel in expect the same result
    const result = await Promise.all([
      service.readFile(resource1),
      service.readFile(resource2),
    ]);

    assert.strictEqual(result[0].value.toString(), value1.value.toString());
    assert.strictEqual(result[1].value.toString(), value2.value.toString());
  }

  it("readFile - from position (ASCII) - default", async () => {
    return testReadFileFromPositionAscii();
  });

  it("readFile - from position (ASCII) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testReadFileFromPositionAscii();
  });

  it("readFile - from position (ASCII) - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testReadFileFromPositionAscii();
  });

  it("readFile - from position (ASCII) - streamed", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return testReadFileFromPositionAscii();
  });

  async function testReadFileFromPositionAscii() {
    const resource = URI.file(join(testDir, "small.txt"));

    const contents = await service.readFile(resource, { position: 6 });

    assert.strictEqual(contents.value.toString(), "File");
  }

  it("readFile - from position (with umlaut) - default", async () => {
    return testReadFileFromPositionUmlaut();
  });

  it("readFile - from position (with umlaut) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testReadFileFromPositionUmlaut();
  });

  it("readFile - from position (with umlaut) - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testReadFileFromPositionUmlaut();
  });

  it("readFile - from position (with umlaut) - streamed", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return testReadFileFromPositionUmlaut();
  });

  async function testReadFileFromPositionUmlaut() {
    const resource = URI.file(join(testDir, "small_umlaut.txt"));

    const contents = await service.readFile(resource, { position: Buffer.from("Small File with Ü").length });

    assert.strictEqual(contents.value.toString(), "mlaut");
  }

  it("readFile - 3 bytes (ASCII) - default", async () => {
    return testReadThreeBytesFromFile();
  });

  it("readFile - 3 bytes (ASCII) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testReadThreeBytesFromFile();
  });

  it("readFile - 3 bytes (ASCII) - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testReadThreeBytesFromFile();
  });

  it("readFile - 3 bytes (ASCII) - streamed", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return testReadThreeBytesFromFile();
  });

  async function testReadThreeBytesFromFile() {
    const resource = URI.file(join(testDir, "small.txt"));

    const contents = await service.readFile(resource, { length: 3 });

    assert.strictEqual(contents.value.toString(), "Sma");
  }

  it("readFile - 20000 bytes (large) - default", async () => {
    return readLargeFileWithLength(20000);
  });

  it("readFile - 20000 bytes (large) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return readLargeFileWithLength(20000);
  });

  it("readFile - 20000 bytes (large) - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return readLargeFileWithLength(20000);
  });

  it("readFile - 20000 bytes (large) - streamed", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return readLargeFileWithLength(20000);
  });

  it("readFile - 80000 bytes (large) - default", async () => {
    return readLargeFileWithLength(80000);
  });

  it("readFile - 80000 bytes (large) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return readLargeFileWithLength(80000);
  });

  it("readFile - 80000 bytes (large) - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return readLargeFileWithLength(80000);
  });

  it("readFile - 80000 bytes (large) - streamed", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return readLargeFileWithLength(80000);
  });

  async function readLargeFileWithLength(length: number) {
    const resource = URI.file(join(testDir, "lorem.txt"));

    const contents = await service.readFile(resource, { length });

    assert.strictEqual(contents.value.byteLength, length);
  }

  it("readFile - FILE_IS_DIRECTORY", async () => {
    const resource = URI.file(join(testDir, "deep"));

    let error: FileOperationError | undefined;
    try {
      await service.readFile(resource);
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(error);
    assert.strictEqual(error.fileOperationResult, FileOperationResult.FILE_IS_DIRECTORY);
  });

  (isWindows /* error code does not seem to be supported on windows */ ? it.skip : it)("readFile - FILE_NOT_DIRECTORY", async () => {
    const resource = URI.file(join(testDir, "lorem.txt", "file.txt"));

    let error: FileOperationError | undefined;
    try {
      await service.readFile(resource);
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(error);
    assert.strictEqual(error.fileOperationResult, FileOperationResult.FILE_NOT_DIRECTORY);
  });

  it("readFile - FILE_NOT_FOUND", async () => {
    const resource = URI.file(join(testDir, "404.html"));

    let error: FileOperationError | undefined;
    try {
      await service.readFile(resource);
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(error);
    assert.strictEqual(error.fileOperationResult, FileOperationResult.FILE_NOT_FOUND);
  });

  it("readFile - FILE_NOT_MODIFIED_SINCE - default", async () => {
    return testNotModifiedSince();
  });

  it("readFile - FILE_NOT_MODIFIED_SINCE - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testNotModifiedSince();
  });

  it("readFile - FILE_NOT_MODIFIED_SINCE - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testNotModifiedSince();
  });

  it("readFile - FILE_NOT_MODIFIED_SINCE - streamed", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return testNotModifiedSince();
  });

  async function testNotModifiedSince() {
    const resource = URI.file(join(testDir, "index.html"));

    const contents = await service.readFile(resource);
    fileProvider.totalBytesRead = 0;

    let error: FileOperationError | undefined;
    try {
      await service.readFile(resource, { etag: contents.etag });
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(error);
    assert.strictEqual(error.fileOperationResult, FileOperationResult.FILE_NOT_MODIFIED_SINCE);
    assert.ok(error instanceof NotModifiedSinceFileOperationError && error.stat);
    assert.strictEqual(fileProvider.totalBytesRead, 0);
  }

  it("readFile - FILE_NOT_MODIFIED_SINCE does not fire wrongly - https://github.com/microsoft/vscode/issues/72909", async () => {
    fileProvider.setInvalidStatSize(true);

    const resource = URI.file(join(testDir, "index.html"));

    await service.readFile(resource);

    let error: FileOperationError | undefined;
    try {
      await service.readFile(resource, { etag: undefined });
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(!error);
  });

  it("readFile - FILE_TOO_LARGE - default", async () => {
    return testFileTooLarge();
  });

  it("readFile - FILE_TOO_LARGE - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testFileTooLarge();
  });

  it("readFile - FILE_TOO_LARGE - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testFileTooLarge();
  });

  it("readFile - FILE_TOO_LARGE - streamed", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadStream);

    return testFileTooLarge();
  });

  async function testFileTooLarge() {
    await doTestFileTooLarge(false);

    // Also test when the stat size is wrong
    fileProvider.setSmallStatSize(true);
    return doTestFileTooLarge(true);
  }

  async function doTestFileTooLarge(statSizeWrong: boolean) {
    const resource = URI.file(join(testDir, "index.html"));

    let error: FileOperationError | undefined;
    try {
      await service.readFile(resource, { limits: { size: 10 } });
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    if (!statSizeWrong) {
      assert.ok(error instanceof TooLargeFileOperationError);
      assert.ok(typeof error.size === "number");
    }
    assert.strictEqual(error!.fileOperationResult, FileOperationResult.FILE_TOO_LARGE);
  }

  (isWindows ? it.skip /* windows: cannot create file symbolic link without elevated context */ : it)("readFile - dangling symbolic link - https://github.com/microsoft/vscode/issues/116049", async () => {
    const link = URI.file(join(testDir, "small.js-link"));
    await promises.symlink(join(testDir, "small.js"), link.fsPath);

    let error: FileOperationError | undefined;
    try {
      await service.readFile(link);
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(error);
  });

  it("createFile", async () => {
    return assertCreateFile(contents => VSBuffer.fromString(contents));
  });

  it("createFile (readable)", async () => {
    return assertCreateFile(contents => bufferToReadable(VSBuffer.fromString(contents)));
  });

  it("createFile (stream)", async () => {
    return assertCreateFile(contents => bufferToStream(VSBuffer.fromString(contents)));
  });

  async function assertCreateFile(converter: (content: string) => VSBuffer | VSBufferReadable | VSBufferReadableStream): Promise<void> {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const contents = "Hello World";
    const resource = URI.file(join(testDir, "test.txt"));

    assert.strictEqual(await service.canCreateFile(resource), true);
    const fileStat = await service.createFile(resource, converter(contents));
    assert.strictEqual(fileStat.name, "test.txt");
    assert.strictEqual(existsSync(fileStat.resource.fsPath), true);
    assert.strictEqual(readFileSync(fileStat.resource.fsPath).toString(), contents);

    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.CREATE);
    assert.strictEqual(event!.target!.resource.fsPath, resource.fsPath);
  }

  it("createFile (does not overwrite by default)", async () => {
    const contents = "Hello World";
    const resource = URI.file(join(testDir, "test.txt"));

    writeFileSync(resource.fsPath, ""); // create file

    assert.ok((await service.canCreateFile(resource)) instanceof Error);

    let error;
    try {
      await service.createFile(resource, VSBuffer.fromString(contents));
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(error);
  });

  it("createFile (allows to overwrite existing)", async () => {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const contents = "Hello World";
    const resource = URI.file(join(testDir, "test.txt"));

    writeFileSync(resource.fsPath, ""); // create file

    assert.strictEqual(await service.canCreateFile(resource, { overwrite: true }), true);
    const fileStat = await service.createFile(resource, VSBuffer.fromString(contents), { overwrite: true });
    assert.strictEqual(fileStat.name, "test.txt");
    assert.strictEqual(existsSync(fileStat.resource.fsPath), true);
    assert.strictEqual(readFileSync(fileStat.resource.fsPath).toString(), contents);

    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.CREATE);
    assert.strictEqual(event!.target!.resource.fsPath, resource.fsPath);
  });

  it("writeFile - default", async () => {
    return testWriteFile(false);
  });

  it("writeFile - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testWriteFile(false);
  });

  it("writeFile - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testWriteFile(false);
  });

  it("writeFile - default (atomic)", async () => {
    return testWriteFile(true);
  });

  it("writeFile - buffered (atomic)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose | FileSystemProviderCapabilities.FileAtomicWrite);

    let e;
    try {
      await testWriteFile(true);
    }
    catch (error) {
      e = error;
    }

    assert.ok(e);
  });

  it("writeFile - unbuffered (atomic)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.FileAtomicWrite);

    return testWriteFile(true);
  });

  (isWindows ? it.skip /* windows: cannot create file symbolic link without elevated context */ : it)("writeFile - atomic writing does not break symlinks", async () => {
    const link = URI.file(join(testDir, "lorem.txt-linked"));
    await promises.symlink(join(testDir, "lorem.txt"), link.fsPath);

    const content = "Updates to the lorem file";
    await service.writeFile(link, VSBuffer.fromString(content), { atomic: { postfix: ".vsctmp" } });
    assert.strictEqual(readFileSync(link.fsPath).toString(), content);

    const resolved = await service.resolve(link);
    assert.strictEqual(resolved.isSymbolicLink, true);
  });

  async function testWriteFile(atomic: boolean) {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const resource = URI.file(join(testDir, "small.txt"));

    const content = readFileSync(resource.fsPath).toString();
    assert.strictEqual(content, "Small File");

    const newContent = "Updates to the small file";
    await service.writeFile(resource, VSBuffer.fromString(newContent), { atomic: atomic ? { postfix: ".vsctmp" } : false });

    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.WRITE);

    assert.strictEqual(readFileSync(resource.fsPath).toString(), newContent);
  }

  it("writeFile (large file) - default", async () => {
    return testWriteFileLarge(false);
  });

  it("writeFile (large file) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testWriteFileLarge(false);
  });

  it("writeFile (large file) - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testWriteFileLarge(false);
  });

  it("writeFile (large file) - default (atomic)", async () => {
    return testWriteFileLarge(true);
  });

  it("writeFile (large file) - buffered (atomic)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose | FileSystemProviderCapabilities.FileAtomicWrite);

    let e;
    try {
      await testWriteFileLarge(true);
    }
    catch (error) {
      e = error;
    }

    assert.ok(e);
  });

  it("writeFile (large file) - unbuffered (atomic)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.FileAtomicWrite);

    return testWriteFileLarge(true);
  });

  async function testWriteFileLarge(atomic: boolean) {
    const resource = URI.file(join(testDir, "lorem.txt"));

    const content = readFileSync(resource.fsPath);
    const newContent = content.toString() + content.toString();

    const fileStat = await service.writeFile(resource, VSBuffer.fromString(newContent), { atomic: atomic ? { postfix: ".vsctmp" } : false });
    assert.strictEqual(fileStat.name, "lorem.txt");

    assert.strictEqual(readFileSync(resource.fsPath).toString(), newContent);
  }

  it("writeFile (large file) - unbuffered (atomic) - concurrent writes with multiple services", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.FileAtomicWrite);

    const resource = URI.file(join(testDir, "lorem.txt"));

    const content = readFileSync(resource.fsPath);
    const newContent = content.toString() + content.toString();

    const promises: Promise<IFileStatWithMetadata>[] = [];
    let suffix = 0;
    for (let i = 0; i < 10; i++) {
      const service = disposables.add(new FileService(createMockLogger()));
      disposables.add(service.registerProvider("file", fileProvider));

      promises.push(service.writeFile(resource, VSBuffer.fromString(`${newContent}${++suffix}`), { atomic: { postfix: ".vsctmp" } }));
      await new Promise(r => setTimeout(r, 0));
    }

    await Promise.allSettled(promises);

    assert.strictEqual(readFileSync(resource.fsPath).toString(), `${newContent}${suffix}`);
  });

  it("writeFile - buffered - readonly throws", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose | FileSystemProviderCapabilities.Readonly);

    return testWriteFileReadonlyThrows();
  });

  it("writeFile - unbuffered - readonly throws", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.Readonly);

    return testWriteFileReadonlyThrows();
  });

  async function testWriteFileReadonlyThrows() {
    const resource = URI.file(join(testDir, "small.txt"));

    const content = readFileSync(resource.fsPath).toString();
    assert.strictEqual(content, "Small File");

    const newContent = "Updates to the small file";

    let error: Error;
    try {
      await service.writeFile(resource, VSBuffer.fromString(newContent));
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(error!);
  }

  it("writeFile (large file) - multiple parallel writes queue up and atomic read support (via file service)", async () => {
    const resource = URI.file(join(testDir, "lorem.txt"));

    const content = readFileSync(resource.fsPath);
    const newContent = content.toString() + content.toString();

    const writePromises = Promise.all(["0", "00", "000", "0000", "00000"].map(async (offset) => {
      const fileStat = await service.writeFile(resource, VSBuffer.fromString(offset + newContent));
      assert.strictEqual(fileStat.name, "lorem.txt");
    }));

    const readPromises = Promise.all(["0", "00", "000", "0000", "00000"].map(async () => {
      const fileContent = await service.readFile(resource, { atomic: true });
      assert.ok(fileContent.value.byteLength > 0); // `atomic: true` ensures we never read a truncated file
    }));

    await Promise.all([writePromises, readPromises]);
  });

  it("provider - write barrier prevents dirty writes", async () => {
    const resource = URI.file(join(testDir, "lorem.txt"));

    const content = readFileSync(resource.fsPath);
    const newContent = content.toString() + content.toString();

    const provider = service.getProvider(resource.scheme);
    assert.ok(provider);
    assert.ok(hasOpenReadWriteCloseCapability(provider));

    const writePromises = Promise.all(["0", "00", "000", "0000", "00000"].map(async (offset) => {
      const content = offset + newContent;
      const contentBuffer = VSBuffer.fromString(content).buffer;

      const fd = await provider.open(resource, { create: true, unlock: false });
      try {
        await provider.write(fd, 0, VSBuffer.fromString(content).buffer, 0, contentBuffer.byteLength);

        // Here since `close` is not called, all other writes are
        // waiting on the barrier to release, so doing a readFile
        // should give us a consistent view of the file contents
        assert.strictEqual((await promises.readFile(resource.fsPath)).toString(), content);
      }
      finally {
        await provider.close(fd);
      }
    }));

    await Promise.all([writePromises]);
  });

  it("provider - write barrier is partitioned per resource", async () => {
    const resource1 = URI.file(join(testDir, "lorem.txt"));
    const resource2 = URI.file(join(testDir, "test.txt"));

    const provider = service.getProvider(resource1.scheme);
    assert.ok(provider);
    assert.ok(hasOpenReadWriteCloseCapability(provider));

    const fd1 = await provider.open(resource1, { create: true, unlock: false });
    const fd2 = await provider.open(resource2, { create: true, unlock: false });

    const newContent = "Hello World";

    try {
      await provider.write(fd1, 0, VSBuffer.fromString(newContent).buffer, 0, VSBuffer.fromString(newContent).buffer.byteLength);
      assert.strictEqual((await promises.readFile(resource1.fsPath)).toString(), newContent);

      await provider.write(fd2, 0, VSBuffer.fromString(newContent).buffer, 0, VSBuffer.fromString(newContent).buffer.byteLength);
      assert.strictEqual((await promises.readFile(resource2.fsPath)).toString(), newContent);
    }
    finally {
      await Promise.allSettled([
        await provider.close(fd1),
        await provider.close(fd2),
      ]);
    }
  });

  it("provider - write barrier not becoming stale", async () => {
    const newFolder = join(testDir, "new-folder");
    const newResource = URI.file(join(newFolder, "lorem.txt"));

    const provider = service.getProvider(newResource.scheme);
    assert.ok(provider);
    assert.ok(hasOpenReadWriteCloseCapability(provider));

    let error: Error | undefined;
    try {
      await provider.open(newResource, { create: true, unlock: false });
    }
    catch (e) {
      error = e;
    }

    assert.ok(error); // expected because `new-folder` does not exist

    await promises.mkdir(newFolder);

    const content = readFileSync(URI.file(join(testDir, "lorem.txt")).fsPath);
    const newContent = content.toString() + content.toString();
    const newContentBuffer = VSBuffer.fromString(newContent).buffer;

    const fd = await provider.open(newResource, { create: true, unlock: false });
    try {
      await provider.write(fd, 0, newContentBuffer, 0, newContentBuffer.byteLength);

      assert.strictEqual((await promises.readFile(newResource.fsPath)).toString(), newContent);
    }
    finally {
      await provider.close(fd);
    }
  });

  it("provider - atomic reads (write pending when read starts)", async () => {
    const resource = URI.file(join(testDir, "lorem.txt"));

    const content = readFileSync(resource.fsPath);
    const newContent = content.toString() + content.toString();
    const newContentBuffer = VSBuffer.fromString(newContent).buffer;

    const provider = service.getProvider(resource.scheme);
    assert.ok(provider);
    assert.ok(hasOpenReadWriteCloseCapability(provider));
    assert.ok(hasFileAtomicReadCapability(provider));

    let atomicReadPromise: Promise<Uint8Array> | undefined;
    const fd = await provider.open(resource, { create: true, unlock: false });
    try {
      // Start reading while write is pending
      atomicReadPromise = provider.readFile(resource, { atomic: true });

      // Simulate a slow write, giving the read
      // a chance to succeed if it were not atomic
      await new Promise(r => setTimeout(r, 20));

      await provider.write(fd, 0, newContentBuffer, 0, newContentBuffer.byteLength);
    }
    finally {
      await provider.close(fd);
    }

    assert.ok(atomicReadPromise);

    const atomicReadResult = await atomicReadPromise;
    assert.strictEqual(atomicReadResult.byteLength, newContentBuffer.byteLength);
  });

  it("provider - atomic reads (read pending when write starts)", async () => {
    const resource = URI.file(join(testDir, "lorem.txt"));

    const content = readFileSync(resource.fsPath);
    const newContent = content.toString() + content.toString();
    const newContentBuffer = VSBuffer.fromString(newContent).buffer;

    const provider = service.getProvider(resource.scheme);
    assert.ok(provider);
    assert.ok(hasOpenReadWriteCloseCapability(provider));
    assert.ok(hasFileAtomicReadCapability(provider));

    let atomicReadPromise = provider.readFile(resource, { atomic: true });

    const fdPromise = provider.open(resource, { create: true, unlock: false }).then(async (fd) => {
      try {
        return await provider.write(fd, 0, newContentBuffer, 0, newContentBuffer.byteLength);
      }
      finally {
        await provider.close(fd);
      }
    });

    let atomicReadResult = await atomicReadPromise;
    assert.strictEqual(atomicReadResult.byteLength, content.byteLength);

    await fdPromise;

    atomicReadPromise = provider.readFile(resource, { atomic: true });
    atomicReadResult = await atomicReadPromise;
    assert.strictEqual(atomicReadResult.byteLength, newContentBuffer.byteLength);
  });

  it("writeFile (readable) - default", async () => {
    return testWriteFileReadable();
  });

  it("writeFile (readable) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testWriteFileReadable();
  });

  it("writeFile (readable) - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testWriteFileReadable();
  });

  async function testWriteFileReadable() {
    const resource = URI.file(join(testDir, "small.txt"));

    const content = readFileSync(resource.fsPath).toString();
    assert.strictEqual(content, "Small File");

    const newContent = "Updates to the small file";
    await service.writeFile(resource, toLineByLineReadable(newContent));

    assert.strictEqual(readFileSync(resource.fsPath).toString(), newContent);
  }

  it("writeFile (large file - readable) - default", async () => {
    return testWriteFileLargeReadable();
  });

  it("writeFile (large file - readable) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testWriteFileLargeReadable();
  });

  it("writeFile (large file - readable) - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testWriteFileLargeReadable();
  });

  async function testWriteFileLargeReadable() {
    const resource = URI.file(join(testDir, "lorem.txt"));

    const content = readFileSync(resource.fsPath);
    const newContent = content.toString() + content.toString();

    const fileStat = await service.writeFile(resource, toLineByLineReadable(newContent));
    assert.strictEqual(fileStat.name, "lorem.txt");

    assert.strictEqual(readFileSync(resource.fsPath).toString(), newContent);
  }

  it("writeFile (stream) - default", async () => {
    return testWriteFileStream();
  });

  it("writeFile (stream) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testWriteFileStream();
  });

  it("writeFile (stream) - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testWriteFileStream();
  });

  async function testWriteFileStream() {
    const source = URI.file(join(testDir, "small.txt"));
    const target = URI.file(join(testDir, "small-copy.txt"));

    const fileStat = await service.writeFile(target, streamToBufferReadableStream(createReadStream(source.fsPath)));
    assert.strictEqual(fileStat.name, "small-copy.txt");

    const targetContents = readFileSync(target.fsPath).toString();
    assert.strictEqual(readFileSync(source.fsPath).toString(), targetContents);
  }

  it("writeFile (large file - stream) - default", async () => {
    return testWriteFileLargeStream();
  });

  it("writeFile (large file - stream) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testWriteFileLargeStream();
  });

  it("writeFile (large file - stream) - unbuffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testWriteFileLargeStream();
  });

  async function testWriteFileLargeStream() {
    const source = URI.file(join(testDir, "lorem.txt"));
    const target = URI.file(join(testDir, "lorem-copy.txt"));

    const fileStat = await service.writeFile(target, streamToBufferReadableStream(createReadStream(source.fsPath)));
    assert.strictEqual(fileStat.name, "lorem-copy.txt");

    const targetContents = readFileSync(target.fsPath).toString();
    assert.strictEqual(readFileSync(source.fsPath).toString(), targetContents);
  }

  it("writeFile (file is created including parents)", async () => {
    const resource = URI.file(join(testDir, "other", "newfile.txt"));

    const content = "File is created including parent";
    const fileStat = await service.writeFile(resource, VSBuffer.fromString(content));
    assert.strictEqual(fileStat.name, "newfile.txt");

    assert.strictEqual(readFileSync(resource.fsPath).toString(), content);
  });

  it("writeFile - locked files and unlocking", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.FileWriteUnlock);

    return testLockedFiles(false);
  });

  it("writeFile (stream) - locked files and unlocking", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose | FileSystemProviderCapabilities.FileWriteUnlock);

    return testLockedFiles(false);
  });

  it("writeFile - locked files and unlocking throws error when missing capability", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite);

    return testLockedFiles(true);
  });

  it("writeFile (stream) - locked files and unlocking throws error when missing capability", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    return testLockedFiles(true);
  });

  async function testLockedFiles(expectError: boolean) {
    const lockedFile = URI.file(join(testDir, "my-locked-file"));

    const content = await service.writeFile(lockedFile, VSBuffer.fromString("Locked File"));
    assert.strictEqual(content.locked, false);

    const stats = await promises.stat(lockedFile.fsPath);
    await promises.chmod(lockedFile.fsPath, stats.mode & ~0o200);

    let stat = await service.stat(lockedFile);
    assert.strictEqual(stat.locked, true);

    let error;
    const newContent = "Updates to locked file";
    try {
      await service.writeFile(lockedFile, VSBuffer.fromString(newContent));
    }
    catch (e) {
      error = e;
    }

    assert.ok(error);
    error = undefined;

    if (expectError) {
      try {
        await service.writeFile(lockedFile, VSBuffer.fromString(newContent), { unlock: true });
      }
      catch (e) {
        error = e;
      }

      assert.ok(error);
    }
    else {
      await service.writeFile(lockedFile, VSBuffer.fromString(newContent), { unlock: true });
      assert.strictEqual(readFileSync(lockedFile.fsPath).toString(), newContent);

      stat = await service.stat(lockedFile);
      assert.strictEqual(stat.locked, false);
    }
  }

  it("writeFile (error when folder is encountered)", async () => {
    const resource = URI.file(testDir);

    let error: Error | undefined;
    try {
      await service.writeFile(resource, VSBuffer.fromString("File is created including parent"));
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(error);
  });

  it("writeFile (no error when providing up to date etag)", async () => {
    const resource = URI.file(join(testDir, "small.txt"));

    const stat = await service.resolve(resource);

    const content = readFileSync(resource.fsPath).toString();
    assert.strictEqual(content, "Small File");

    const newContent = "Updates to the small file";
    await service.writeFile(resource, VSBuffer.fromString(newContent), { etag: stat.etag, mtime: stat.mtime });

    assert.strictEqual(readFileSync(resource.fsPath).toString(), newContent);
  });

  it("writeFile - error when writing to file that has been updated meanwhile", async () => {
    const resource = URI.file(join(testDir, "small.txt"));

    const stat = await service.resolve(resource);

    const content = readFileSync(resource.fsPath).toString();
    assert.strictEqual(content, "Small File");

    const newContent = "Updates to the small file";
    await service.writeFile(resource, VSBuffer.fromString(newContent), { etag: stat.etag, mtime: stat.mtime });

    const newContentLeadingToError = newContent + newContent;

    const fakeMtime = 1000;
    const fakeSize = 1000;

    let error: FileOperationError | undefined;
    try {
      await service.writeFile(resource, VSBuffer.fromString(newContentLeadingToError), { etag: etag({ mtime: fakeMtime, size: fakeSize }), mtime: fakeMtime });
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(error);
    assert.ok(error instanceof FileOperationError);
    assert.strictEqual(error.fileOperationResult, FileOperationResult.FILE_MODIFIED_SINCE);
  });

  it("writeFile - no error when writing to file where size is the same", async () => {
    const resource = URI.file(join(testDir, "small.txt"));

    const stat = await service.resolve(resource);

    const content = readFileSync(resource.fsPath).toString();
    assert.strictEqual(content, "Small File");

    const newContent = content; // same content
    await service.writeFile(resource, VSBuffer.fromString(newContent), { etag: stat.etag, mtime: stat.mtime });

    const newContentLeadingToNoError = newContent; // writing the same content should be OK

    const fakeMtime = 1000;
    const actualSize = newContent.length;

    let error: FileOperationError | undefined;
    try {
      await service.writeFile(resource, VSBuffer.fromString(newContentLeadingToNoError), { etag: etag({ mtime: fakeMtime, size: actualSize }), mtime: fakeMtime });
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(!error);
  });

  it("writeFile - no error when writing to file where content is the same", async () => {
    const resource = URI.file(join(testDir, "small.txt"));

    await service.resolve(resource);

    const content = readFileSync(resource.fsPath).toString();
    assert.strictEqual(content, "Small File");

    const newContent = content; // same content
    let error: FileOperationError | undefined;
    try {
      await service.writeFile(resource, VSBuffer.fromString(newContent), { etag: "anything", mtime: 0 } /* fake it */);
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(!error);
  });

  it("writeFile - error when writing to file where content is the same length but different", async () => {
    const resource = URI.file(join(testDir, "small.txt"));

    await service.resolve(resource);

    const content = readFileSync(resource.fsPath).toString();
    assert.strictEqual(content, "Small File");

    const newContent = content.split("").reverse().join(""); // reverse content
    let error: FileOperationError | undefined;
    try {
      await service.writeFile(resource, VSBuffer.fromString(newContent), { etag: "anything", mtime: 0 } /* fake it */);
    }
    catch (err) {
      console.log("[DEBUG TEST] caught error", err?.constructor?.name, err?.message, err?.fileOperationResult);
      error = err;
    }

    assert.ok(error);
    assert.ok(error instanceof FileOperationError);
    assert.strictEqual(error.fileOperationResult, FileOperationResult.FILE_MODIFIED_SINCE);
  });

  it("writeFile - no error when writing to same nonexistent folder multiple times different new files", async () => {
    const newFolder = URI.file(join(testDir, "some", "new", "folder"));

    const file1 = joinPath(newFolder, "file-1");
    const file2 = joinPath(newFolder, "file-2");
    const file3 = joinPath(newFolder, "file-3");

    // this essentially verifies that the mkdirp logic implemented
    // in the file service is able to receive multiple requests for
    // the same folder and will not throw errors if another racing
    // call succeeded first.
    const newContent = "Updates to the small file";
    await Promise.all([
      service.writeFile(file1, VSBuffer.fromString(newContent)),
      service.writeFile(file2, VSBuffer.fromString(newContent)),
      service.writeFile(file3, VSBuffer.fromString(newContent)),
    ]);

    assert.ok(service.exists(file1));
    assert.ok(service.exists(file2));
    assert.ok(service.exists(file3));
  });

  it("writeFile - error when writing to folder that is a file", async () => {
    const existingFile = URI.file(join(testDir, "my-file"));

    await service.createFile(existingFile);

    const newFile = joinPath(existingFile, "file-1");

    let error;
    const newContent = "Updates to the small file";
    try {
      await service.writeFile(newFile, VSBuffer.fromString(newContent));
    }
    catch (e) {
      error = e;
    }

    assert.ok(error);
  });

  it("appendFile", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.FileAppend);

    return testAppendFile();
  });

  it("appendFile - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose | FileSystemProviderCapabilities.FileAppend);

    return testAppendFile();
  });

  async function testAppendFile() {
    let event: FileOperationEvent;
    disposables.add(service.onDidRunOperation(e => event = e));

    const resource = URI.file(join(testDir, "small.txt"));

    const content = readFileSync(resource.fsPath).toString();
    assert.strictEqual(content, "Small File");

    const appendContent = " - Appended!";
    await service.writeFile(resource, VSBuffer.fromString(appendContent), { append: true });

    assert.ok(event!);
    assert.strictEqual(event!.resource.fsPath, resource.fsPath);
    assert.strictEqual(event!.operation, FileOperation.WRITE);

    assert.strictEqual(readFileSync(resource.fsPath).toString(), "Small File - Appended!");
  }

  it("appendFile (readable)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.FileAppend);

    return testAppendFileReadable();
  });

  it("appendFile (readable) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose | FileSystemProviderCapabilities.FileAppend);

    return testAppendFileReadable();
  });

  async function testAppendFileReadable() {
    const resource = URI.file(join(testDir, "small.txt"));

    const content = readFileSync(resource.fsPath).toString();
    assert.strictEqual(content, "Small File");

    const appendContent = " - Appended via readable!";
    await service.writeFile(resource, bufferToReadable(VSBuffer.fromString(appendContent)), { append: true });

    assert.strictEqual(readFileSync(resource.fsPath).toString(), "Small File - Appended via readable!");
  }

  it("appendFile (stream)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.FileAppend);

    return testAppendFileStream();
  });

  it("appendFile (stream) - buffered", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose | FileSystemProviderCapabilities.FileAppend);

    return testAppendFileStream();
  });

  async function testAppendFileStream() {
    const resource = URI.file(join(testDir, "small.txt"));

    const content = readFileSync(resource.fsPath).toString();
    assert.strictEqual(content, "Small File");

    const appendContent = " - Appended via stream!";
    await service.writeFile(resource, bufferToStream(VSBuffer.fromString(appendContent)), { append: true });

    assert.strictEqual(readFileSync(resource.fsPath).toString(), "Small File - Appended via stream!");
  }

  it("appendFile - creates file if not exists", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.FileAppend);

    return testAppendFileCreatesFile();
  });

  it("appendFile - creates file if not exists (buffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose | FileSystemProviderCapabilities.FileAppend);

    return testAppendFileCreatesFile();
  });

  async function testAppendFileCreatesFile() {
    const resource = URI.file(join(testDir, "appendfile-new.txt"));

    assert.strictEqual(existsSync(resource.fsPath), false);

    const content = "Initial content via append";
    await service.writeFile(resource, VSBuffer.fromString(content), { append: true });

    assert.strictEqual(existsSync(resource.fsPath), true);
    assert.strictEqual(readFileSync(resource.fsPath).toString(), content);
  }

  it("appendFile - multiple appends", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileReadWrite | FileSystemProviderCapabilities.FileAppend);

    return testAppendFileMultiple();
  });

  it("appendFile - multiple appends (buffered)", async () => {
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose | FileSystemProviderCapabilities.FileAppend);

    return testAppendFileMultiple();
  });

  async function testAppendFileMultiple() {
    const resource = URI.file(join(testDir, "appendfile-multiple.txt"));

    await service.writeFile(resource, VSBuffer.fromString("Line 1\n"), { append: true });
    await service.writeFile(resource, VSBuffer.fromString("Line 2\n"), { append: true });
    await service.writeFile(resource, VSBuffer.fromString("Line 3\n"), { append: true });

    assert.strictEqual(readFileSync(resource.fsPath).toString(), "Line 1\nLine 2\nLine 3\n");
  }

  it("appendFile - throws when provider does not support append", async () => {
    // Remove FileAppend capability - should throw error
    setCapabilities(fileProvider, FileSystemProviderCapabilities.FileOpenReadWriteClose);

    const resource = URI.file(join(testDir, "small.txt"));
    const appendContent = " - Appended via fallback!";

    let error: Error | undefined;
    try {
      await service.writeFile(resource, VSBuffer.fromString(appendContent), { append: true });
    }
    catch (e) {
      error = e as Error;
    }

    assert.ok(error);
    assert.ok(error.message.includes("does not support append"));
  });

  it("read - mixed positions", async () => {
    const resource = URI.file(join(testDir, "lorem.txt"));

    // read multiple times from position 0
    let buffer = VSBuffer.alloc(1024);
    let fd = await fileProvider.open(resource, { create: false });
    for (let i = 0; i < 3; i++) {
      await fileProvider.read(fd, 0, buffer.buffer, 0, 26);
      assert.strictEqual(buffer.slice(0, 26).toString(), "Lorem ipsum dolor sit amet");
    }
    await fileProvider.close(fd);

    // read multiple times at various locations
    buffer = VSBuffer.alloc(1024);
    fd = await fileProvider.open(resource, { create: false });

    let posInFile = 0;

    await fileProvider.read(fd, posInFile, buffer.buffer, 0, 26);
    assert.strictEqual(buffer.slice(0, 26).toString(), "Lorem ipsum dolor sit amet");
    posInFile += 26;

    await fileProvider.read(fd, posInFile, buffer.buffer, 0, 1);
    assert.strictEqual(buffer.slice(0, 1).toString(), ",");
    posInFile += 1;

    await fileProvider.read(fd, posInFile, buffer.buffer, 0, 12);
    assert.strictEqual(buffer.slice(0, 12).toString(), " consectetur");
    posInFile += 12;

    await fileProvider.read(fd, 98 /* no longer in sequence of posInFile */, buffer.buffer, 0, 9);
    assert.strictEqual(buffer.slice(0, 9).toString(), "fermentum");

    await fileProvider.read(fd, 27, buffer.buffer, 0, 12);
    assert.strictEqual(buffer.slice(0, 12).toString(), " consectetur");

    await fileProvider.read(fd, 26, buffer.buffer, 0, 1);
    assert.strictEqual(buffer.slice(0, 1).toString(), ",");

    await fileProvider.read(fd, 0, buffer.buffer, 0, 26);
    assert.strictEqual(buffer.slice(0, 26).toString(), "Lorem ipsum dolor sit amet");

    await fileProvider.read(fd, posInFile /* back in sequence */, buffer.buffer, 0, 11);
    assert.strictEqual(buffer.slice(0, 11).toString(), " adipiscing");

    await fileProvider.close(fd);
  });

  it("write - mixed positions", async () => {
    const resource = URI.file(join(testDir, "lorem.txt"));

    const buffer = VSBuffer.alloc(1024);
    const fdWrite = await fileProvider.open(resource, { create: true, unlock: false });
    const fdRead = await fileProvider.open(resource, { create: false });

    let posInFileWrite = 0;
    let posInFileRead = 0;

    const initialContents = VSBuffer.fromString("Lorem ipsum dolor sit amet");
    await fileProvider.write(fdWrite, posInFileWrite, initialContents.buffer, 0, initialContents.byteLength);
    posInFileWrite += initialContents.byteLength;

    await fileProvider.read(fdRead, posInFileRead, buffer.buffer, 0, 26);
    assert.strictEqual(buffer.slice(0, 26).toString(), "Lorem ipsum dolor sit amet");
    posInFileRead += 26;

    const contents = VSBuffer.fromString("Hello World");

    await fileProvider.write(fdWrite, posInFileWrite, contents.buffer, 0, contents.byteLength);
    posInFileWrite += contents.byteLength;

    await fileProvider.read(fdRead, posInFileRead, buffer.buffer, 0, contents.byteLength);
    assert.strictEqual(buffer.slice(0, contents.byteLength).toString(), "Hello World");
    posInFileRead += contents.byteLength;

    await fileProvider.write(fdWrite, 6, contents.buffer, 0, contents.byteLength);

    await fileProvider.read(fdRead, 0, buffer.buffer, 0, 11);
    assert.strictEqual(buffer.slice(0, 11).toString(), "Lorem Hello");

    await fileProvider.write(fdWrite, posInFileWrite, contents.buffer, 0, contents.byteLength);
    posInFileWrite += contents.byteLength;

    await fileProvider.read(fdRead, posInFileWrite - contents.byteLength, buffer.buffer, 0, contents.byteLength);
    assert.strictEqual(buffer.slice(0, contents.byteLength).toString(), "Hello World");

    await fileProvider.close(fdWrite);
    await fileProvider.close(fdRead);
  });

  it("readonly - is handled properly for a single resource", async () => {
    fileProvider.setReadonly(true);

    const resource = URI.file(join(testDir, "index.html"));

    const resolveResult = await service.resolve(resource);
    assert.strictEqual(resolveResult.readonly, true);

    const readResult = await service.readFile(resource);
    assert.strictEqual(readResult.readonly, true);

    let writeFileError: Error | undefined;
    try {
      await service.writeFile(resource, VSBuffer.fromString("Hello Test"));
    }
    catch (error) {
      writeFileError = error;
    }
    assert.ok(writeFileError);

    let deleteFileError: Error | undefined;
    try {
      await service.del(resource);
    }
    catch (error) {
      deleteFileError = error;
    }
    assert.ok(deleteFileError);
  });
});
