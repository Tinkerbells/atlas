/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *-------------------------------------------------------------------------------------------- */

// Adapted from VS Code's files.test.ts for Atlas (vitest).

import { describe, expect, it } from "vitest";
import { URI } from "@platform/common/uri/uri";

import type { IFileChange } from "../../common/files";

import { FileChangesEvent, FileChangeType, isParent } from "../../common/files";

function toResource(path: string): URI {
  return URI.file(path);
}

describe("files", () => {
  describe("fileChangesEvent", () => {
    it("basics", () => {
      const changes: IFileChange[] = [
        { resource: toResource("/foo/updated.txt"), type: FileChangeType.UPDATED },
        { resource: toResource("/foo/otherupdated.txt"), type: FileChangeType.UPDATED },
        { resource: toResource("/added.txt"), type: FileChangeType.ADDED },
        { resource: toResource("/bar/deleted.txt"), type: FileChangeType.DELETED },
        { resource: toResource("/bar/folder"), type: FileChangeType.DELETED },
        { resource: toResource("/BAR/FOLDER"), type: FileChangeType.DELETED },
      ];

      for (const ignorePathCasing of [false, true]) {
        const event = new FileChangesEvent(changes, ignorePathCasing);

        expect(event.contains(toResource("/foo"), FileChangeType.UPDATED)).toBe(false);
        expect(event.affects(toResource("/foo"), FileChangeType.UPDATED)).toBe(true);
        expect(event.contains(toResource("/foo/updated.txt"), FileChangeType.UPDATED)).toBe(true);
        expect(event.affects(toResource("/foo/updated.txt"), FileChangeType.UPDATED)).toBe(true);
        expect(event.contains(toResource("/foo/updated.txt"), FileChangeType.UPDATED, FileChangeType.ADDED)).toBe(true);
        expect(event.affects(toResource("/foo/updated.txt"), FileChangeType.UPDATED, FileChangeType.ADDED)).toBe(true);
        expect(event.contains(toResource("/foo/updated.txt"), FileChangeType.UPDATED, FileChangeType.ADDED, FileChangeType.DELETED)).toBe(true);
        expect(event.contains(toResource("/foo/updated.txt"), FileChangeType.ADDED, FileChangeType.DELETED)).toBe(false);
        expect(event.contains(toResource("/foo/updated.txt"), FileChangeType.ADDED)).toBe(false);
        expect(event.contains(toResource("/foo/updated.txt"), FileChangeType.DELETED)).toBe(false);
        expect(event.affects(toResource("/foo/updated.txt"), FileChangeType.DELETED)).toBe(false);

        expect(event.contains(toResource("/bar/folder"), FileChangeType.DELETED)).toBe(true);
        expect(event.contains(toResource("/BAR/FOLDER"), FileChangeType.DELETED)).toBe(true);
        expect(event.affects(toResource("/BAR"), FileChangeType.DELETED)).toBe(true);
        if (ignorePathCasing) {
          expect(event.contains(toResource("/BAR/folder"), FileChangeType.DELETED)).toBe(true);
          expect(event.affects(toResource("/bar"), FileChangeType.DELETED)).toBe(true);
        }
        else {
          expect(event.contains(toResource("/BAR/folder"), FileChangeType.DELETED)).toBe(false);
          expect(event.affects(toResource("/bar"), FileChangeType.DELETED)).toBe(true);
        }
        expect(event.contains(toResource("/bar/folder/somefile"), FileChangeType.DELETED)).toBe(true);
        expect(event.contains(toResource("/bar/folder/somefile/test.txt"), FileChangeType.DELETED)).toBe(true);
        expect(event.contains(toResource("/BAR/FOLDER/somefile/test.txt"), FileChangeType.DELETED)).toBe(true);
        if (ignorePathCasing) {
          expect(event.contains(toResource("/BAR/folder/somefile/test.txt"), FileChangeType.DELETED)).toBe(true);
        }
        else {
          expect(event.contains(toResource("/BAR/folder/somefile/test.txt"), FileChangeType.DELETED)).toBe(false);
        }
        expect(event.contains(toResource("/bar/folder2/somefile"), FileChangeType.DELETED)).toBe(false);

        expect(event.gotAdded()).toBe(true);
        expect(event.gotUpdated()).toBe(true);
        expect(event.gotDeleted()).toBe(true);
      }
    });

    it("supports multiple changes on file tree", () => {
      for (const type of [FileChangeType.ADDED, FileChangeType.UPDATED, FileChangeType.DELETED]) {
        const changes: IFileChange[] = [
          { resource: toResource("/foo/bar/updated.txt"), type },
          { resource: toResource("/foo/bar/otherupdated.txt"), type },
          { resource: toResource("/foo/bar"), type },
          { resource: toResource("/foo"), type },
          { resource: toResource("/bar"), type },
          { resource: toResource("/bar/foo"), type },
          { resource: toResource("/bar/foo/updated.txt"), type },
          { resource: toResource("/bar/foo/otherupdated.txt"), type },
        ];

        for (const ignorePathCasing of [false, true]) {
          const event = new FileChangesEvent(changes, ignorePathCasing);

          for (const change of changes) {
            expect(event.contains(change.resource, type)).toBe(true);
            expect(event.affects(change.resource, type)).toBe(true);
          }

          expect(event.affects(toResource("/foo"), type)).toBe(true);
          expect(event.affects(toResource("/bar"), type)).toBe(true);
          expect(event.affects(toResource("/"), type)).toBe(true);
          expect(event.affects(toResource("/foobar"), type)).toBe(false);

          expect(event.contains(toResource("/some/foo/bar"), type)).toBe(false);
          expect(event.affects(toResource("/some/foo/bar"), type)).toBe(false);
          expect(event.contains(toResource("/some/bar"), type)).toBe(false);
          expect(event.affects(toResource("/some/bar"), type)).toBe(false);
        }
      }
    });

    it("correlation", () => {
      let changes: IFileChange[] = [
        { resource: toResource("/foo/updated.txt"), type: FileChangeType.UPDATED },
        { resource: toResource("/foo/otherupdated.txt"), type: FileChangeType.UPDATED },
        { resource: toResource("/added.txt"), type: FileChangeType.ADDED },
      ];

      let event: FileChangesEvent = new FileChangesEvent(changes, true);
      expect(event.hasCorrelation()).toBe(false);
      expect(event.correlates(100)).toBe(false);

      changes = [
        { resource: toResource("/foo/updated.txt"), type: FileChangeType.UPDATED, cId: 100 },
        { resource: toResource("/foo/otherupdated.txt"), type: FileChangeType.UPDATED, cId: 100 },
        { resource: toResource("/added.txt"), type: FileChangeType.ADDED, cId: 100 },
      ];

      event = new FileChangesEvent(changes, true);
      expect(event.hasCorrelation()).toBe(true);
      expect(event.correlates(100)).toBe(true);
      expect(event.correlates(120)).toBe(false);

      changes = [
        { resource: toResource("/foo/updated.txt"), type: FileChangeType.UPDATED, cId: 100 },
        { resource: toResource("/foo/otherupdated.txt"), type: FileChangeType.UPDATED },
        { resource: toResource("/added.txt"), type: FileChangeType.ADDED, cId: 100 },
      ];

      event = new FileChangesEvent(changes, true);
      expect(event.hasCorrelation()).toBe(false);
      expect(event.correlates(100)).toBe(false);
      expect(event.correlates(120)).toBe(false);

      changes = [
        { resource: toResource("/foo/updated.txt"), type: FileChangeType.UPDATED, cId: 100 },
        { resource: toResource("/foo/otherupdated.txt"), type: FileChangeType.UPDATED, cId: 120 },
        { resource: toResource("/added.txt"), type: FileChangeType.ADDED, cId: 100 },
      ];

      event = new FileChangesEvent(changes, true);
      expect(event.hasCorrelation()).toBe(false);
      expect(event.correlates(100)).toBe(false);
      expect(event.correlates(120)).toBe(false);
    });
  });

  describe("isParent", () => {
    it("handles windows paths (ignoreCase)", () => {
      if (process.platform !== "win32") {
        return;
      }
      expect(isParent("c:\\some\\path", "c:\\", true)).toBe(true);
      expect(isParent("c:\\some\\path", "c:\\some", true)).toBe(true);
      expect(isParent("c:\\some\\path", "c:\\some\\", true)).toBe(true);
      expect(isParent("c:\\someöäü\\path", "c:\\someöäü", true)).toBe(true);
      expect(isParent("c:\\someöäü\\path", "c:\\someöäü\\", true)).toBe(true);
      expect(isParent("c:\\foo\\bar\\test.ts", "c:\\foo\\bar", true)).toBe(true);
      expect(isParent("c:\\foo\\bar\\test.ts", "c:\\foo\\bar\\", true)).toBe(true);

      expect(isParent("c:\\some\\path", "C:\\", true)).toBe(true);
      expect(isParent("c:\\some\\path", "c:\\SOME", true)).toBe(true);
      expect(isParent("c:\\some\\path", "c:\\SOME\\", true)).toBe(true);

      expect(isParent("c:\\some\\path", "d:\\", true)).toBe(false);
      expect(isParent("c:\\some\\path", "c:\\some\\path", true)).toBe(false);
      expect(isParent("c:\\some\\path", "d:\\some\\path", true)).toBe(false);
      expect(isParent("c:\\foo\\bar\\test.ts", "c:\\foo\\barr", true)).toBe(false);
      expect(isParent("c:\\foo\\bar\\test.ts", "c:\\foo\\bar\\test", true)).toBe(false);
    });

    it("handles posix paths (ignoreCase)", () => {
      expect(isParent("/some/path", "/", true)).toBe(true);
      expect(isParent("/some/path", "/some", true)).toBe(true);
      expect(isParent("/some/path", "/some/", true)).toBe(true);
      expect(isParent("/someöäü/path", "/someöäü", true)).toBe(true);
      expect(isParent("/someöäü/path", "/someöäü/", true)).toBe(true);
      expect(isParent("/foo/bar/test.ts", "/foo/bar", true)).toBe(true);
      expect(isParent("/foo/bar/test.ts", "/foo/bar/", true)).toBe(true);

      expect(isParent("/some/path", "/SOME", true)).toBe(true);
      expect(isParent("/some/path", "/SOME/", true)).toBe(true);
      expect(isParent("/someöäü/path", "/SOMEÖÄÜ", true)).toBe(true);
      expect(isParent("/someöäü/path", "/SOMEÖÄÜ/", true)).toBe(true);

      expect(isParent("/some/path", "/some/path", true)).toBe(false);
      expect(isParent("/foo/bar/test.ts", "/foo/barr", true)).toBe(false);
      expect(isParent("/foo/bar/test.ts", "/foo/bar/test", true)).toBe(false);
    });

    it("handles corner cases", () => {
      expect(isParent("", "", true)).toBe(false);
      expect(isParent("/some/path", "/some/other/path", true)).toBe(false);
    });
  });
});
