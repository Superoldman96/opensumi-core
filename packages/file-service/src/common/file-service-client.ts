import {
  BinaryBuffer,
  DidFilesChangedParams,
  Event,
  FileChangeEvent,
  FileSystemProviderCapabilities,
  IDisposable,
  IFileServiceClient as IFileServiceClientToken,
  URI,
} from '@opensumi/ide-core-common';

import {
  FileCopyOptions,
  FileCreateOptions,
  FileDeleteOptions,
  FileMoveOptions,
  FileSetContentOptions,
  FileStat,
  FileSystemProvider,
  IFileSystemProviderActivationEvent,
  IFileSystemProviderCapabilitiesChangeEvent,
  IFileSystemProviderRegistrationEvent,
  TextDocumentContentChangeEvent,
} from './files';
import { IFileServiceWatcher } from './watcher';

export const IFileServiceClient = IFileServiceClientToken;

export interface IFileServiceClient {
  initialize?: () => Promise<void>;
  shouldWaitProvider(scheme: string): Promise<boolean>;

  onFilesChanged: Event<FileChangeEvent>;

  onFileProviderChanged: Event<string[]>;

  registerProvider(scheme: string, provider: FileSystemProvider): IDisposable;

  handlesScheme(scheme: string): boolean;

  /**
   * Read the entire contents of a file.
   * @deprecated please use readFile instead
   * @param uri The uri of the file.
   * @return An array of bytes or a thenable that resolves to such.
   * @throws [`FileNotFound`](#FileSystemError.FileNotFound) when `uri` doesn't exist.
   * @throws [`FileIsADirectory`](#FileSystemError.FileIsADirectory) when `uri` is a directory.
   * @throws [`FileIsNoPermissions`](#FileSystemError.FileIsNoPermissions) when `uri` has no permissions.
   */
  resolveContent(uri: string, options?: FileSetContentOptions): Promise<{ content: string }>;

  readFile(uri: string): Promise<{ content: BinaryBuffer }>;

  /**
   * Read the file stat
   * @param uri {string} The uri of the file.
   * @param withChildren {boolean} [true]
   */
  getFileStat(uri: string, withChildren?: boolean): Promise<FileStat | undefined>;

  getFileType(uri: string): Promise<string | undefined>;

  setContent(file: FileStat, content: string | Uint8Array, options?: FileSetContentOptions): Promise<FileStat | void>;

  updateContent(
    file: FileStat,
    contentChanges: TextDocumentContentChangeEvent[],
    options?: FileSetContentOptions,
  ): Promise<void | FileStat>;

  createFile(uri: string, options?: FileCreateOptions): Promise<FileStat>;

  createFolder(uri: string): Promise<FileStat>;

  access(uri: string, mode?: number): Promise<boolean>;

  move(sourceUri: string, targetUri: string, options?: FileMoveOptions): Promise<FileStat>;

  copy(sourceUri: string, targetUri: string, options?: FileCopyOptions): Promise<FileStat>;

  delete(uri: string, options?: FileDeleteOptions);

  getCurrentUserHome(): Promise<FileStat | undefined>;

  fireFilesChange(event: DidFilesChangedParams): void;

  watchFileChanges(uri: URI, excludes?: string[]): Promise<IFileServiceWatcher>;

  unwatchFileChanges(watchId: number): Promise<void>;

  reconnect(): Promise<void>;

  dispose(): void;

  setWatchFileExcludes(excludes: string[]): Promise<void>;

  getWatchFileExcludes(): Promise<string[]>;

  setFilesExcludes(excludes: string[], roots: string[]): Promise<void>;

  getFsPath(uri: string): Promise<string | undefined>;

  setWorkspaceRoots(roots: string[]): Promise<void>;

  getEncoding(uri: string): Promise<string>;

  isReadonly(uri: string): Promise<boolean>;

  listCapabilities(): Iterable<{ scheme: string; capabilities: FileSystemProviderCapabilities }>;

  readonly onDidChangeFileSystemProviderRegistrations: Event<IFileSystemProviderRegistrationEvent>;

  readonly onDidChangeFileSystemProviderCapabilities: Event<IFileSystemProviderCapabilitiesChangeEvent>;

  readonly onWillActivateFileSystemProvider: Event<IFileSystemProviderActivationEvent>;
}

export interface IBrowserFileSystemRegistry {
  registerFileSystemProvider(provider: IFileSystemProvider): IDisposable;
}

export const IBrowserFileSystemRegistry = Symbol('IBrowserFileSystemRegistry');

export interface IFileSystemProvider {
  scheme: string;
}
